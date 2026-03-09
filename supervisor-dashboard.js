/**
 * Supervisor Dashboard Widget
 * Card-based dashboard for WxCC Global Variables with visual status indicators.
 * Allows supervisors to view and edit Boolean and String variables.
 */

// Configurable - change for different regions (eu1, eu2, na1, etc.)
const WXCC_API_BASE = "https://api.wxcc-eu1.cisco.com";
const SUCCESS_MSG_DURATION_MS = 4000;
const MAX_STRING_LENGTH = 256;

// Momentum Design tokens (Cisco Webex design system)
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
};

// Inline SVG icons
const ICONS = {
  toggle: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3"/></svg>',
  message: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
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
  transition: box-shadow 150ms, border-color 150ms;
  border: 2px solid transparent;
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

/* Textarea */
.md-input {
  width: 100%; min-height: 80px; padding: 12px;
  font-family: inherit; font-size: 14px; line-height: 1.5;
  border: 1px solid ${MD.gray16}; border-radius: 4px;
  resize: vertical; transition: border-color 150ms;
}
.md-input:focus { outline: none; border-color: ${MD.primary}; }
.char-count { font-size: 12px; color: ${MD.gray50}; margin-top: 4px; }
.char-count--over { color: ${MD.error}; }

.msg-feedback { min-height: 24px; margin-top: 16px; font-size: 13px; }

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
`;

const template = document.createElement("template");
template.innerHTML = `
  <div id="loading" class="loading" style="display:none">Loading...</div>
  <div id="error" class="error" style="display:none"></div>
  <div id="content" style="display:none">
    <div class="filter-bar">
      <label class="filter-bar__label" for="variable-search">Search variables</label>
      <input type="text" id="variable-search" class="filter-bar__input" placeholder="Type variable name to filter..." autocomplete="off" />
    </div>
    <div id="boolean-section">
      <div class="section-title">Toggle Controls</div>
      <div id="boolean-cards" class="dashboard"></div>
    </div>
    <div id="string-section" style="margin-top: 24px;">
      <div class="section-title">Messages</div>
      <div id="string-cards" class="dashboard"></div>
    </div>
    <div class="msg-feedback" id="submitted"></div>
  </div>
`;

class SupervisorDashboard extends HTMLElement {
  static get observedAttributes() {
    return ["access-token", "accessToken", "org-id", "orgId", "user-id", "userId", "user", "User", "triggerURL", "passPhrase"];
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

  async connectedCallback() {
    this.shadowRoot.appendChild(style.cloneNode(true));
    this.shadowRoot.appendChild(template.content.cloneNode(true));

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
        this._showError(err.message || "Failed to load");
      });
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
    if (this._state.token != null) return;
    const token = this._getAttr("accessToken", "access-token");
    const org = this._getAttr("orgId", "org-id");
    if (token && org && this.shadowRoot?.getElementById("error")?.style.display === "block") {
      this._retryInit();
    }
  }

  _retryInit() {
    const token = this._getAttr("accessToken", "access-token");
    const org = this._getAttr("orgId", "org-id");
    const username = this._getAttr("userId", "user-id", "User", "user");
    if (token && org) {
      this._showLoading();
      this._fetchGlobalVariables(org, username, token)
        .then((r) => this._render(r))
        .catch((err) => this._showError(err.message || "Failed to load"));
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
    // Do not pass search=username - that limits results to variables matching the user (e.g. Supervisor_*). Fetch all org variables.
    params.set("limit", "500");
    const url = `${WXCC_API_BASE}/organization/${org}/v2/cad-variable?${params}`;
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

    const booleandata = [];
    const stringdata = [];
    const state = {
      agentEditable: [], variableType: [], agentViewable: [], reportable: [],
      active: [], defaultValue: [], gvid: [], gvname: [], description: [], savedtext: [],
      checkboxname: [], submitname: [], textareaname: [], remainingname: [],
    };

    for (let i = 0; i < total; i++) {
      const v = list[i];
      state.agentEditable[i] = v.agentEditable;
      state.variableType[i] = v.variableType;
      state.agentViewable[i] = v.agentViewable;
      state.reportable[i] = v.reportable;
      state.active[i] = v.active;
      state.defaultValue[i] = v.defaultValue;
      state.gvid[i] = v.id;
      state.gvname[i] = v.name;
      state.savedtext[i] = v.defaultValue;
      state.description[i] = v.description || v.name || "";
      state.checkboxname[i] = `checkbox${i}`;
      state.submitname[i] = `submit${i}`;
      state.textareaname[i] = `textarea${i}`;
      state.remainingname[i] = `remaining${i}`;

      if (v.variableType === "Boolean" && v.active) {
        booleandata.push({
          index: i,
          variableName: state.gvname[i],
          description: state.description[i],
          value: v.defaultValue,
          checkName: state.checkboxname[i],
          submitName: state.submitname[i],
        });
      }
      if (v.variableType === "String" && v.active) {
        const truncated = this._truncateToMax(v.defaultValue, MAX_STRING_LENGTH);
        state.defaultValue[i] = truncated;
        state.savedtext[i] = truncated;
        stringdata.push({
          index: i,
          variableName: state.gvname[i],
          description: state.description[i],
          value: truncated,
          textAreaName: state.textareaname[i],
          submitName: state.submitname[i],
          remainingName: state.remainingname[i],
        });
      }
    }

    context.getElementById("boolean-cards").innerHTML = this._generateBooleanCards(booleandata);
    context.getElementById("string-cards").innerHTML = this._generateStringCards(stringdata);

    for (let i = 0; i < total; i++) {
      if (state.variableType[i] === "String") {
        const ta = context.getElementById(state.textareaname[i]);
        const span = context.getElementById(state.remainingname[i]);
        if (ta && span) this._updateCharCount(span, ta.value.length);
      }
    }

    context.addEventListener("click", (e) => this._onClick(e, state, token));
    context.addEventListener("keyup", (e) => this._onKeyup(e, state));
    context.addEventListener("paste", (e) => this._onPaste(e, state), true);

    this._state = { ...this._state, ...state, token };
    this._showContent();
    this._attachSearchFilter();
    this._onSearchInput(); // re-apply filter after render (e.g. after retry)
  }

  _attachSearchFilter() {
    if (this._searchFilterAttached) return;
    const input = this.shadowRoot.getElementById("variable-search");
    if (!input) return;
    this._searchFilterAttached = true;
    input.addEventListener("input", () => this._onSearchInput());
  }

  _onSearchInput() {
    const input = this.shadowRoot.getElementById("variable-search");
    const search = (input?.value ?? "").trim().toLowerCase();
    const boolCards = this.shadowRoot.querySelectorAll("#boolean-cards .var-card");
    const strCards = this.shadowRoot.querySelectorAll("#string-cards .var-card");
    let anyBoolVisible = false;
    let anyStrVisible = false;
    boolCards.forEach((card) => {
      const title = card.querySelector(".var-card__title")?.textContent ?? "";
      const subtitle = card.querySelector(".var-card__subtitle")?.textContent ?? "";
      const searchable = (title + " " + subtitle).toLowerCase();
      const show = !search || searchable.includes(search);
      card.style.display = show ? "" : "none";
      if (show) anyBoolVisible = true;
    });
    strCards.forEach((card) => {
      const title = card.querySelector(".var-card__title")?.textContent ?? "";
      const subtitle = card.querySelector(".var-card__subtitle")?.textContent ?? "";
      const searchable = (title + " " + subtitle).toLowerCase();
      const show = !search || searchable.includes(search);
      card.style.display = show ? "" : "none";
      if (show) anyStrVisible = true;
    });
    const boolSection = this.shadowRoot.getElementById("boolean-section");
    const strSection = this.shadowRoot.getElementById("string-section");
    if (boolSection) boolSection.style.display = anyBoolVisible || !search ? "" : "none";
    if (strSection) strSection.style.display = anyStrVisible || !search ? "" : "none";
  }

  _generateBooleanCards(data) {
    if (!data.length) {
      return `<div class="var-card"><p style="margin:0;color:${MD.gray50}">No boolean variables</p></div>`;
    }
    return data.map((item) => {
      const checked = item.value === "true";
      const badgeClass = checked ? "status-badge--on" : "status-badge--off";
      const badgeText = checked ? "On" : "Off";
      const showDesc = item.description && item.description !== item.variableName;
      return `
        <div class="var-card" id="card-bool-${item.index}" data-index="${item.index}">
          <div class="var-card__header">
            <div class="var-card__icon">${ICONS.toggle}</div>
            <div>
              <h3 class="var-card__title">${this._escape(item.variableName)}</h3>
              ${showDesc ? `<p class="var-card__subtitle">${this._escape(item.description)}</p>` : ""}
              <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
          </div>
          <div class="var-card__body">
            <div class="var-card__controls">
              <div class="md-toggle">
                <input type="checkbox" class="md-toggle__input" tabindex="0" data-index="${item.index}" id="${item.checkName}"${checked ? " checked" : ""}>
                <label class="md-toggle__track" for="${item.checkName}"></label>
              </div>
              <button type="button" class="md-btn md-btn--secondary" data-index="${item.index}" id="${item.submitName}" disabled>Apply</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  _generateStringCards(data) {
    if (!data.length) {
      return `<div class="var-card"><p style="margin:0;color:${MD.gray50}">No string variables</p></div>`;
    }
    return data.map((item) => {
      const safeValue = this._truncateToMax(item.value, MAX_STRING_LENGTH);
      const showDesc = item.description && item.description !== item.variableName;
      return `
        <div class="var-card" id="card-str-${item.index}" data-index="${item.index}">
          <div class="var-card__header">
            <div class="var-card__icon">${ICONS.message}</div>
            <div>
              <h3 class="var-card__title">${this._escape(item.variableName)}</h3>
              ${showDesc ? `<p class="var-card__subtitle">${this._escape(item.description)}</p>` : ""}
            </div>
          </div>
          <div class="var-card__body">
            <textarea class="md-input" rows="4" maxlength="${MAX_STRING_LENGTH}" id="${item.textAreaName}" data-index="${item.index}">${this._escape(safeValue)}</textarea>
            <div class="char-count" id="${item.remainingName}"></div>
            <div class="var-card__controls" style="margin-top:12px">
              <button type="button" class="md-btn md-btn--secondary" data-index="${item.index}" id="${item.submitName}" disabled>Apply</button>
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
    const prefix = variableType === "Boolean" ? "bool" : "str";
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

  _onClick(e, state, token) {
    const btn = e.target.closest("button[type=button]");
    const cb = e.target.closest("input[type=checkbox]");
    if (btn) {
      const index = this._getIndexFromTarget(btn, state);
      if (index >= 0) this._handleSubmit(btn, index, state, token);
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
    btn.disabled = true;
    btn.className = "md-btn md-btn--secondary";
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
      sensitive: false,
    };

    fetch(`${WXCC_API_BASE}/organization/${org}/cad-variable/${state.gvid[index]}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    })
      .then((r) => this._safeJson(r, "Update"))
      .then((result) => this._showUpdateResult(result))
      .catch((err) => {
        console.error("[SupervisorDashboard] Update failed:", err);
        this._showUpdateResult({ error: { message: [{ description: err.message }] } });
      });
  }

  _showUpdateResult(result) {
    const el = this.shadowRoot.getElementById("submitted");
    if (result?.error) {
      el.textContent = "Error: " + (result.error.message?.[0]?.description ?? "Unknown error");
      el.style.color = MD.error;
    } else {
      el.textContent = `Successfully updated ${result.description} to ${result.defaultValue}`;
      el.style.color = MD.success;
      if (SUCCESS_MSG_DURATION_MS > 0) {
        setTimeout(() => { el.textContent = ""; }, SUCCESS_MSG_DURATION_MS);
      }
    }
  }

  _onKeyup(e, state) {
    const ta = e.target.closest("textarea");
    if (!ta) return;
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
  }

  _onPaste(e, state) {
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
