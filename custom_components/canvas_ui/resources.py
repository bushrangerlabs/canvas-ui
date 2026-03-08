"""Lovelace resources configuration for Canvas UI."""

RESOURCES = [
    {
        "url": "/local/canvas-ui/canvas-ui-panel.js?v="
        + str(__import__("time").time()),
        "type": "module",
        "description": "Canvas UI Custom Panel",
    }
]
