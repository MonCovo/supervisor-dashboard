/**
 * Supervisor Dashboard Widget
 * Card-based dashboard for WxCC Global Variables with visual status indicators.
 * Supports Boolean (toggles), String (textareas), and other types (Integer, Float, Date, etc.) with single-line edit and Apply.
 */

// Default API base - overridden by api-region attribute (eu1, eu2, na1, etc.)
const WXCC_API_BASE_DEFAULT = "https://api.wxcc-eu1.cisco.com";
const SUCCESS_MSG_DURATION_MS = 4000;
const MAX_STRING_LENGTH = 256;

const API_REGION_HOSTS = {
  eu1: "https://api.wxcc-eu1.cisco.com",
  eu2: "https://api.wxcc-eu2.cisco.com",
  na1: "https://api.wxcc-na1.cisco.com",
};

// Display order for variable type sections and filter buttons
const TYPE_ORDER = ["Boolean", "String", "Integer", "Float", "Decimal", "Date", "DateTime", "Other"];

// Momentum Design tokens (Cisco Webex design system) + dark mode
const MD = {
  primary: "#00A0D1",
  primaryHover: "#007AA3",
  gray70: "rgba(0,0,0,0.7)",
  gray50: "rgba(0,0,0,0.5)",
  gray16: "rgba(0,0,0,0.16)",
  gray12: "rgba(0,0,0,0.12)",
  white: "#FFFFFF",
  error: "#D72E15",
  success: "#10893E",
  successBg: "rgba(16,137,62,0.12)",
  /* Dark mode */
  darkBg: "#1a1a1a",
  darkCard: "#2d2d2d",
  darkBorder: "rgba(255,255,255,0.12)",
  darkText: "rgba(255,255,255,0.9)",
  darkMuted: "rgba(255,255,255,0.55)",
  darkInputBg: "#383838",
  darkSuccessBg: "rgba(16,137,62,0.2)",
  darkErrorBg: "rgba(215,46,21,0.15)",
};

// Inline SVG icons
const ICONS = {
  toggle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3"/></svg>',
  message: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  other: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
};

const style = document.createElement("style");
style.textContent = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap");
*, *::before, *::after { box-sizing: border-box; }

:host {
  display: block;
  position: relative;
  height: 100%;
  max-height: 100vh; /* fallback when parent doesn't set height (e.g. Desktop panel) */
  min-height: 0;
  overflow: hidden;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: ${MD.gray70};
}

/* Scrollable content area - fills host and scrolls when cards overflow */
#content {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}
#content::-webkit-scrollbar {
  width: 8px;
}
#content::-webkit-scrollbar-track {
  background: ${MD.gray12};
  border-radius: 4px;
}
#content::-webkit-scrollbar-thumb {
  background: ${MD.gray16};
  border-radius: 4px;
}
#content::-webkit-scrollbar-thumb:hover {
  background: ${MD.gray50};
}

.loading, .error { padding: 24px; text-align: center; }

/* Dashboard grid */
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* Variable cards */
.var-card {
  background: ${MD.white};
  border-radius: 8px;
  box-shadow: 0 2px 4px ${MD.gray12};
  padding: 20px;
  transition: box-shadow 150ms, border-color 150ms, transform 150ms;
  border: 2px solid transparent;
}
.var-card:hover {
  box-shadow: 0 4px 12px ${MD.gray16};
}
.var-card:focus-within {
  box-shadow: 0 0 0 2px ${MD.primary};
}
.var-card--changed {
  border-color: ${MD.primary};
  box-shadow: 0 2px 8px rgba(0,160,209,0.2);
}

.var-card__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.var-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${MD.gray12};
  border-radius: 8px;
  color: ${MD.primary};
}

.var-card__title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: ${MD.gray70};
  margin: 0;
  line-height: 1.4;
}
.var-card__subtitle {
  font-size: 12px;
  font-weight: 400;
  color: ${MD.gray50};
  margin: 2px 0 0 0;
  line-height: 1.4;
}
.var-card__type-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  color: ${MD.gray50};
  background: ${MD.gray12};
  padding: 2px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.status-badge--on {
  background: ${MD.successBg};
  color: ${MD.success};
}
.status-badge--off {
  background: ${MD.gray12};
  color: ${MD.gray50};
}

/* Card body and controls */
.var-card__body {
  margin-top: 12px;
}

.var-card__controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

/* Momentum-style toggle */
.md-toggle {
  position: relative; width: 44px; height: 24px; flex-shrink: 0;
  -webkit-user-select: none; user-select: none;
}
.md-toggle__input { position: absolute; opacity: 0; margin: 0; width: 0; height: 0; }
.md-toggle__track {
  display: block; width: 100%; height: 100%; cursor: pointer;
  border-radius: 24px; border: none; transition: background 250ms;
  background: ${MD.gray16};
}
.md-toggle__track::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  background: ${MD.white}; border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.32); transition: transform 250ms;
}
.md-toggle__input:checked + .md-toggle__track {
  background: ${MD.primary};
}
.md-toggle__input:checked + .md-toggle__track::after {
  transform: translateX(20px);
}
.md-toggle__input:focus + .md-toggle__track {
  outline: none; box-shadow: 0 0 0 2px ${MD.primary};
}

/* Button */
.md-btn {
  padding: 8px 16px; font-size: 14px; font-weight: 500;
  border: none; border-radius: 4px; cursor: pointer;
  transition: background 150ms;
}
.md-btn--primary { background: ${MD.primary}; color: ${MD.white}; }
.md-btn--primary:hover:not(:disabled) { background: ${MD.primaryHover}; }
.md-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.md-btn--secondary { background: ${MD.gray16}; color: ${MD.gray70}; }
.md-btn--secondary:hover:not(:disabled) { background: ${MD.gray12}; }
.md-btn--has-changes { background: ${MD.primary}; color: ${MD.white}; }
.md-btn--loading { position: relative; color: transparent; pointer-events: none; }
.md-btn--loading::after {
  content: ""; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  border: 2px solid ${MD.white}; border-top-color: transparent; border-radius: 4px;
  width: 18px; height: 18px; margin: auto; animation: spin 0.6s linear infinite;
}

/* Textarea and text-style input */
.md-input {
  width: 100%; min-height: 80px; padding: 12px;
  font-family: inherit; font-size: 14px; line-height: 1.5;
  border: 1px solid ${MD.gray16}; border-radius: 4px;
  resize: vertical; transition: border-color 150ms;
}
input.md-input.other-value { min-height: 0; resize: none; }
.md-input:focus { outline: none; border-color: ${MD.primary}; }
.char-count { font-size: 12px; color: ${MD.gray50}; margin-top: 4px; }
.char-count--over { color: ${MD.error}; }

.msg-feedback {
  min-height: 24px; margin-top: 20px; padding: 12px 16px; font-size: 13px;
  border-radius: 8px; border: 1px solid transparent;
}
.msg-feedback:not(:empty) { margin-bottom: 8px; }
.msg-feedback.msg-feedback--error { background: rgba(215,46,21,0.08); border-color: rgba(215,46,21,0.3); }
.msg-feedback.msg-feedback--success { background: ${MD.successBg}; border-color: rgba(16,137,62,0.3); }

.dashboard-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid ${MD.gray12};
}
.dashboard-header__title { font-size: 18px; font-weight: 600; color: ${MD.gray70}; margin: 0; }
.dashboard-header__meta { font-size: 13px; color: ${MD.gray50}; }

.empty-state {
  text-align: center; padding: 32px 24px; background: ${MD.white}; border-radius: 8px;
  border: 1px dashed ${MD.gray16}; color: ${MD.gray50}; font-size: 14px;
}
.empty-state__icon { margin-bottom: 12px; opacity: 0.6; }
.empty-state__icon svg { width: 48px; height: 48px; }
.empty-state__text { margin: 0; font-size: 14px; }
.section-block { margin-top: 28px; }
.section-block:first-of-type { margin-top: 0; }

/* Search / filter bar */
.filter-bar {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${MD.gray12};
}
.filter-bar__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${MD.gray50};
  margin-bottom: 8px;
}
.filter-bar__input {
  width: 100%;
  max-width: 320px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid ${MD.gray16};
  border-radius: 6px;
  color: ${MD.gray70};
  transition: border-color 150ms;
}
.filter-bar__input::placeholder {
  color: ${MD.gray50};
}
.filter-bar__input:focus {
  outline: none;
  border-color: ${MD.primary};
}

.type-filter { margin-bottom: 16px; }
.type-filter__buttons {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
}
.type-filter__btn {
  padding: 6px 14px; font-size: 13px; font-weight: 500;
  border: 1px solid ${MD.gray16}; border-radius: 6px;
  background: ${MD.white}; color: ${MD.gray70};
  cursor: pointer; transition: background 150ms, border-color 150ms;
}
.type-filter__btn:hover { background: ${MD.gray12}; border-color: ${MD.gray16}; }
.type-filter__btn--active {
  background: ${MD.primary}; color: ${MD.white}; border-color: ${MD.primary};
}
.type-filter__btn--active:hover { background: ${MD.primaryHover}; border-color: ${MD.primaryHover}; }

/* Section titles */
.section-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: ${MD.gray50};
  margin: 0 0 12px 0; padding-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.loading::before {
  content: ""; display: inline-block; width: 20px; height: 20px;
  border: 2px solid ${MD.primary}; border-top-color: transparent;
  border-radius: 50%; animation: spin 0.8s linear infinite;
  margin-right: 8px; vertical-align: middle;
}

/* Dark mode: applied when host has .dark-mode (set from attribute or prefers-color-scheme) */
:host(.dark-mode) {
  color: ${MD.darkText};
  background: ${MD.darkBg};
}
:host(.dark-mode) #content { background: ${MD.darkBg}; }
:host(.dark-mode) #content::-webkit-scrollbar-track { background: ${MD.darkBorder}; }
:host(.dark-mode) #content::-webkit-scrollbar-thumb { background: ${MD.darkMuted}; }
:host(.dark-mode) #content::-webkit-scrollbar-thumb:hover { background: ${MD.darkText}; }

:host(.dark-mode) .loading,
:host(.dark-mode) .error {
  color: ${MD.darkText};
  background: ${MD.darkBg};
}
:host(.dark-mode) .loading::before { border-color: ${MD.primary}; border-top-color: transparent; }

:host(.dark-mode) .var-card {
  background: ${MD.darkCard};
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  border-color: transparent;
}
:host(.dark-mode) .var-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
:host(.dark-mode) .var-card:focus-within { box-shadow: 0 0 0 2px ${MD.primary}; }
:host(.dark-mode) .var-card--changed {
  border-color: ${MD.primary};
  box-shadow: 0 2px 8px rgba(0,160,209,0.35);
}

:host(.dark-mode) .var-card__icon {
  background: rgba(255,255,255,0.12);
  color: ${MD.primary};
}
:host(.dark-mode) .var-card__title { color: ${MD.darkText}; }
:host(.dark-mode) .var-card__subtitle { color: ${MD.darkMuted}; }
:host(.dark-mode) .var-card__type-badge {
  color: ${MD.darkMuted};
  background: rgba(255,255,255,0.12);
}

:host(.dark-mode) .status-badge--on {
  background: ${MD.darkSuccessBg};
  color: #5dd879;
}
:host(.dark-mode) .status-badge--off {
  background: rgba(255,255,255,0.12);
  color: ${MD.darkMuted};
}

:host(.dark-mode) .md-toggle__track { background: rgba(255,255,255,0.2); }
:host(.dark-mode) .md-toggle__track::after { background: ${MD.white}; }
:host(.dark-mode) .md-toggle__input:checked + .md-toggle__track { background: ${MD.primary}; }
:host(.dark-mode) .md-toggle__input:focus + .md-toggle__track { box-shadow: 0 0 0 2px ${MD.primary}; }

:host(.dark-mode) .md-btn--secondary {
  background: rgba(255,255,255,0.12);
  color: ${MD.darkText};
}
:host(.dark-mode) .md-btn--secondary:hover:not(:disabled) { background: rgba(255,255,255,0.18); }

:host(.dark-mode) .md-input {
  background: ${MD.darkInputBg};
  border-color: ${MD.darkBorder};
  color: ${MD.darkText};
}
:host(.dark-mode) .md-input::placeholder { color: ${MD.darkMuted}; }
:host(.dark-mode) .md-input:focus { border-color: ${MD.primary}; }
:host(.dark-mode) .char-count { color: ${MD.darkMuted}; }

:host(.dark-mode) .msg-feedback--error {
  background: ${MD.darkErrorBg};
  border-color: rgba(215,46,21,0.4);
  color: #f28b82;
}
:host(.dark-mode) .msg-feedback--success {
  background: ${MD.darkSuccessBg};
  border-color: rgba(16,137,62,0.4);
  color: #81c995;
}

:host(.dark-mode) .dashboard-header { border-bottom-color: ${MD.darkBorder}; }
:host(.dark-mode) .dashboard-header__title { color: ${MD.darkText}; }
:host(.dark-mode) .dashboard-header__meta { color: ${MD.darkMuted}; }

:host(.dark-mode) .empty-state {
  background: ${MD.darkCard};
  border-color: ${MD.darkBorder};
  color: ${MD.darkMuted};
}

:host(.dark-mode) .filter-bar { border-bottom-color: ${MD.darkBorder}; }
:host(.dark-mode) .filter-bar__label { color: ${MD.darkMuted}; }
:host(.dark-mode) .filter-bar__input {
  background: ${MD.darkInputBg};
  border-color: ${MD.darkBorder};
  color: ${MD.darkText};
}
:host(.dark-mode) .filter-bar__input::placeholder { color: ${MD.darkMuted}; }

:host(.dark-mode) .type-filter__btn {
  background: ${MD.darkCard};
  border-color: ${MD.darkBorder};
  color: ${MD.darkText};
}
:host(.dark-mode) .type-filter__btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: ${MD.darkBorder};
}
:host(.dark-mode) .type-filter__btn--active {
  background: ${MD.primary};
  color: ${MD.white};
  border-color: ${MD.primary};
}
:host(.dark-mode) .type-filter__btn--active:hover {
  background: ${MD.primaryHover};
  border-color: ${MD.primaryHover};
}

:host(.dark-mode) .section-title { color: ${MD.darkMuted}; }
`;

const template = document.createElement("template");
template.innerHTML = `
  <div id="loading" class="loading" style="display:none">Loading...</div>
  <div id="error" class="error" style="display:none"></div>
  <div id="content" style="display:none">
    <div class="dashboard-header">
      <h2 class="dashboard-header__title">Global Variables</h2>
      <span class="dashboard-header__meta" id="variable-count" aria-live="polite"></span>
    </div>
    <div class="filter-bar">
      <label class="filter-bar__label" for="variable-search">Search variables</label>
      <input type="text" id="variable-search" class="filter-bar__input" placeholder="Type variable name to filter..." autocomplete="off" aria-describedby="variable-count" />
    </div>
    <div class="type-filter" id="type-filter" role="group" aria-label="Filter by variable type">
      <div class="type-filter__buttons" id="type-filter-buttons"></div>
    </div>
    <div id="sections-container"></div>
    <div class="msg-feedback" id="submitted" role="status" aria-live="polite" aria-atomic="true"></div>
  </div>
`;

class SupervisorDashboard extends HTMLElement {
  static get observedAttributes() {
    return ["access-token", "accessToken", "org-id", "orgId", "user-id", "userId", "user", "User", "triggerURL", "passPhrase", "api-region", "apiRegion", "dark", "theme", "is-dark-mode", "isDarkMode"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._state = {
      accessToken: null,
      variables: [],
      savedValues: [],
    };
  }

  _getAttr(...keys) {
    for (const k of keys) {
      const v = this[k] ?? this.getAttribute(k) ?? this.getAttribute(k.replace(/([A-Z])/g, "-$1").toLowerCase()) ?? "";
      if (v) return v;
    }
    return "";
  }

  _getApiBase() {
    const region = this._getAttr("apiRegion", "api-region").toLowerCase().trim();
    if (region && API_REGION_HOSTS[region]) return API_REGION_HOSTS[region];
    return WXCC_API_BASE_DEFAULT;
  }

  _applyDarkMode() {
    const themeDark = this.getAttribute("theme") === "dark";
    const attrVal = (this.getAttribute("is-dark-mode") || this.getAttribute("isDarkMode") || "").toString().toLowerCase();
    const storeFromAttr = (this.hasAttribute("is-dark-mode") || this.hasAttribute("isDarkMode")) && (attrVal === "true" || attrVal === "1");
    const storeFromProp = this.isDarkMode === true || this.isDarkMode === "true";
    const storeDark = storeFromAttr || storeFromProp;
    const explicitDark = this.hasAttribute("dark") || themeDark || storeDark;
    const systemDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = explicitDark || systemDark;
    this.classList.toggle("dark-mode", !!isDark);
  }

  async connectedCallback() {
    this.shadowRoot.appendChild(style.cloneNode(true));
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this._applyDarkMode();
    this._darkModeQuery = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)");
    if (this._darkModeQuery && this._darkModeQuery.addEventListener) {
      this._darkModeQuery.addEventListener("change", () => this._applyDarkMode());
    }

    // Support both kebab-case and camelCase (WxCC layout may use either)
    const token = this._getAttr("accessToken", "access-token");
    const org = this._getAttr("orgId", "org-id");
    const username = this._getAttr("userId", "user-id", "User", "user");
    const triggerURL = this._getAttr("triggerURL", "trigger-url");
    const passPhrase = this._getAttr("passPhrase", "pass-phrase");

    let resolvedToken = token;
    if (!resolvedToken && triggerURL && passPhrase) {
      this._showLoading();
      try {
        resolvedToken = await this._fetchTokenFromService(triggerURL, passPhrase);
      } catch (err) {
        console.error("[SupervisorDashboard] Token service error:", err);
        this._showError("Failed to get token from service. " + (err.message || ""));
        return;
      }
    }

    if (!resolvedToken) {
      this._showError("Missing access token. In layout properties use either: \"accessToken\": \"$STORE.auth.accessToken\" or \"triggerURL\" + \"passPhrase\" for token service.");
      return;
    }
    if (!org) {
      this._showError("Missing org ID. Set \"orgId\": \"$STORE.agent.orgId\" in the Desktop layout properties.");
      return;
    }

    this._showLoading();
    this._fetchGlobalVariables(org, username, resolvedToken)
      .then((result) => this._render(result))
      .catch((err) => {
        console.error("[SupervisorDashboard] ERROR:", err);
        this._state.token = null;
        this._showError(err.message || "Failed to load");
      });

    this._boundClick = (e) => this._onClick(e);
    this._boundKeyup = (e) => this._onKeyup(e);
    this._boundInput = (e) => this._onKeyup(e);
    this._boundPaste = (e) => this._onPaste(e);
    this.shadowRoot.addEventListener("click", this._boundClick);
    this.shadowRoot.addEventListener("keyup", this._boundKeyup);
    this.shadowRoot.addEventListener("input", this._boundInput);
    this.shadowRoot.addEventListener("paste", this._boundPaste, true);
  }

  async _fetchTokenFromService(url, passPhrase) {
    const sep = url.includes("?") ? "&" : "?";
    const res = await fetch(`${url}${sep}passPhrase=${encodeURIComponent(passPhrase)}`, { redirect: "follow" });
    const data = await res.json().catch(() => ({}));
    const t = data?.token ?? data?.accessToken ?? data?.access_token;
    if (!t) throw new Error("Token service did not return a token");
    return t;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "dark" || name === "theme" || name === "is-dark-mode" || name === "isDarkMode") {
      this._applyDarkMode();
      return;
    }
    const errorEl = this.shadowRoot?.getElementById("error");
    if (errorEl?.style.display !== "block") return;
    const token = this._getAttr("accessToken", "access-token");
    const org = this._getAttr("orgId", "org-id");
    if (token && org) this._retryInit();
  }

  _retryInit() {
    const token = this._getAttr("accessToken", "access-token");
    const org = this._getAttr("orgId", "org-id");
    const username = this._getAttr("userId", "user-id", "User", "user");
    if (token && org) {
      this._showLoading();
      this._fetchGlobalVariables(org, username, token)
        .then((r) => this._render(r))
        .catch((err) => {
          this._state.token = null;
          this._showError(err.message || "Failed to load");
        });
    }
  }

  _showLoading() {
    this.shadowRoot.getElementById("loading").style.display = "block";
    this.shadowRoot.getElementById("error").style.display = "none";
    this.shadowRoot.getElementById("content").style.display = "none";
  }

  _showError(msg) {
    this.shadowRoot.getElementById("loading").style.display = "none";
    this.shadowRoot.getElementById("content").style.display = "none";
    const el = this.shadowRoot.getElementById("error");
    el.textContent = msg;
    el.style.display = "block";
  }

  _showContent() {
    this.shadowRoot.getElementById("loading").style.display = "none";
    this.shadowRoot.getElementById("error").style.display = "none";
    this.shadowRoot.getElementById("content").style.display = "block";
  }

  async _safeJson(res, context = "") {
    const text = await res.text();
    if (!text || !text.trim()) {
      throw new Error(`${context}: Empty response (${res.status})`);
    }
    const first = text.trim()[0];
    if (first !== "{" && first !== "[") {
      const preview = text.slice(0, 80).replace(/\s+/g, " ");
      throw new Error(`${context}: Expected JSON but got ${res.status}. Response: ${preview}…`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`${context}: Invalid JSON. ${e.message}`);
    }
  }

  async _fetchGlobalVariables(org, _username, token) {
    const params = new URLSearchParams();
    params.set("limit", "500");
    const base = this._getApiBase();
    const url = `${base}/organization/${org}/v2/cad-variable?${params}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      redirect: "follow",
    });
    const result = await this._safeJson(res, "WxCC API");
    if (result.error) throw new Error(result.error.message?.[0]?.description || "API error");
    return { token, result };
  }

  _render({ token, result }) {
    const context = this.shadowRoot;
    const list = Array.isArray(result.data) ? result.data : [];
    const total = list.length;

    const typeGroups = {};
    TYPE_ORDER.forEach((t) => { typeGroups[t] = []; });

    const state = {
      agentEditable: [], variableType: [], agentViewable: [], reportable: [],
      active: [], defaultValue: [], gvid: [], gvname: [], description: [], savedtext: [], sensitive: [],
      checkboxname: [], submitname: [], textareaname: [], remainingname: [], otherinputname: [],
      typeFilter: this._state.typeFilter || "all",
    };

    for (let i = 0; i < total; i++) {
      const v = list[i];
      state.agentEditable[i] = v.agentEditable;
      state.variableType[i] = v.variableType;
      state.agentViewable[i] = v.agentViewable;
      state.reportable[i] = v.reportable;
      state.active[i] = v.active;
      state.sensitive[i] = v.sensitive === true;
      state.defaultValue[i] = v.defaultValue;
      state.gvid[i] = v.id;
      state.gvname[i] = v.name;
      state.savedtext[i] = v.defaultValue;
      state.description[i] = v.description || v.name || "";
      state.checkboxname[i] = `checkbox${i}`;
      state.submitname[i] = `submit${i}`;
      state.textareaname[i] = `textarea${i}`;
      state.remainingname[i] = `remaining${i}`;
      state.otherinputname[i] = `otherinput${i}`;

      if (!v.active) continue;

      const typeKey = TYPE_ORDER.includes(v.variableType) ? v.variableType : "Other";

      if (v.variableType === "Boolean") {
        typeGroups.Boolean.push({
          index: i,
          variableName: state.gvname[i],
          description: state.description[i],
          value: v.defaultValue,
          checkName: state.checkboxname[i],
          submitName: state.submitname[i],
        });
      } else if (v.variableType === "String") {
        const raw = v.defaultValue == null ? "" : String(v.defaultValue);
        if (raw.length > MAX_STRING_LENGTH) {
          console.warn(`[SupervisorDashboard] Variable "${v.name}" value truncated from ${raw.length} to ${MAX_STRING_LENGTH} characters.`);
        }
        const truncated = this._truncateToMax(v.defaultValue, MAX_STRING_LENGTH);
        state.defaultValue[i] = truncated;
        state.savedtext[i] = truncated;
        typeGroups.String.push({
          index: i,
          variableName: state.gvname[i],
          description: state.description[i],
          value: truncated,
          textAreaName: state.textareaname[i],
          submitName: state.submitname[i],
          remainingName: state.remainingname[i],
        });
      } else {
        const { value: normalized } = this._getOtherInputTypeAndValue(v.variableType, v.defaultValue);
        state.defaultValue[i] = normalized;
        state.savedtext[i] = normalized;
        typeGroups[typeKey].push({
          index: i,
          variableName: state.gvname[i],
          description: state.description[i],
          variableType: v.variableType,
          value: state.defaultValue[i],
          inputName: state.otherinputname[i],
          submitName: state.submitname[i],
        });
      }
    }

    const typesWithData = TYPE_ORDER.filter((t) => typeGroups[t].length > 0);
    const activeFilter = state.typeFilter === "all" || typesWithData.includes(state.typeFilter) ? state.typeFilter : "all";

    const filterButtonsHtml = [
      `<button type="button" class="type-filter__btn ${activeFilter === "all" ? "type-filter__btn--active" : ""}" data-type-filter="all" aria-pressed="${activeFilter === "all"}">All</button>`,
      ...typesWithData.map(
        (t) => `<button type="button" class="type-filter__btn ${activeFilter === t ? "type-filter__btn--active" : ""}" data-type-filter="${this._escape(t)}" aria-pressed="${activeFilter === t}">${this._escape(t)}</button>`
      ),
    ].join("");
    context.getElementById("type-filter-buttons").innerHTML = filterButtonsHtml;

    const container = context.getElementById("sections-container");
    container.innerHTML = "";
    typesWithData.forEach((type) => {
      const section = document.createElement("div");
      section.className = "section-block";
      section.dataset.type = type;
      section.id = `section-${type}`;
      let cardsHtml;
      if (type === "Boolean") cardsHtml = this._generateBooleanCards(typeGroups.Boolean);
      else if (type === "String") cardsHtml = this._generateStringCards(typeGroups.String);
      else cardsHtml = this._generateOtherCards(typeGroups[type]);
      section.innerHTML = `
        <div class="section-title">${this._escape(type)}</div>
        <div class="dashboard section-cards">${cardsHtml}</div>
      `;
      container.appendChild(section);
    });

    for (let i = 0; i < total; i++) {
      if (state.variableType[i] === "String") {
        const ta = context.getElementById(state.textareaname[i]);
        const span = context.getElementById(state.remainingname[i]);
        if (ta && span) this._updateCharCount(span, ta.value.length);
      }
    }

    this._state = { ...this._state, ...state, token, typeFilter: activeFilter };

    const countEl = context.getElementById("variable-count");
    if (countEl) countEl.textContent = `${total} variable${total !== 1 ? "s" : ""}`;

    this._showContent();
    this._attachSearchFilter();
    this._attachTypeFilter();
    this._onSearchInput();
  }

  _attachSearchFilter() {
    if (this._searchFilterAttached) return;
    const input = this.shadowRoot.getElementById("variable-search");
    if (!input) return;
    this._searchFilterAttached = true;
    input.addEventListener("input", () => this._onSearchInput());
  }

  _attachTypeFilter() {
    if (this._typeFilterAttached) return;
    const container = this.shadowRoot.getElementById("type-filter-buttons");
    if (!container) return;
    this._typeFilterAttached = true;
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".type-filter__btn");
      if (!btn) return;
      const filter = btn.dataset.typeFilter;
      if (!filter) return;
      this._state.typeFilter = filter;
      this._setTypeFilterActive(filter);
      this._onSearchInput();
    });
  }

  _setTypeFilterActive(activeFilter) {
    const buttons = this.shadowRoot.querySelectorAll(".type-filter__btn");
    buttons.forEach((btn) => {
      const isActive = btn.dataset.typeFilter === activeFilter;
      btn.classList.toggle("type-filter__btn--active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  _onSearchInput() {
    const input = this.shadowRoot.getElementById("variable-search");
    const search = (input?.value ?? "").trim().toLowerCase();
    const typeFilter = this._state?.typeFilter || "all";
    const container = this.shadowRoot.getElementById("sections-container");
    if (!container) return;

    const filterCard = (card) => {
      const title = card.querySelector(".var-card__title")?.textContent ?? "";
      const subtitle = card.querySelector(".var-card__subtitle")?.textContent ?? "";
      const searchable = (title + " " + subtitle).toLowerCase();
      return !search || searchable.includes(search);
    };

    container.querySelectorAll(".section-block").forEach((section) => {
      const sectionType = section.dataset.type;
      const typeMatches = typeFilter === "all" || sectionType === typeFilter;
      const cards = section.querySelectorAll(".var-card");
      let anyVisible = false;
      cards.forEach((card) => {
        const show = typeMatches && filterCard(card);
        card.style.display = show ? "" : "none";
        if (show) anyVisible = true;
      });
      const showSection = typeMatches && (!search || anyVisible);
      section.style.display = showSection ? "" : "none";
    });
  }

  _generateBooleanCards(data) {
    if (!data.length) {
      return `<div class="empty-state"><div class="empty-state__icon">${ICONS.toggle}</div><p class="empty-state__text">No boolean variables</p></div>`;
    }
    return data.map((item) => {
      const checked = item.value === "true";
      const badgeClass = checked ? "status-badge--on" : "status-badge--off";
      const badgeText = checked ? "On" : "Off";
      const showDesc = item.description && item.description !== item.variableName;
      const nameEsc = this._escape(item.variableName);
      return `
        <div class="var-card" id="card-bool-${item.index}" data-index="${item.index}" data-variable-type="Boolean">
          <div class="var-card__header">
            <div class="var-card__icon">${ICONS.toggle}</div>
            <div>
              <h3 class="var-card__title">${nameEsc}</h3>
              ${showDesc ? `<p class="var-card__subtitle">${this._escape(item.description)}</p>` : ""}
              <span class="var-card__type-badge">Boolean</span>
              <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
          </div>
          <div class="var-card__body">
            <div class="var-card__controls">
              <div class="md-toggle">
                <input type="checkbox" class="md-toggle__input" tabindex="0" data-index="${item.index}" id="${item.checkName}" aria-label="Toggle ${nameEsc}"${checked ? " checked" : ""}>
                <label class="md-toggle__track" for="${item.checkName}"></label>
              </div>
              <button type="button" class="md-btn md-btn--secondary" data-index="${item.index}" id="${item.submitName}" disabled aria-label="Apply value for ${nameEsc}">Apply</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  _generateStringCards(data) {
    if (!data.length) {
      return `<div class="empty-state"><div class="empty-state__icon">${ICONS.message}</div><p class="empty-state__text">No string variables</p></div>`;
    }
    return data.map((item) => {
      const safeValue = this._truncateToMax(item.value, MAX_STRING_LENGTH);
      const showDesc = item.description && item.description !== item.variableName;
      const nameEsc = this._escape(item.variableName);
      return `
        <div class="var-card" id="card-str-${item.index}" data-index="${item.index}" data-variable-type="String">
          <div class="var-card__header">
            <div class="var-card__icon">${ICONS.message}</div>
            <div>
              <h3 class="var-card__title">${nameEsc}</h3>
              ${showDesc ? `<p class="var-card__subtitle">${this._escape(item.description)}</p>` : ""}
              <span class="var-card__type-badge">String</span>
            </div>
          </div>
          <div class="var-card__body">
            <textarea class="md-input" rows="4" maxlength="${MAX_STRING_LENGTH}" id="${item.textAreaName}" data-index="${item.index}" aria-label="Edit ${nameEsc}">${this._escape(safeValue)}</textarea>
            <div class="char-count" id="${item.remainingName}"></div>
            <div class="var-card__controls" style="margin-top:12px">
              <button type="button" class="md-btn md-btn--secondary" data-index="${item.index}" id="${item.submitName}" disabled aria-label="Apply value for ${nameEsc}">Apply</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  _getOtherInputTypeAndValue(variableType, value) {
    const str = value == null ? "" : String(value).trim();
    switch (variableType) {
      case "Integer":
        return { type: "number", step: "", value: str };
      case "Float":
      case "Decimal":
        return { type: "number", step: "any", value: str };
      case "Date":
      case "DateTime":
        const dateVal = str ? (str.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "") : "";
        return { type: "date", step: "", value: dateVal };
      default:
        return { type: "text", step: "", value: str };
    }
  }

  _generateOtherCards(data) {
    if (!data.length) {
      return `<div class="empty-state"><div class="empty-state__icon">${ICONS.other}</div><p class="empty-state__text">No other variables</p></div>`;
    }
    return data.map((item) => {
      const showDesc = item.description && item.description !== item.variableName;
      const typeLabel = item.variableType || "Other";
      const { type: inputType, step, value: inputValue } = this._getOtherInputTypeAndValue(item.variableType, item.value);
      const nameEsc = this._escape(item.variableName);
      const valueEsc = this._escape(inputValue);
      const stepAttr = step ? ` step="${this._escape(step)}"` : "";
      return `
        <div class="var-card" id="card-other-${item.index}" data-index="${item.index}" data-variable-type="${this._escape(item.variableType || "Other")}">
          <div class="var-card__header">
            <div class="var-card__icon">${ICONS.other}</div>
            <div>
              <h3 class="var-card__title">${nameEsc}</h3>
              ${showDesc ? `<p class="var-card__subtitle">${this._escape(item.description)}</p>` : ""}
              <span class="var-card__type-badge">${this._escape(typeLabel)}</span>
            </div>
          </div>
          <div class="var-card__body">
            <input type="${inputType}" class="md-input other-value" id="${item.inputName}" data-index="${item.index}" value="${valueEsc}"${stepAttr} aria-label="Edit ${nameEsc}" />
            <div class="var-card__controls" style="margin-top:12px">
              <button type="button" class="md-btn md-btn--secondary" data-index="${item.index}" id="${item.submitName}" disabled aria-label="Apply value for ${nameEsc}">Apply</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  _truncateToMax(str, max) {
    if (str == null) return "";
    const s = String(str);
    return s.length > max ? s.slice(0, max) : s;
  }

  _updateCharCount(span, len) {
    if (!span) return;
    span.textContent = `${len}/${MAX_STRING_LENGTH}`;
    span.classList.toggle("char-count--over", len > MAX_STRING_LENGTH);
  }

  _escape(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  _updateCardChangedState(index, hasChanges, variableType) {
    const prefix = variableType === "Boolean" ? "bool" : variableType === "String" ? "str" : "other";
    const card = this.shadowRoot.getElementById(`card-${prefix}-${index}`);
    if (card) card.classList.toggle("var-card--changed", hasChanges);
  }

  _updateBadge(index, checked) {
    const card = this.shadowRoot.getElementById(`card-bool-${index}`);
    if (!card) return;
    const badge = card.querySelector(".status-badge");
    if (badge) {
      badge.className = `status-badge ${checked ? "status-badge--on" : "status-badge--off"}`;
      badge.textContent = checked ? "On" : "Off";
    }
  }

  _getIndexFromTarget(el, state) {
    const index = el?.dataset?.index ?? el?.id?.replace(/\D/g, "");
    return index !== "" ? parseInt(index, 10) : -1;
  }

  _onClick(e) {
    const state = this._state;
    const token = state?.token;
    const btn = e.target.closest("button[type=button]");
    const cb = e.target.closest("input[type=checkbox]");
    if (btn) {
      const index = this._getIndexFromTarget(btn, state);
      if (index >= 0 && token) this._handleSubmit(btn, index, state, token);
      return;
    }
    if (cb && cb.type === "checkbox") {
      const index = this._getIndexFromTarget(cb, state);
      if (index >= 0) this._handleCheckboxChange(cb, index, state);
    }
  }

  _handleCheckboxChange(checkbox, index, state) {
    const submitBtn = this.shadowRoot.getElementById(state.submitname[index]);
    if (!submitBtn) return;
    state.defaultValue[index] = checkbox.checked ? "true" : "false";
    const hasChanges = state.defaultValue[index] !== state.savedtext[index];
    submitBtn.disabled = !hasChanges;
    submitBtn.className = "md-btn " + (hasChanges ? "md-btn--has-changes" : "md-btn--secondary");
    this._updateCardChangedState(index, hasChanges, "Boolean");
    this._updateBadge(index, checkbox.checked);
  }

  _handleSubmit(btn, index, state, token) {
    const org = this._getAttr("org-id", "orgId");
    const base = this._getApiBase();
    btn.disabled = true;
    btn.classList.add("md-btn--loading");
    btn.dataset.loading = "true";
    btn.textContent = "Updating…";
    state.savedtext[index] = state.defaultValue[index];
    this._updateCardChangedState(index, false, state.variableType[index]);

    const payload = {
      agentEditable: state.agentEditable[index],
      variableType: state.variableType[index],
      agentViewable: state.agentViewable[index],
      reportable: state.reportable[index],
      active: state.active[index],
      defaultValue: state.defaultValue[index],
      id: state.gvid[index],
      name: state.gvname[index],
      description: state.description[index],
      sensitive: state.sensitive[index] === true,
    };

    fetch(`${base}/organization/${org}/cad-variable/${state.gvid[index]}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    })
      .then((r) => this._safeJson(r, "Update"))
      .then((result) => this._showUpdateResult(result, btn))
      .catch((err) => {
        console.error("[SupervisorDashboard] Update failed:", err);
        this._showUpdateResult({ error: { message: [{ description: err.message }] } }, btn);
      });
  }

  _showUpdateResult(result, btn) {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("md-btn--loading");
      delete btn.dataset.loading;
      btn.textContent = "Apply";
    }
    const el = this.shadowRoot.getElementById("submitted");
    el.classList.remove("msg-feedback--error", "msg-feedback--success");
    if (result?.error) {
      el.textContent = "Error: " + (result.error.message?.[0]?.description ?? "Unknown error");
      el.classList.add("msg-feedback--error");
    } else {
      el.textContent = `Successfully updated ${result.description} to ${result.defaultValue}`;
      el.classList.add("msg-feedback--success");
      if (SUCCESS_MSG_DURATION_MS > 0) {
        setTimeout(() => { el.textContent = ""; el.classList.remove("msg-feedback--success"); }, SUCCESS_MSG_DURATION_MS);
      }
    }
  }

  _onKeyup(e) {
    const state = this._state;
    const ta = e.target.closest("textarea");
    if (ta) {
      const index = this._getIndexFromTarget(ta, state);
      if (index < 0) return;
      const span = this.shadowRoot.getElementById(state.remainingname[index]);
      this._updateCharCount(span, ta.value.length);
      state.defaultValue[index] = ta.value;
      const submitBtn = this.shadowRoot.getElementById(state.submitname[index]);
      const hasChanges = ta.value !== state.savedtext[index];
      if (submitBtn) {
        submitBtn.disabled = !hasChanges;
        submitBtn.className = "md-btn " + (hasChanges ? "md-btn--has-changes" : "md-btn--secondary");
      }
      this._updateCardChangedState(index, hasChanges, "String");
      return;
    }
    const otherInput = e.target.closest("input.other-value");
    if (otherInput) {
      const index = this._getIndexFromTarget(otherInput, state);
      if (index < 0) return;
      state.defaultValue[index] = otherInput.value;
      const submitBtn = this.shadowRoot.getElementById(state.submitname[index]);
      const hasChanges = otherInput.value !== state.savedtext[index];
      if (submitBtn) {
        submitBtn.disabled = !hasChanges;
        submitBtn.className = "md-btn " + (hasChanges ? "md-btn--has-changes" : "md-btn--secondary");
      }
      this._updateCardChangedState(index, hasChanges, state.variableType[index]);
    }
  }

  _onPaste(e) {
    const state = this._state;
    const ta = e.target.closest("textarea");
    if (!ta) return;
    const index = this._getIndexFromTarget(ta, state);
    if (index < 0) return;

    setTimeout(() => {
      const span = this.shadowRoot.getElementById(state.remainingname[index]);
      this._updateCharCount(span, ta.value.length);
    }, 0);
  }
}

customElements.define("supervisor-dashboard", SupervisorDashboard);

if (customElements.get("supervisor-dashboard")) {
  console.log("✅ supervisor-dashboard component registered");
} else {
  console.error("❌ supervisor-dashboard component NOT registered");
}
