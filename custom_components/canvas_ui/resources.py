"""Lovelace resources configuration for Canvas UI."""

RESOURCES = [
    {
        "url": "/canvas-ui-static/canvas-ui-panel.js?v="
        + str(__import__("time").time()),
        "type": "module",
        "description": "Canvas UI Custom Panel",
    }
]
