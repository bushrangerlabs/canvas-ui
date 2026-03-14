"""Canvas UI Services - File operations for dashboard storage."""

import json
import logging
import os
import re
import urllib.parse
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.helpers import aiohttp_client
from homeassistant.helpers import config_validation as cv
from homeassistant.util import file as file_util

from .const import CONF_PIXABAY_API_KEY, DOMAIN, PIXABAY_IMAGES_DIR, PIXABAY_LOCAL_URL_PREFIX
from .file_operations import create_folder
from .file_operations import delete_file as delete_file_op
from .file_operations import download_file, get_file_info
from .file_operations import list_files as list_files_op
from .file_operations import rename_file, upload_file

_LOGGER = logging.getLogger(__name__)

# Service schemas
WRITE_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
        vol.Required("data"): cv.string,
    }
)

READ_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

DELETE_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

LIST_FILES_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

# New file operation schemas
GET_FILE_INFO_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

CREATE_FOLDER_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

UPLOAD_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
        vol.Required("data"): cv.string,
        vol.Optional("overwrite", default=False): cv.boolean,
    }
)

DOWNLOAD_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
    }
)

RENAME_FILE_SCHEMA = vol.Schema(
    {
        vol.Required("old_path"): cv.string,
        vol.Required("new_path"): cv.string,
    }
)

DELETE_FILE_OP_SCHEMA = vol.Schema(
    {
        vol.Required("path"): cv.string,
        vol.Required("confirm"): cv.boolean,
    }
)

LIST_FILES_OP_SCHEMA = vol.Schema(
    {
        vol.Optional("path", default="/config/www"): cv.string,
        vol.Optional("recursive", default=False): cv.boolean,
        vol.Optional("file_filter"): cv.string,
    }
)

CACHE_ICON_SCHEMA = vol.Schema(
    {
        vol.Required("icon_name"): cv.string,
        vol.Required("icon_data"): dict,
    }
)

PIXABAY_SEARCH_SCHEMA = vol.Schema(
    {
        vol.Required("query"): cv.string,
        vol.Optional("image_type", default="all"): cv.string,
        vol.Optional("category", default=""): cv.string,
        vol.Optional("per_page", default=20): vol.All(int, vol.Range(min=3, max=200)),
        vol.Optional("page", default=1): vol.All(int, vol.Range(min=1)),
    }
)

PIXABAY_DOWNLOAD_IMAGE_SCHEMA = vol.Schema(
    {
        vol.Required("url"): cv.string,
        vol.Optional("filename", default=""): cv.string,
    }
)


def setup_services(hass: HomeAssistant) -> None:
    """Register Canvas UI services."""

    import sys

    print(
        "*** CANVAS UI DEBUG: setup_services() called - registering all services",
        file=sys.stderr,
        flush=True,
    )

    async def handle_write_file(call: ServiceCall) -> None:
        """Handle write_file service call."""
        filepath = call.data["path"]
        data = call.data["data"]

        try:
            # Validate path (security check)
            if not _is_safe_path(hass, filepath):
                _LOGGER.error(f"Unsafe file path: {filepath}")
                raise ValueError("Invalid file path")

            # Ensure directory exists
            full_path = Path(hass.config.path(filepath))
            await hass.async_add_executor_job(
                lambda: full_path.parent.mkdir(parents=True, exist_ok=True)
            )

            # Write file asynchronously
            await hass.async_add_executor_job(full_path.write_text, data, "utf-8")

            _LOGGER.info(f"[Canvas UI] Wrote file: {filepath}")

        except Exception as error:
            _LOGGER.error(f"Failed to write file {filepath}: {error}")
            raise

    async def handle_read_file(call: ServiceCall) -> dict[str, Any]:
        """Handle read_file service call."""
        filepath = call.data["path"]

        try:
            # Validate path (security check)
            if not _is_safe_path(hass, filepath):
                _LOGGER.error(f"Unsafe file path: {filepath}")
                raise ValueError("Invalid file path")

            full_path = Path(hass.config.path(filepath))

            # Check if file exists (async)
            exists = await hass.async_add_executor_job(full_path.exists)
            if not exists:
                _LOGGER.debug(f"File not found: {filepath}")
                return {"data": None, "exists": False}

            # Read file asynchronously
            data = await hass.async_add_executor_job(full_path.read_text, "utf-8")

            _LOGGER.debug(f"[Canvas UI] Read file: {filepath}")

            return {"data": data, "exists": True}

        except Exception as error:
            _LOGGER.error(f"Failed to read file {filepath}: {error}")
            raise

    async def handle_delete_file(call: ServiceCall) -> None:
        """Handle delete_file service call."""
        filepath = call.data["path"]

        try:
            # Validate path (security check)
            if not _is_safe_path(hass, filepath):
                _LOGGER.error(f"Unsafe file path: {filepath}")
                raise ValueError("Invalid file path")

            full_path = Path(hass.config.path(filepath))

            # Check if file exists (async)
            exists = await hass.async_add_executor_job(full_path.exists)

            # Delete file if exists
            if exists:
                await hass.async_add_executor_job(full_path.unlink)
                _LOGGER.info(f"[Canvas UI] Deleted file: {filepath}")
            else:
                _LOGGER.warning(f"File not found (cannot delete): {filepath}")

        except Exception as error:
            _LOGGER.error(f"Failed to delete file {filepath}: {error}")
            raise

    async def handle_list_files(call: ServiceCall) -> dict[str, Any]:
        """Handle list_files service call."""
        dirpath = call.data["path"]

        try:
            # Validate path (security check)
            if not _is_safe_path(hass, dirpath):
                _LOGGER.error(f"Unsafe directory path: {dirpath}")
                raise ValueError("Invalid directory path")

            full_path = Path(hass.config.path(dirpath))

            # Check if directory exists (async)
            exists = await hass.async_add_executor_job(full_path.exists)
            if not exists:
                return {"files": [], "exists": False}

            is_dir = await hass.async_add_executor_job(full_path.is_dir)
            if not is_dir:
                _LOGGER.error(f"Path is not a directory: {dirpath}")
                raise ValueError("Path is not a directory")

            # List files asynchronously
            def _list_files():
                files = []
                for item in full_path.iterdir():
                    if item.is_file():
                        files.append(
                            {
                                "name": item.name,
                                "size": item.stat().st_size,
                                "modified": item.stat().st_mtime,
                            }
                        )
                return files

            files = await hass.async_add_executor_job(_list_files)

            _LOGGER.info(f"[Canvas UI] Listed {len(files)} files in: {dirpath}")

            return {"files": files, "exists": True}

        except Exception as error:
            _LOGGER.error(f"Failed to list files in {dirpath}: {error}")
            raise

    # New file operation handlers
    async def handle_list_files_op(call: ServiceCall) -> dict[str, Any]:
        """Handle advanced list_files operation."""
        path = call.data.get("path", "/config/www")
        recursive = call.data.get("recursive", False)
        file_filter = call.data.get("file_filter")

        # Force output to stderr
        import sys

        print(
            f"*** CANVAS UI DEBUG: list_files_op called with path={path}, recursive={recursive}, file_filter={file_filter}",
            file=sys.stderr,
            flush=True,
        )

        _LOGGER.info(
            f"[Canvas UI] list_files_op called with path={path}, recursive={recursive}, file_filter={file_filter}"
        )

        try:
            result = await hass.async_add_executor_job(
                list_files_op, path, recursive, file_filter
            )

            # list_files_op now returns a dict with {files, path, parent, count}
            files = result.get("files", [])

            print(
                f"*** CANVAS UI DEBUG: list_files_op got {len(files)} files, returning them",
                file=sys.stderr,
                flush=True,
            )
            print(
                f"*** CANVAS UI DEBUG: First 3 files: {files[:3]}",
                file=sys.stderr,
                flush=True,
            )

            _LOGGER.info(
                f"[Canvas UI] list_files_op returned {len(files)} files from: {path}"
            )
            return result  # Return the full dict with files, path, parent, count

        except Exception as error:
            print(
                f"*** CANVAS UI DEBUG: Exception in list_files_op: {error}",
                file=sys.stderr,
                flush=True,
            )
            _LOGGER.error(f"Failed to list files: {error}", exc_info=True)
            return {"files": [], "error": str(error)}

    async def handle_get_file_info(call: ServiceCall) -> dict[str, Any]:
        """Handle get_file_info operation."""
        path = call.data["path"]

        try:
            result = await hass.async_add_executor_job(get_file_info, path)
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to get file info: {error}")
            return {"error": str(error)}

    async def handle_create_folder(call: ServiceCall) -> dict[str, Any]:
        """Handle create_folder operation."""
        path = call.data["path"]

        try:
            result = await hass.async_add_executor_job(create_folder, path)
            if result["success"]:
                _LOGGER.info(f"[Canvas UI] {result['message']}")
            else:
                _LOGGER.warning(f"[Canvas UI] {result['message']}")
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to create folder: {error}")
            return {"success": False, "message": str(error)}

    async def handle_upload_file(call: ServiceCall) -> dict[str, Any]:
        """Handle upload_file operation."""
        path = call.data["path"]
        data = call.data["data"]
        overwrite = call.data.get("overwrite", False)

        try:
            result = await hass.async_add_executor_job(
                upload_file, path, data, overwrite
            )
            if result["success"]:
                _LOGGER.info(f"[Canvas UI] {result['message']}")
            else:
                _LOGGER.warning(f"[Canvas UI] {result['message']}")
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to upload file: {error}")
            return {"success": False, "message": str(error)}

    async def handle_download_file(call: ServiceCall) -> dict[str, Any]:
        """Handle download_file operation."""
        path = call.data["path"]

        try:
            result = await hass.async_add_executor_job(download_file, path)
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to download file: {error}")
            return {"success": False, "message": str(error)}

    async def handle_rename_file(call: ServiceCall) -> dict[str, Any]:
        """Handle rename_file operation."""
        old_path = call.data["old_path"]
        new_path = call.data["new_path"]

        try:
            result = await hass.async_add_executor_job(rename_file, old_path, new_path)
            if result["success"]:
                _LOGGER.info(f"[Canvas UI] {result['message']}")
            else:
                _LOGGER.warning(f"[Canvas UI] {result['message']}")
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to rename file: {error}")
            return {"success": False, "message": str(error)}

    async def handle_delete_file_op(call: ServiceCall) -> dict[str, Any]:
        """Handle advanced delete_file operation."""
        path = call.data["path"]
        confirm = call.data["confirm"]

        try:
            result = await hass.async_add_executor_job(delete_file_op, path, confirm)
            if result["success"]:
                _LOGGER.info(f"[Canvas UI] {result['message']}")
            else:
                _LOGGER.warning(f"[Canvas UI] {result['message']}")
            return result

        except Exception as error:
            _LOGGER.error(f"Failed to delete file: {error}")
            return {"success": False, "message": str(error)}

    async def handle_cache_icon(call: ServiceCall) -> dict[str, Any]:
        """Handle cache_icon service call - cache icon to icon-cache.json."""
        icon_name = call.data["icon_name"]
        icon_data = call.data["icon_data"]

        try:
            # Path to icon cache file
            cache_path = hass.config.path("www/canvas-ui/icon-cache.json")

            # Ensure directory exists
            cache_dir = os.path.dirname(cache_path)
            os.makedirs(cache_dir, exist_ok=True)

            # Load existing cache
            cache = {}
            if os.path.exists(cache_path):
                try:
                    with open(cache_path, "r") as f:
                        cache = json.load(f)
                except Exception as e:
                    _LOGGER.warning(f"Could not load icon cache, creating new: {e}")
                    cache = {}

            # Add/update icon
            cache[icon_name] = icon_data

            # Save cache
            with open(cache_path, "w") as f:
                json.dump(cache, f, indent=2)

            _LOGGER.debug(f"Icon cached: {icon_name}")
            return {
                "success": True,
                "icon_name": icon_name,
                "cache_size": len(cache),
            }

        except Exception as e:
            _LOGGER.error(f"Failed to cache icon {icon_name}: {e}")
            return {
                "success": False,
                "error": str(e),
            }

    # Register services
    hass.services.async_register(
        DOMAIN,
        "write_file",
        handle_write_file,
        schema=WRITE_FILE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "read_file",
        handle_read_file,
        schema=READ_FILE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "delete_file",
        handle_delete_file,
        schema=DELETE_FILE_SCHEMA,
    )

    hass.services.async_register(
        DOMAIN,
        "list_files",
        handle_list_files,
        schema=LIST_FILES_SCHEMA,
    )

    # Register new file operation services
    import sys

    print(
        "*** CANVAS UI DEBUG: About to register list_files_op service",
        file=sys.stderr,
        flush=True,
    )

    hass.services.async_register(
        DOMAIN,
        "list_files_op",
        handle_list_files_op,
        schema=LIST_FILES_OP_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    print(
        "*** CANVAS UI DEBUG: list_files_op service registered successfully",
        file=sys.stderr,
        flush=True,
    )

    hass.services.async_register(
        DOMAIN,
        "get_file_info",
        handle_get_file_info,
        schema=GET_FILE_INFO_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "create_folder",
        handle_create_folder,
        schema=CREATE_FOLDER_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "upload_file",
        handle_upload_file,
        schema=UPLOAD_FILE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "download_file",
        handle_download_file,
        schema=DOWNLOAD_FILE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "rename_file",
        handle_rename_file,
        schema=RENAME_FILE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "delete_file_op",
        handle_delete_file_op,
        schema=DELETE_FILE_OP_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "cache_icon",
        handle_cache_icon,
        schema=CACHE_ICON_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    async def handle_pixabay_search(call: ServiceCall) -> dict[str, Any]:
        """Handle pixabay_search service call — query Pixabay image API."""
        query = call.data["query"]
        image_type = call.data.get("image_type", "all")
        category = call.data.get("category", "")
        per_page = call.data.get("per_page", 20)
        page = call.data.get("page", 1)

        api_key = _get_pixabay_key(hass)
        if not api_key:
            return {"success": False, "error": "Pixabay API key not configured. Set it in Canvas UI integration options."}

        params: dict[str, Any] = {
            "key": api_key,
            "q": query,
            "image_type": image_type,
            "per_page": per_page,
            "page": page,
            "safesearch": "true",
        }
        if category:
            params["category"] = category

        try:
            session = aiohttp_client.async_get_clientsession(hass)
            async with session.get("https://pixabay.com/api/", params=params) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    return {"success": False, "error": f"Pixabay API error {resp.status}: {text[:200]}"}
                data = await resp.json()
            return {
                "success": True,
                "hits": data.get("hits", []),
                "total": data.get("total", 0),
                "totalHits": data.get("totalHits", 0),
            }
        except Exception as e:
            _LOGGER.error(f"[Canvas UI] Pixabay search failed: {e}")
            return {"success": False, "error": str(e)}

    async def handle_pixabay_download_image(call: ServiceCall) -> dict[str, Any]:
        """Handle pixabay_download_image — download a Pixabay image to local storage."""
        import uuid

        url = call.data["url"]
        filename = call.data.get("filename", "")

        if not filename:
            url_filename = url.split("/")[-1].split("?")[0]
            filename = url_filename if url_filename else f"pixabay_{uuid.uuid4().hex[:8]}.jpg"

        # Sanitize filename
        filename = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)

        images_dir = hass.config.path(PIXABAY_IMAGES_DIR)
        os.makedirs(images_dir, exist_ok=True)
        local_file = os.path.join(images_dir, filename)

        try:
            session = aiohttp_client.async_get_clientsession(hass)
            async with session.get(url) as resp:
                if resp.status != 200:
                    return {"success": False, "error": f"Download failed with HTTP {resp.status}"}
                content = await resp.read()

            with open(local_file, "wb") as f:
                f.write(content)

            local_path = f"{PIXABAY_LOCAL_URL_PREFIX}/{filename}"
            _LOGGER.info(f"[Canvas UI] Downloaded Pixabay image: {local_path}")
            return {"success": True, "local_path": local_path, "filename": filename}
        except Exception as e:
            _LOGGER.error(f"[Canvas UI] Pixabay download failed: {e}")
            return {"success": False, "error": str(e)}

    hass.services.async_register(
        DOMAIN,
        "pixabay_search",
        handle_pixabay_search,
        schema=PIXABAY_SEARCH_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    hass.services.async_register(
        DOMAIN,
        "pixabay_download_image",
        handle_pixabay_download_image,
        schema=PIXABAY_DOWNLOAD_IMAGE_SCHEMA,
        supports_response=SupportsResponse.ONLY,
    )

    _LOGGER.info(
        "[Canvas UI] Services registered: write_file, read_file, delete_file, list_files, "
        "list_files_op, get_file_info, create_folder, upload_file, download_file, rename_file, "
        "delete_file_op, cache_icon, pixabay_search, pixabay_download_image"
    )


def _is_safe_path(hass: HomeAssistant, filepath: str) -> bool:
    """Check if path is safe (within config directory)."""
    try:
        # Resolve full path
        full_path = Path(hass.config.path(filepath)).resolve()
        config_path = Path(hass.config.path()).resolve()

        # Check if path is within config directory
        return str(full_path).startswith(str(config_path))

    except Exception:
        return False


def _get_pixabay_key(hass: HomeAssistant) -> str:
    """Return the Pixabay API key from the first configured Canvas UI entry that has one."""
    entries = hass.config_entries.async_entries(DOMAIN)
    for entry in entries:
        key = entry.options.get(CONF_PIXABAY_API_KEY, "") or entry.data.get(CONF_PIXABAY_API_KEY, "")
        if key:
            return key
    return ""
