"""Config flow for Canvas UI integration."""

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN

DATA_SCHEMA = vol.Schema(
    {
        vol.Optional("name", default="Canvas UI"): cv.string,
    }
)


class CanvasUIConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Config flow for Canvas UI."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle a flow initialized by the user."""
        # Only allow one instance
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        if user_input is not None:
            return self.async_create_entry(
                title=user_input.get("name", "Canvas UI"),
                data=user_input,
                options={
                    "enable_editor": True,
                    "auto_register_resources": True,
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=DATA_SCHEMA,
        )

    async def async_step_import(self, import_data):
        """Handle import from configuration.yaml."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        return await self.async_step_user(import_data)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow."""
        return CanvasUIOptionsFlow(config_entry)


class CanvasUIOptionsFlow(config_entries.OptionsFlow):
    """Options flow for Canvas UI."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Handle options flow."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        "enable_editor",
                        default=self.config_entry.options.get("enable_editor", True),
                    ): cv.boolean,
                    vol.Optional(
                        "auto_register_resources",
                        default=self.config_entry.options.get(
                            "auto_register_resources", True
                        ),
                    ): cv.boolean,
                }
            ),
        )
