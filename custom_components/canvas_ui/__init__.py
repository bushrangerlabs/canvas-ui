"""Canvas UI Integration for Home Assistant."""

import json
import logging
import os
import time

from homeassistant.components import panel_custom
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .ollama_proxy import setup_ollama_proxy
from .services import setup_services

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = []

# Track if panel is already registered (prevents duplicate registration)
_PANEL_REGISTERED = False

# Track if static path is already registered
_STATIC_REGISTERED = False


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Canvas UI integration from YAML config."""
    _LOGGER.info("🎨 Canvas UI v0.5.0b1 YAML setup")

    # Store domain data
    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    # Register services (ALWAYS register services in async_setup)
    setup_services(hass)

    # Register Ollama API proxy
    setup_ollama_proxy(hass)

    # Register static files for frontend (served from inside the component)
    await _register_static_files(hass)

    # Register custom panel for direct access
    await _register_panel(hass)

    # Auto-create config entry if none exists (for config_flow integrations)
    existing_entries = hass.config_entries.async_entries(DOMAIN)
    if not existing_entries:
        _LOGGER.debug("No config entry found, creating default entry")
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN,
                context={"source": "import"},
                data={},
            )
        )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Canvas UI from a config entry."""
    _LOGGER.info(f"🎨 Canvas UI v0.5.0b1 Setting up: {entry.title}")

    # Register services
    setup_services(hass)

    # Register Ollama API proxy
    setup_ollama_proxy(hass)

    # Register static files for frontend (served from inside the component)
    await _register_static_files(hass)

    # Register custom panel
    await _register_panel(hass)

    # Store entry
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Auto-register Lovelace resource if enabled
    if entry.options.get("auto_register_resources", True):
        await _setup_lovelace_resource(hass)

    # Setup platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(async_update_entry))

    _LOGGER.info("✅ Canvas UI setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload Canvas UI config entry."""
    _LOGGER.debug("Canvas UI unloading")

    # Unload platforms
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)

    return unload_ok


async def async_update_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    _LOGGER.debug("Canvas UI options updated")
    await hass.config_entries.async_reload(entry.entry_id)


async def _register_static_files(hass: HomeAssistant) -> None:
    """Register Canvas UI frontend files as static HTTP path."""
    global _STATIC_REGISTERED
    if _STATIC_REGISTERED:
        return

    frontend_path = os.path.join(os.path.dirname(__file__), "frontend")
    if not os.path.isdir(frontend_path):
        _LOGGER.error(f"Canvas UI frontend directory not found: {frontend_path}")
        _STATIC_REGISTERED = True
        return

    # Try modern HA API (2024.4+) first, fall back to legacy
    try:
        from homeassistant.components.http import StaticPathConfig
        await hass.http.async_register_static_paths([
            StaticPathConfig("/canvas-ui-static", frontend_path, cache_headers=False)
        ])
        _LOGGER.info("✅ Canvas UI static files registered at /canvas-ui-static (StaticPathConfig)")
    except (ImportError, AttributeError):
        hass.http.register_static_path("/canvas-ui-static", frontend_path, cache_headers=False)
        _LOGGER.info("✅ Canvas UI static files registered at /canvas-ui-static (legacy)")

    _STATIC_REGISTERED = True


async def _register_panel(hass: HomeAssistant) -> None:
    """Register Canvas UI custom panels (edit and kiosk modes)."""
    global _PANEL_REGISTERED

    # Check if already registered
    if _PANEL_REGISTERED:
        _LOGGER.debug("Canvas UI panels already registered, skipping")
        return

    try:
        timestamp = int(time.time())

        # Register EDIT panel (sidebar)
        _LOGGER.info("Registering Canvas UI Edit panel in sidebar")
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path="canvas-ui",
            webcomponent_name="canvas-ui-panel",
            sidebar_title="Canvas UI",
            sidebar_icon="mdi:view-dashboard-outline",
            module_url=f"/canvas-ui-static/canvas-ui-panel.js?v={timestamp}",
            embed_iframe=False,
            require_admin=False,
        )

        # Register PREVIEW/KIOSK panel (hidden from sidebar)
        # - Preview mode: /canvas-kiosk (shows HA chrome)
        # - Kiosk mode: /canvas-kiosk?view=viewname (hides HA chrome)
        _LOGGER.info("Registering Canvas UI Preview/Kiosk panel (hidden)")
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path="canvas-kiosk",
            webcomponent_name="canvas-kiosk-panel",
            sidebar_title=None,  # Hidden from sidebar
            sidebar_icon=None,
            module_url=f"/canvas-ui-static/canvas-kiosk-panel.js?v={timestamp}",
            embed_iframe=False,
            require_admin=False,
        )

        _PANEL_REGISTERED = True

        _LOGGER.info(
            "✅ Canvas UI panels registered successfully (edit + preview/kiosk)"
        )

    except Exception as e:
        _LOGGER.error(f"Failed to register Canvas UI panels: {e}", exc_info=True)


async def _setup_lovelace_resource(hass: HomeAssistant) -> None:
    """Automatically register Canvas UI as a Lovelace resource."""
    try:
        # Path to Lovelace storage
        storage_path = hass.config.path(".storage/lovelace.dashboard.default")

        # Get existing resources
        resources = []

        # Try to read from storage
        if os.path.exists(storage_path):
            try:
                with open(storage_path, "r") as f:
                    data = json.load(f)
                    if "data" in data and "resources" in data["data"]:
                        resources = data["data"]["resources"]
            except Exception as e:
                _LOGGER.warning(f"Could not read Lovelace storage: {e}")

        # Check if Canvas UI resource already exists
        canvas_url = "/canvas-ui-static/canvas-ui-panel.js"
        resource_exists = any(r.get("url") == canvas_url for r in resources)

        if not resource_exists:
            # Add Canvas UI resource
            resources.append(
                {
                    "url": canvas_url,
                    "type": "module",
                    "description": "Canvas UI Dashboard Editor",
                }
            )

            # Write back to storage
            if os.path.exists(storage_path):
                try:
                    with open(storage_path, "r") as f:
                        data = json.load(f)

                    if "data" not in data:
                        data["data"] = {}

                    data["data"]["resources"] = resources

                    with open(storage_path, "w") as f:
                        json.dump(data, f, indent=2)

                    _LOGGER.info("✅ Canvas UI resource auto-registered in Lovelace")
                except Exception as e:
                    _LOGGER.warning(f"Could not auto-register Canvas UI resource: {e}")
                    _LOGGER.info(
                        "You can manually add the resource to configuration.yaml:"
                    )
                    _LOGGER.info("lovelace:")
                    _LOGGER.info("  resources:")
                    _LOGGER.info("    - url: /canvas-ui-static/canvas-ui-panel.js")
                    _LOGGER.info("      type: module")
        else:
            _LOGGER.debug("Canvas UI resource already registered in Lovelace")

    except Exception as e:
        _LOGGER.warning(f"Error setting up Lovelace resource: {e}")
