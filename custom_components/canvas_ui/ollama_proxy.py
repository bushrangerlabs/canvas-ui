"""Ollama API Proxy for Canvas UI.

Proxies Ollama API requests through Home Assistant to avoid CORS issues.
Provides authentication and security while maintaining Canvas UI access
to Ollama services.

Architecture:
    Browser → HA API Proxy → Ollama
    (same origin, no CORS)   (server-to-server)

Configure the Ollama URL via the Canvas UI integration options in Settings →
Devices & Services → Canvas UI → Configure.
Default: http://localhost:11434
"""

import logging

import aiohttp
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import DEFAULT_OLLAMA_URL, DOMAIN

_LOGGER = logging.getLogger(__name__)

# Extended timeout for AI operations (streaming, embeddings, large models)
OLLAMA_TIMEOUT = aiohttp.ClientTimeout(total=120)


def _get_ollama_url(hass: HomeAssistant) -> str:
    """Read the configured Ollama base URL from the active config entry."""
    if DOMAIN in hass.data:
        for entry_data in hass.data[DOMAIN].values():
            if isinstance(entry_data, dict) and "ollama_url" in entry_data:
                return entry_data["ollama_url"].rstrip("/")
    return DEFAULT_OLLAMA_URL


class OllamaProxyView(HomeAssistantView):
    """Proxy Ollama API requests — adds HA authentication and avoids CORS."""

    url = "/api/canvas_ui/ollama/{path:.*}"
    name = "api:canvas_ui:ollama"
    requires_auth = True  # HA authentication required

    async def post(self, request: web.Request, path: str) -> web.Response:
        """Proxy POST requests to Ollama API."""
        ollama_url = _get_ollama_url(request.app["hass"])
        target = f"{ollama_url}/api/{path}"

        try:
            data = await request.json()
            _LOGGER.debug("Ollama proxy POST → %s", target)

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    target,
                    json=data,
                    timeout=OLLAMA_TIMEOUT,
                ) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        _LOGGER.error(
                            "Ollama API error (%s): %s", resp.status, error_text
                        )
                        return self.json(
                            {"error": f"Ollama returned {resp.status}"},
                            status_code=resp.status,
                        )
                    return self.json(await resp.json())

        except aiohttp.ClientError as err:
            _LOGGER.error("Ollama connection error: %s", err)
            return self.json(
                {"error": "Cannot connect to Ollama", "details": str(err)},
                status_code=502,
            )
        except Exception as err:
            _LOGGER.error("Ollama proxy error: %s", err, exc_info=True)
            return self.json(
                {"error": "Internal proxy error", "details": str(err)},
                status_code=500,
            )

    async def get(self, request: web.Request, path: str) -> web.Response:
        """Proxy GET requests to Ollama API."""
        ollama_url = _get_ollama_url(request.app["hass"])
        target = f"{ollama_url}/api/{path}"

        try:
            _LOGGER.debug("Ollama proxy GET → %s", target)

            async with aiohttp.ClientSession() as session:
                async with session.get(
                    target,
                    timeout=OLLAMA_TIMEOUT,
                ) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        _LOGGER.error(
                            "Ollama API error (%s): %s", resp.status, error_text
                        )
                        return self.json(
                            {"error": f"Ollama returned {resp.status}"},
                            status_code=resp.status,
                        )
                    return self.json(await resp.json())

        except aiohttp.ClientError as err:
            _LOGGER.error("Ollama connection error: %s", err)
            return self.json(
                {"error": "Cannot connect to Ollama", "details": str(err)},
                status_code=502,
            )
        except Exception as err:
            _LOGGER.error("Ollama proxy error: %s", err, exc_info=True)
            return self.json(
                {"error": "Internal proxy error", "details": str(err)},
                status_code=500,
            )


def setup_ollama_proxy(hass: HomeAssistant, entry: ConfigEntry | None = None) -> None:
    """Register Ollama proxy HTTP view and store configured URL."""
    if entry is not None:
        # Store configured URL so _get_ollama_url can find it
        hass.data.setdefault(DOMAIN, {})
        hass.data[DOMAIN].setdefault(entry.entry_id, {})
        hass.data[DOMAIN][entry.entry_id]["ollama_url"] = entry.options.get(
            "ollama_url", DEFAULT_OLLAMA_URL
        )

    _LOGGER.info("Canvas UI: registering Ollama proxy at /api/canvas_ui/ollama/")
    hass.http.register_view(OllamaProxyView())
