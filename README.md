# Supervisor Dashboard

A Webex Contact Centre supervisor widget that graphically displays global variables and allows supervisors to edit them from the Extensible Supervisor Desktop.

## Features

- **Card-based dashboard** with icons and visual status indicators
- **Boolean variables**: Toggle switches with green "On" / gray "Off" badges
- **String variables**: Textareas with character count and inline editing
- **Momentum Design** styling aligned with Webex Contact Centre

## GitHub Pages Deployment

1. Push this repo to GitHub.
2. **Settings** → **Pages** → Source: **Deploy from a branch**
3. Branch: **main**, Folder: **/ (root)**
4. Site: `https://<username>.github.io/supervisor-dashboard/`

## Desktop Layout Configuration

Add the widget to your Extensible Supervisor Desktop layout JSON:

```json
{
  "type": "panel",
  "url": "https://your-username.github.io/supervisor-dashboard/",
  "properties": {
    "access-token": "$STORE.auth.accessToken",
    "org-id": "$STORE.agent.orgId",
    "user-id": "$STORE.agent.agentId"
  }
}
```

| Attribute      | STORE reference           | Description                    |
|----------------|---------------------------|--------------------------------|
| `access-token` | `$STORE.auth.accessToken` | Signed-in user's bearer token  |
| `org-id`       | `$STORE.agent.orgId`      | WxCC organization ID           |
| `user-id`      | `$STORE.agent.agentId`    | Optional: filter variables     |
| `user`         | (prefix string)           | Alternative: filter by prefix  |

## Configuration

- **API region**: Edit `WXCC_API_BASE` in `supervisor-dashboard.js` for your region (`eu1`, `eu2`, `na1`, etc.).
- Default: `https://api.wxcc-eu1.cisco.com`

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
