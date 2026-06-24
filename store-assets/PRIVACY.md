# Privacy Policy — Sidebar Apps

_Last updated: 2026-06-23_

Sidebar Apps is a browser extension that lets you pin websites to the browser side
panel and use them like apps. We take a minimal approach to data.

## What the extension stores

- **Your app list** — the websites you add (name, URL, optional emoji icon, and the
  "open in a new tab" flag) and which app was last active.
- This is saved using the browser's built-in `storage.sync` API. It stays in your
  browser and, if you are signed into the browser, is synced across your own devices
  by your browser vendor (Google/Microsoft). It is **not** sent to the developer.

## What the extension does NOT do

- It does **not** collect, sell, or share your personal data.
- It does **not** use analytics, tracking, or advertising.
- It has **no** developer-controlled server; your data never goes to us.

## Third-party requests

- **Site icons (favicons):** To show an icon for each app, the extension requests an
  icon image from Google's favicon service (`google.com/s2/favicons`) and
  DuckDuckGo's icon service (`icons.duckduckgo.com`). These requests include only the
  **domain name** of an app you added (e.g. `youtube.com`). No personal data is sent.
- **The sites you add** load directly in the panel (in an iframe) or in a new tab,
  exactly as if you visited them in a normal tab. Their own privacy policies apply.

## Header modification

To allow sites to load inside the side panel, the extension uses the browser's
`declarativeNetRequest` API to remove framing-related response headers (such as
`X-Frame-Options` and `Content-Security-Policy`) and to normalize some request
headers (`Sec-Fetch-*`, `Referer`, `Origin`) on framed page requests. This happens
entirely **inside your browser**; it does not transmit any data to us or anyone else.

## Permissions

- `storage` — save and sync your app list.
- `sidePanel` — display the sidebar UI.
- `contextMenus` — add the "Add to Sidebar Apps" right-click item.
- `declarativeNetRequest` + host access — modify headers locally so sites can be
  embedded in the panel.

## Contact

Questions about this policy: `<your-contact-email>`
