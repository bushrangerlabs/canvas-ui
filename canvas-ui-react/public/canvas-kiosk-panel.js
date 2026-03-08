/**
 * Canvas UI Kiosk Panel - Loads view.html inside HA with hidden chrome
 */

class CanvasKioskPanel extends HTMLElement {
  constructor() {
    super();
    this._loaded = false;
  }

  async connectedCallback() {
    // Hide this custom element
    this.style.display = "none";

    // Don't reload if already loaded
    if (this._loaded) return;
    this._loaded = true;

    // Get view name from URL and set hash
    const viewName = this._getViewFromUrl();
    if (viewName) {
      window.location.hash = viewName;
    }

    // CRITICAL: Hide HA UI FIRST before loading anything
    this._hideHAUI();

    // CRITICAL: Create #root BEFORE loading scripts
    if (!document.getElementById("root")) {
      const root = document.createElement("div");
      root.id = "root";
      document.body.appendChild(root);
      console.log("[Canvas Kiosk] Created #root element");
    }

    // Set flag so Runtime knows it's in HA panel mode
    window.__CANVAS_KIOSK_MODE__ = true;
    console.log("[Canvas Kiosk] Set kiosk mode flag");

    // Load view app CSS and JS
    await this._loadViewApp();
  }

  disconnectedCallback() {
    this._showHAUI();
  }

  _getViewFromUrl() {
    // Read view from hash (#view-name)
    const viewName = window.location.hash.slice(1) || "";
    return viewName.replace(/\\/g, "");
  }

  async _loadViewApp() {
    try {
      const response = await fetch("/local/canvas-ui/view.html");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Load CSS first
      doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const href = link.getAttribute("href");
        if (!document.querySelector(`link[href*="${href}"]`)) {
          const newLink = document.createElement("link");
          newLink.rel = "stylesheet";
          newLink.href = href.startsWith("/")
            ? href
            : `/local/canvas-ui/${href}`;
          document.head.appendChild(newLink);
        }
      });

      // Then load JS modules
      doc.querySelectorAll('script[type="module"]').forEach((script) => {
        const src = script.getAttribute("src");
        if (src && !document.querySelector(`script[src*="${src}"]`)) {
          const newScript = document.createElement("script");
          newScript.type = "module";
          newScript.crossOrigin = "";
          newScript.src = src.startsWith("/") ? src : `/local/canvas-ui/${src}`;
          document.head.appendChild(newScript);
          console.log("[Canvas Kiosk] Loaded script:", newScript.src);
        }
      });
    } catch (error) {
      console.error("[Canvas Kiosk] Failed to load view app:", error);
    }
  }

  _hideHAUI() {
    if (document.getElementById("canvas-kiosk-hide-ha")) return;

    const style = document.createElement("style");
    style.id = "canvas-kiosk-hide-ha";
    style.textContent = `
      /* Hide ALL HA UI elements */
      ha-sidebar,
      ha-drawer,
      .mdc-drawer,
      app-drawer,
      app-header,
      mwc-top-app-bar-fixed,
      .header,
      [slot="toolbar"],
      ha-menu-button,
      ha-button-menu {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Force full width for content containers */
      home-assistant,
      home-assistant-main,
      partial-panel-resolver,
      ha-panel-custom,
      #view {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      /* Ensure body/html are full viewport */
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
      }
      
      /* Position root above HA elements */
      #root {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 9999 !important;
      }
      
    `;
    document.head.appendChild(style);
    console.log("[Canvas Kiosk] HA UI hidden with aggressive CSS");
  }

  _showHAUI() {
    const style = document.getElementById("canvas-kiosk-hide-ha");
    if (style) {
      style.remove();
    }
  }
}

// Prevent duplicate registration
if (!customElements.get("canvas-kiosk-panel")) {
  customElements.define("canvas-kiosk-panel", CanvasKioskPanel);
}
