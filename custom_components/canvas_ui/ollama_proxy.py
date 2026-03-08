"""Ollama API Proxy for Canvas UI.

Proxies Ollama API requests through Home Assistant to avoid CORS issues.
Provides authentication, logging, and security while maintaining Canvas UI
access to Ollama services.

Architecture:
    Browser (192.168.1.103) → HA API Proxy → Ollama (192.168.1.204)
    (same origin, no CORS)      (server-to-server)

Benefits:
    - Same origin (no CORS restrictions)
    - HA authentication required
    - Ollama stays private (no network exposure)
    - Full HA logging and monitoring
    - Rate limiting capability
    - "The HA way" - consistent with HA architecture
"""

import logging
from typing import Any

import aiohttp
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

# Ollama server URL (internal network)
OLLAMA_BASE_URL = "http://192.168.1.204:11434"

# Extended timeout for AI operations (streaming, embeddings, large models)
OLLAMA_TIMEOUT = aiohttp.ClientTimeout(total=120)


class OllamaProxyView(HomeAssistantView):
    """Proxy Ollama API requests to avoid CORS while adding HA security."""

    url = "/api/canvas_ui/ollama/{path:.*}"
    name = "api:canvas_ui:ollama"
    requires_auth = True  # HA authentication required

    async def post(self, request: web.Request, path: str) -> web.Response:
        """Proxy POST requests to Ollama API."""
        try:
            # Parse request body
            data = await request.json()

            _LOGGER.debug(f"Ollama proxy POST: /api/{path}")

            # Forward to Ollama server
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{OLLAMA_BASE_URL}/api/{path}",
                    json=data,
                    timeout=OLLAMA_TIMEOUT,
                ) as resp:
                    # Check if response is successful
                    if resp.status != 200:
                        error_text = await resp.text()
                        _LOGGER.error(f"Ollama API error ({resp.status}): {error_text}")
                        return self.json(
                            {"error": f"Ollama API returned {resp.status}"},
                            status_code=resp.status,
                        )

                    # Forward Ollama response to Canvas UI
                    result = await resp.json()
                    return self.json(result)

        except aiohttp.ClientError as e:
            _LOGGER.error(f"Ollama connection error: {e}")
            return self.json(
                {
                    "error": "Cannot connect to Ollama server",
                    "details": str(e),
                },
                status_code=502,
            )
        except Exception as e:
            _LOGGER.error(f"Ollama proxy error: {e}", exc_info=True)
            return self.json(
                {"error": "Internal proxy error", "details": str(e)},
                status_code=500,
            )

    async def get(self, request: web.Request, path: str) -> web.Response:
        """Proxy GET requests to Ollama API."""
        try:
            _LOGGER.debug(f"Ollama proxy GET: /api/{path}")

            # Forward to Ollama server
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{OLLAMA_BASE_URL}/api/{path}",
                    timeout=OLLAMA_TIMEOUT,
                ) as resp:
                    # Check if response is successful
                    if resp.status != 200:
                        error_text = await resp.text()
                        _LOGGER.error(f"Ollama API error ({resp.status}): {error_text}")
                        return self.json(
                            {"error": f"Ollama API returned {resp.status}"},
                            status_code=resp.status,
                        )

                    # Forward Ollama response to Canvas UI
                    result = await resp.json()
                    return self.json(result)

        except aiohttp.ClientError as e:
            _LOGGER.error(f"Ollama connection error: {e}")
            return self.json(
                {
                    "error": "Cannot connect to Ollama server",
                    "details": str(e),
                },
                status_code=502,
            )
        except Exception as e:
            _LOGGER.error(f"Ollama proxy error: {e}", exc_info=True)
            return self.json(
                {"error": "Internal proxy error", "details": str(e)},
                status_code=500,
            )


def setup_ollama_proxy(hass: HomeAssistant) -> None:
    """Register Ollama proxy HTTP view."""
    _LOGGER.info("🔌 Registering Ollama API proxy at /api/canvas_ui/ollama/")
    hass.http.register_view(OllamaProxyView())
    _LOGGER.info("✅ Ollama proxy registered successfully")
