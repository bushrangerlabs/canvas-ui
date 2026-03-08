/**
 * Canvas UI Preview/Kiosk Panel
 * Loads view.html (Runtime without MUI)
 * Detects ?kiosk=viewname to hide HA chrome for fullscreen
 */

class CanvasPreviewPanel extends HTMLElement {
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

    // Detect kiosk mode from URL parameter
    const kioskView = this._getKioskViewFromUrl();
    const isKioskMode = kioskView !== null;

    if (isKioskMode) {
      console.log(
        "[Canvas Preview] 🎭 Kiosk mode detected for view:",
        kioskView,
      );
      // Set hash to navigate to specific view
      if (kioskView) {
        window.location.hash = kioskView;
      }
      // Hide HA UI for fullscreen kiosk
      this._hideHAUI();
    } else {
      console.log("[Canvas Preview] Preview mode (HA chrome visible)");
    }

    // CRITICAL: Create #root BEFORE loading scripts
    if (!document.getElementById("root")) {
      const root = document.createElement("div");
      root.id = "root";
      document.body.appendChild(root);
      console.log("[Canvas Preview] Created #root element");
    }

    // Set flag so Runtime knows it's in HA panel mode
    window.__CANVAS_KIOSK_MODE__ = isKioskMode;
    console.log(
      "[Canvas Preview] Panel mode flag:",
      isKioskMode ? "kiosk" : "preview",
    );

    // Load view app CSS and JS
    await this._loadViewApp();
  }

  disconnectedCallback() {
    this._showHAUI();
  }

  _getKioskViewFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const kioskView = params.get("kiosk") || params.get("view");
    if (kioskView) {
      // Strip any escape characters or backslashes
      return kioskView.replace(/\\/g, "");
    }
    return null;
  }

  async _loadViewApp() {
    try {
      const response = await fetch("/canvas-ui-static/view.html");
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
            : `/canvas-ui-static/${href}`;
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
          newScript.src = src.startsWith("/") ? src : `/canvas-ui-static/${src}`;
          document.head.appendChild(newScript);
          console.log("[Canvas Preview] Loaded script:", newScript.src);
        }
      });
    } catch (error) {
      console.error("[Canvas Preview] Failed to load view app:", error);
    }
  }

  _hideHAUI() {
    if (document.getElementById("canvas-kiosk-hide-ha")) return;

    const style = document.createElement("style");
    style.id = "canvas-kiosk-hide-ha";
    style.textContent = `
      /* Hide HA sidebar and header for kiosk mode */
      ha-sidebar,
      ha-drawer,
      app-drawer,
      app-header,
      mwc-top-app-bar-fixed,
      .header,
      [slot="toolbar"] {
        display: none !important;
      }
      
      /* Remove margins/padding for fullscreen */
      home-assistant-main,
      partial-panel-resolver,
      ha-panel-custom {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Prevent scrollbars */
      body, html {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
    console.log("[Canvas Preview] HA chrome hidden for kiosk mode");
  }

  _showHAUI() {
    const style = document.getElementById("canvas-kiosk-hide-ha");
    if (style) {
      style.remove();
      console.log("[Canvas Preview] HA chrome restored");
    }
  }
}

// Prevent duplicate registration
if (!customElements.get("canvas-preview-panel")) {
  customElements.define("canvas-preview-panel", CanvasPreviewPanel);
}
