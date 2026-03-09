# Supervisor Dashboard

A Webex Contact Centre supervisor widget that graphically displays global variables and allows supervisors to edit them from the Extensible Supervisor Desktop.

## Features

- **Card-based dashboard** with icons, variable count in the header, and visual status indicators
- **Boolean variables**: Toggle switches with green "On" / gray "Off" badges
- **String variables**: Textareas with character count and inline editing
- **Other types**: Integer/Float use number inputs; Date uses a date picker
- **Search / filter**: Type a variable name to filter the list (case-insensitive)
- **Scrollable layout**: Content scrolls when many variables don’t fit in the panel
- **Accessibility**: ARIA labels on controls, live region for success/error messages
- **Momentum Design** styling aligned with Webex Contact Centre

## GitHub Pages Deployment

1. Push this repo to GitHub.
2. **Settings** → **Pages** → Source: **Deploy from a branch**
3. Branch: **main**, Folder: **/ (root)**
4. Site: `https://<username>.github.io/supervisor-dashboard/`

## Desktop Layout Configuration

Add the widget to your Desktop layout. The framework may pass properties as **camelCase**—use both formats if one fails.

```json
        {
          "nav": {
            "label": "Supervisor Dashboard",
            "icon": "settings",
            "iconType": "momentum",
            "navigateTo": "supervisordashboard",
            "align": "top"
          },
          "page": {
            "id": "supervisordashboard",
            "widgets": {
              "right": {
                "comp": "supervisor-dashboard",
                "script": "https://moncovo.github.io/supervisor-dashboard/supervisor-dashboard.js",
                "wrapper": {
                  "title": "Global Variable Dashboard",
                  "maximizeAreaName": "app-maximize-area"
                },
                "properties": {
                    "accessToken": "$STORE.auth.accessToken",
                    "orgId": "$STORE.agent.orgId",
                    "is-dark-mode": "$STORE.app.darkMode"
                }
              }
            },
            "layout": {
              "areas": [["right"]],
              "size": {
                "cols": [1],
                "rows": [1]
              }
            }
          }
        }
```

**Option – STORE (when available):**
```json
"properties": {
  "accessToken": "$STORE.auth.accessToken",
  "orgId": "$STORE.agent.orgId"
}
```

| Attribute       | Description                                      |
|-----------------|--------------------------------------------------|
| `accessToken`   | `$STORE.auth.accessToken` – bearer token         |
| `orgId`         | `$STORE.agent.orgId` – WxCC organization ID      |

The widget loads **all** organisation global variables; use the in-app search box to filter by variable name.

## Configuration

- **API region**: Set the `api-region` (or `apiRegion`) attribute on the component, e.g. `api-region="eu1"`, `api-region="na1"`. Supported: `eu1`, `eu2`, `na1`. Default: `eu1` (`https://api.wxcc-eu1.cisco.com`). You can also edit `WXCC_API_BASE_DEFAULT` in `supervisor-dashboard.js` to change the default.

## Local Development

```bash
npx serve .
# or
python -m http.server 8000
```

Open `http://localhost:8000`. You need valid `access-token` and `org-id` to load data.

## Files

- `index.html` – Main page
- `supervisor-dashboard.js` – Web Component (`<supervisor-dashboard>`)
- `README.md` – This file
