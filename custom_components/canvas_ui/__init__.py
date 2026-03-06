"""Canvas UI Integration for Home Assistant."""

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

# Prevent duplicate panel registration across calls
_PANEL_REGISTERED = False

# URL path where the bundled frontend is served
FRONTEND_URL_PATH = "/canvas-ui"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up Canvas UI integration from YAML config."""
    _LOGGER.info("Canvas UI: async_setup called")

    if DOMAIN not in hass.data:
        hass.data[DOMAIN] = {}

    # Register services early (needed even before config entry exists)
    setup_services(hass)

    # Register Ollama API proxy
    setup_ollama_proxy(hass)

    # Auto-create config entry if none exists
    existing_entries = hass.config_entries.async_entries(DOMAIN)
    if not existing_entries:
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
    _LOGGER.info("Canvas UI: setting up entry '%s'", entry.title)

    # Register services
    setup_services(hass)

    # Register Ollama API proxy (reads URL from entry options)
    setup_ollama_proxy(hass, entry)

    # Serve bundled frontend files
    frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
    if os.path.isdir(frontend_dir):
        hass.http.register_static_path(
            FRONTEND_URL_PATH, frontend_dir, cache_headers=False
        )
        _LOGGER.info(
            "Canvas UI: serving frontend at %s from %s",
            FRONTEND_URL_PATH,
            frontend_dir,
        )
    else:
        _LOGGER.error(
            "Canvas UI: frontend directory not found at %s — "
            "re-install the integration via HACS.",
            frontend_dir,
        )

    # Register sidebar and kiosk panels
    await _register_panel(hass)

    # Store entry data
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Setup platforms
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    # Listen for options updates
    entry.async_on_unload(entry.add_update_listener(async_update_entry))

    _LOGGER.info("Canvas UI: setup complete")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload Canvas UI config entry."""
    _LOGGER.debug("Canvas UI: unloading entry")

    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)

    return unload_ok


async def async_update_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle options update."""
    _LOGGER.debug("Canvas UI: options updated, reloading")
    await hass.config_entries.async_reload(entry.entry_id)


async def _register_panel(hass: HomeAssistant) -> None:
    """Register Canvas UI custom panels (editor + kiosk)."""
    global _PANEL_REGISTERED

    if _PANEL_REGISTERED:
        _LOGGER.debug("Canvas UI: panels already registered")
        return

    try:
        timestamp = int(time.time())

        # Main editor panel (shown in sidebar)
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path="canvas-ui",
            webcomponent_name="canvas-ui-panel",
            sidebar_title="Canvas UI",
            sidebar_icon="mdi:view-dashboard-outline",
            module_url=f"{FRONTEND_URL_PATH}/canvas-ui-panel.js?v={timestamp}",
            embed_iframe=False,
            require_admin=False,
        )

        # Preview / kiosk panel (hidden from sidebar; accessed at /canvas-kiosk)
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path="canvas-kiosk",
            webcomponent_name="canvas-kiosk-panel",
            sidebar_title=None,
            sidebar_icon=None,
            module_url=f"{FRONTEND_URL_PATH}/canvas-kiosk-panel.js?v={timestamp}",
            embed_iframe=False,
            require_admin=False,
        )

        _PANEL_REGISTERED = True
        _LOGGER.info("Canvas UI: panels registered (editor + kiosk)")

    except Exception as err:
        _LOGGER.error("Canvas UI: failed to register panels: %s", err, exc_info=True)
