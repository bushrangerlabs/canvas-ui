"""
File operations for Canvas UI.
Handles file listing, upload, download, rename, delete, and folder operations.
Security: All operations restricted to /config/www/ directory.
"""

import base64
import fnmatch
import json
import logging
import mimetypes
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional

from PIL import Image

_LOGGER = logging.getLogger(__name__)

# Security: Only allow operations within /config/www/
ALLOWED_BASE_PATH = "/config/www"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_FILES_PER_UPLOAD = 10

# File listing options (HASS Configurator inspired)
DIRSFIRST = True  # Show directories before files
HIDEHIDDEN = False  # Hide files starting with '.'
IGNORE_PATTERN = (
    []
)  # List of fnmatch patterns to ignore (e.g., ['*.tmp', '__pycache__'])

# File type categories
FILE_CATEGORIES = {
    "images": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".bmp", ".ico"],
    "videos": [".mp4", ".webm", ".ogg", ".avi", ".mov", ".mkv"],
    "audio": [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"],
    "programming": [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".css",
        ".scss",
        ".html",
        ".vue",
        ".json",
        ".yaml",
        ".yml",
    ],
    "text": [".txt", ".md", ".log", ".csv", ".xml"],
    "fonts": [".ttf", ".otf", ".woff", ".woff2", ".eot"],
    "all": [],  # Empty list means all files
}


def validate_path(path: str) -> Path:
    """
    Validate that path is within allowed directory.
    Uses HASS Configurator's is_safe_path() pattern for enhanced security.
    Raises ValueError if path is invalid or outside allowed area.
    """
    # Normalize path
    resolved_path = Path(path).resolve()
    allowed_base = Path(ALLOWED_BASE_PATH).resolve()

    # Enhanced security: Check both realpath (follows symlinks) and abspath (doesn't follow symlinks)
    # This prevents path traversal attacks via symlinks
    realpath_check = os.path.realpath(str(resolved_path)).startswith(str(allowed_base))
    abspath_check = os.path.abspath(str(resolved_path)).startswith(str(allowed_base))

    if not (realpath_check and abspath_check):
        raise ValueError(f"Access denied: Path must be within {ALLOWED_BASE_PATH}")

    # Additional check using Path.relative_to()
    try:
        resolved_path.relative_to(allowed_base)
    except ValueError:
        raise ValueError(f"Access denied: Path must be within {ALLOWED_BASE_PATH}")

    return resolved_path


def get_file_info(path: str) -> Dict:
    """
    Get detailed information about a file.
    Returns: {name, path, type, size, modified, mime_type, dimensions (for images)}
    """
    validated_path = validate_path(path)

    if not validated_path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    stat = validated_path.stat()
    mime_type, _ = mimetypes.guess_type(str(validated_path))

    info = {
        "name": validated_path.name,
        "path": str(validated_path),
        "type": "directory" if validated_path.is_dir() else "file",
        "size": stat.st_size if validated_path.is_file() else 0,
        "modified": stat.st_mtime,
        "created": stat.st_ctime,  # Created/changed time (HASS Configurator pattern)
        "mime_type": mime_type or "application/octet-stream",
        "extension": validated_path.suffix.lower(),
    }

    # Add image dimensions if it's an image
    if validated_path.is_file() and mime_type and mime_type.startswith("image/"):
        try:
            with Image.open(validated_path) as img:
                info["dimensions"] = {"width": img.width, "height": img.height}
        except Exception as e:
            _LOGGER.warning(f"Could not read image dimensions for {path}: {e}")

    return info


def list_files(
    path: str = ALLOWED_BASE_PATH,
    recursive: bool = False,
    file_filter: Optional[str] = None,
) -> Dict:
    """
    List files and folders in a directory.

    Args:
        path: Directory path to list
        recursive: If True, list all subdirectories
        file_filter: Category filter (images, videos, audio, programming, text, fonts, all)

    Returns:
        Dict with keys: files (list), path (str), parent (str|None), count (int)
    """
    _LOGGER.info(
        f"[Canvas UI] list_files called: path={path}, recursive={recursive}, file_filter={file_filter}"
    )

    validated_path = validate_path(path)

    if not validated_path.exists():
        raise FileNotFoundError(f"Directory not found: {path}")

    if not validated_path.is_dir():
        raise ValueError(f"Path is not a directory: {path}")

    files = []

    # Get allowed extensions for filter
    allowed_extensions = FILE_CATEGORIES.get(file_filter or "all", [])
    _LOGGER.info(
        f"[Canvas UI] file_filter='{file_filter}', allowed_extensions={allowed_extensions}"
    )

    def should_include(file_path: Path) -> bool:
        """Check if file should be included based on filter"""
        # HASS Configurator pattern: Hide hidden files if enabled
        if HIDEHIDDEN and file_path.name.startswith("."):
            return False

        # HASS Configurator pattern: Pattern-based filtering
        if IGNORE_PATTERN:
            for pattern in IGNORE_PATTERN:
                if fnmatch.fnmatch(file_path.name, pattern):
                    _LOGGER.debug(
                        f"[Canvas UI] Ignoring {file_path.name} (matches pattern: {pattern})"
                    )
                    return False

        if file_path.is_dir():
            return True  # Always include directories (unless hidden/ignored)

        if not allowed_extensions:  # "all" filter
            return True

        return file_path.suffix.lower() in allowed_extensions

    try:
        if recursive:
            for item in validated_path.rglob("*"):
                if should_include(item):
                    try:
                        files.append(get_file_info(str(item)))
                    except Exception as e:
                        _LOGGER.warning(f"Error reading file info for {item}: {e}")
        else:
            item_count = 0
            for item in validated_path.iterdir():
                item_count += 1
                included = should_include(item)
                _LOGGER.debug(
                    f"[Canvas UI] Item: {item.name}, is_dir={item.is_dir()}, included={included}"
                )
                if included:
                    try:
                        file_info = get_file_info(str(item))
                        files.append(file_info)
                        _LOGGER.debug(f"[Canvas UI] Added: {file_info['name']}")
                    except Exception as e:
                        _LOGGER.warning(f"Error reading file info for {item}: {e}")

            _LOGGER.info(
                f"[Canvas UI] Scanned {item_count} items, included {len(files)} files"
            )
    except PermissionError as e:
        _LOGGER.error(f"Permission denied listing {path}: {e}")
        raise ValueError(f"Permission denied: {path}")

    # HASS Configurator pattern: DIRSFIRST sorting option
    if DIRSFIRST:
        # Separate directories and files, sort each group alphabetically
        directories = [f for f in files if f["type"] == "directory"]
        regular_files = [f for f in files if f["type"] != "directory"]

        directories.sort(key=lambda x: x["name"].lower())
        regular_files.sort(key=lambda x: x["name"].lower())

        files = directories + regular_files
        _LOGGER.debug(
            f"[Canvas UI] Sorted DIRSFIRST: {len(directories)} dirs, {len(regular_files)} files"
        )
    else:
        # Sort all together alphabetically
        files.sort(key=lambda x: x["name"].lower())

    _LOGGER.info(f"[Canvas UI] list_files returning {len(files)} files from {path}")

    # HASS Configurator pattern: Include parent directory info
    parent_path = (
        str(validated_path.parent) if validated_path.parent != validated_path else None
    )

    return {
        "files": files,
        "path": str(validated_path),
        "parent": parent_path,
        "count": len(files),
    }


def create_folder(path: str) -> Dict:
    """
    Create a new folder.
    Returns: {success: bool, path: str, message: str}
    """
    validated_path = validate_path(path)

    if validated_path.exists():
        return {
            "success": False,
            "path": str(validated_path),
            "message": f"Folder already exists: {validated_path.name}",
        }

    try:
        validated_path.mkdir(parents=True, exist_ok=True)
        return {
            "success": True,
            "path": str(validated_path),
            "message": f"Folder created: {validated_path.name}",
        }
    except Exception as e:
        _LOGGER.error(f"Error creating folder {path}: {e}")
        return {
            "success": False,
            "path": path,
            "message": f"Error creating folder: {str(e)}",
        }


def upload_file(path: str, data: str, overwrite: bool = False) -> Dict:
    """
    Upload a file (base64 encoded data).

    Args:
        path: Destination file path
        data: Base64 encoded file data
        overwrite: Allow overwriting existing files

    Returns: {success: bool, path: str, size: int, message: str}
    """
    validated_path = validate_path(path)

    # Check if file exists
    if validated_path.exists() and not overwrite:
        return {
            "success": False,
            "path": str(validated_path),
            "message": f"File already exists: {validated_path.name}",
        }

    try:
        # Decode base64 data
        file_data = base64.b64decode(data)

        # Check file size
        if len(file_data) > MAX_FILE_SIZE:
            return {
                "success": False,
                "path": str(validated_path),
                "message": f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024):.1f}MB",
            }

        # Create parent directories if needed
        validated_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        validated_path.write_bytes(file_data)

        return {
            "success": True,
            "path": str(validated_path),
            "size": len(file_data),
            "message": f"File uploaded: {validated_path.name}",
        }

    except Exception as e:
        _LOGGER.error(f"Error uploading file {path}: {e}")
        return {
            "success": False,
            "path": path,
            "message": f"Error uploading file: {str(e)}",
        }


def download_file(path: str) -> Dict:
    """
    Download a file as base64 encoded data.
    Returns: {success: bool, data: str, mime_type: str, size: int}
    """
    validated_path = validate_path(path)

    if not validated_path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    if not validated_path.is_file():
        raise ValueError(f"Path is not a file: {path}")

    try:
        # Read file
        file_data = validated_path.read_bytes()

        # Check size
        if len(file_data) > MAX_FILE_SIZE:
            return {
                "success": False,
                "message": f"File too large to download. Max size: {MAX_FILE_SIZE / (1024*1024):.1f}MB",
            }

        # Encode to base64
        encoded_data = base64.b64encode(file_data).decode("utf-8")

        mime_type, _ = mimetypes.guess_type(str(validated_path))

        return {
            "success": True,
            "data": encoded_data,
            "mime_type": mime_type or "application/octet-stream",
            "size": len(file_data),
        }

    except Exception as e:
        _LOGGER.error(f"Error downloading file {path}: {e}")
        return {"success": False, "message": f"Error downloading file: {str(e)}"}


def rename_file(old_path: str, new_path: str) -> Dict:
    """
    Rename or move a file/folder.
    Returns: {success: bool, old_path: str, new_path: str, message: str}
    """
    validated_old = validate_path(old_path)
    validated_new = validate_path(new_path)

    if not validated_old.exists():
        return {
            "success": False,
            "old_path": str(validated_old),
            "new_path": str(validated_new),
            "message": f"Source not found: {validated_old.name}",
        }

    if validated_new.exists():
        return {
            "success": False,
            "old_path": str(validated_old),
            "new_path": str(validated_new),
            "message": f"Destination already exists: {validated_new.name}",
        }

    try:
        # Create parent directories if needed
        validated_new.parent.mkdir(parents=True, exist_ok=True)

        # Rename/move
        validated_old.rename(validated_new)

        return {
            "success": True,
            "old_path": str(validated_old),
            "new_path": str(validated_new),
            "message": f"Renamed: {validated_old.name} → {validated_new.name}",
        }

    except Exception as e:
        _LOGGER.error(f"Error renaming {old_path} to {new_path}: {e}")
        return {
            "success": False,
            "old_path": old_path,
            "new_path": new_path,
            "message": f"Error renaming: {str(e)}",
        }


def delete_file(path: str, confirm: bool = False) -> Dict:
    """
    Delete a file or folder.

    Args:
        path: Path to delete
        confirm: Must be True to actually delete (safety check)

    Returns: {success: bool, path: str, message: str}
    """
    if not confirm:
        return {
            "success": False,
            "path": path,
            "message": "Delete confirmation required (confirm=True)",
        }

    validated_path = validate_path(path)

    if not validated_path.exists():
        return {
            "success": False,
            "path": str(validated_path),
            "message": f"Not found: {validated_path.name}",
        }

    try:
        if validated_path.is_dir():
            shutil.rmtree(validated_path)
            message = f"Folder deleted: {validated_path.name}"
        else:
            validated_path.unlink()
            message = f"File deleted: {validated_path.name}"

        return {"success": True, "path": str(validated_path), "message": message}

    except Exception as e:
        _LOGGER.error(f"Error deleting {path}: {e}")
        return {"success": False, "path": path, "message": f"Error deleting: {str(e)}"}
