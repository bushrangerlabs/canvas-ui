/**
 * Canvas UI Panel - React App Integration
 * Passes Home Assistant authentication to React app
 */
class CanvasUIPanel extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
    this.hass = null;
  }

  async connectedCallback() {
    // Hide this custom element - React renders directly in document.body
    this.style.display = "none";

    if (this._hass) {
      this._storeAuth();
    }

    if (this._loaded) return;
    this._loaded = true;

    // Calculate sidebar width using actual DOM measurements
    const calculateSidebarWidth = () => {
      const panelCustom = this.closest("ha-panel-custom");
      if (panelCustom) {
        const rect = panelCustom.getBoundingClientRect();
        if (rect.left > 0) return Math.round(rect.left);
      }
      if (this.offsetLeft > 0) return this.offsetLeft;
      const resolver = document.querySelector("partial-panel-resolver");
      if (resolver) {
        const rect = resolver.getBoundingClientRect();
        if (rect.left > 0) return Math.round(rect.left);
      }
      const main = document.querySelector("home-assistant-main");
      if (main && main.hasAttribute("expanded")) return 256;
      return 56;
    };

    const sidebarWidth = calculateSidebarWidth();

    let root = document.getElementById("root");
    if (!root) {
      root = document.createElement("div");
      root.id = "root";
      root.style.cssText = `position: fixed; top: 0; left: ${sidebarWidth}px; width: calc(100% - ${sidebarWidth}px); height: 100vh; margin: 0; padding: 0; z-index: 1; transition: left 0.2s ease, width 0.2s ease;`;
      document.body.appendChild(root);

      const updatePosition = () => {
        const newWidth = calculateSidebarWidth();
        root.style.left = `${newWidth}px`;
        root.style.width = `calc(100% - ${newWidth}px)`;
        window.HASidebarWidth = newWidth;
        window.dispatchEvent(
          new CustomEvent("ha-sidebar-width-changed", {
            detail: { width: newWidth },
          }),
        );
      };

      let lastKnownWidth = sidebarWidth;
      const pollInterval = setInterval(() => {
        const currentWidth = calculateSidebarWidth();
        if (currentWidth !== lastKnownWidth) {
          lastKnownWidth = currentWidth;
          updatePosition();
        }
      }, 200);

      this._pollInterval = pollInterval;
    } else {
      root.style.display = "block";
    }

    window.HASidebarWidth = sidebarWidth;

    try {
      const response = await fetch("/local/canvas-ui/app.html");
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const scripts = doc.querySelectorAll('script[type="module"]');

      scripts.forEach((script) => {
        const newScript = document.createElement("script");
        newScript.type = "module";
        if (script.src) {
          let srcPath = script.getAttribute("src");
          if (srcPath.startsWith("http://") || srcPath.startsWith("https://")) {
            const url = new URL(srcPath);
            srcPath = url.pathname;
          }
          newScript.src = srcPath;
        } else {
          newScript.textContent = script.textContent;
        }
        document.head.appendChild(newScript);
      });
    } catch (e) {
      console.error("[Canvas UI Panel] Failed to load app:", e);
      root.innerHTML =
        '<div style="color: red; padding: 20px;">Failed to load Canvas UI</div>';
    }
  }

  disconnectedCallback() {
    if (this._pollInterval) clearInterval(this._pollInterval);
    const root = document.getElementById("root");
    if (root) root.style.display = "none";
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) window.hass = hass;
    if (hass && !this._initialized) {
      this._storeAuth();
      this._initialized = true;
    }
  }

  get hass() {
    return this._hass;
  }

  _storeAuth() {
    if (!this._hass || !this._hass.connection) return;
    try {
      const auth = this._hass.connection.options.auth;
      localStorage.setItem(
        "hassTokens",
        JSON.stringify({
          hassUrl: window.location.origin,
          access_token: auth.accessToken,
          token_type: "Bearer",
          expires_at: auth.expires,
        }),
      );
    } catch (e) {
      console.error("[Canvas UI Panel] Failed to store auth:", e);
    }
  }
}

// Prevent duplicate registration
if (!customElements.get("canvas-ui-panel")) {
  customElements.define("canvas-ui-panel", CanvasUIPanel);
}
