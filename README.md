# Sidebar Apps — Chrome Extension

By **Murat Gökçe**

Pin your favorite sites (YouTube, ChatGPT, Gmail…) to the browser sidebar and use
them like apps. A vertical icon strip lives on the left; click an icon to open the
site in the panel and switch between them. You can add, remove, and reorder apps —
similar to the old Microsoft Edge sidebar apps.

## Install (developer mode)

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked** and select this folder (`ChromeSidebar`).
4. Click the extension's toolbar icon to open the sidebar.

> Tip: Pin the extension from Chrome's puzzle (🧩) menu so the icon always shows.

## Usage

- **Open:** Click an icon on the left; the site opens in the panel.
- **Add:** Click **+** in the rail, then enter a URL. Name and an emoji icon are
  optional. Use **"Use current tab"** to fill in the page you're on. Tick **"Open in
  a new tab"** for sites that refuse to be embedded (see notes below).
- **Add from any page:** Right-click a page (or a link) → **Add to Sidebar Apps**.
- **Edit / Remove:** **Right-click** an icon → Edit or Remove.
  (Removing is two-step — click again to confirm and avoid accidents.)
- **Reorder:** **Drag and drop** icons in the rail.
- **Reload / Open in new tab:** Buttons in the top bar (hover for tooltips).
- **About + Backup:** The **ⓘ** button shows version, features, and
  **Export / Import** to back up or restore your apps as a JSON file.

Opened sites stay alive in the background, so switching between apps keeps their
state (your ChatGPT chat, a playing video, etc.). Your apps are stored with
`chrome.storage.sync`, so they sync to your other signed-in Chrome devices.

## How it works

- The **Side Panel API** renders the sidebar page (`sidepanel.html`).
- Each app loads inside an `<iframe>`.
- Most sites block iframe embedding with the `X-Frame-Options` and
  `Content-Security-Policy: frame-ancestors` headers. A **declarativeNetRequest**
  rule (`rules.json`) strips those response headers. It also makes the iframe load
  look like a normal top-level navigation — it sets `Sec-Fetch-*` to
  `none`/`document`/`navigate` and removes the `Referer`/`Origin` headers, so
  servers that reject embedded requests (e.g. Google Translate's 403) serve the page
  instead. This lets far more sites, including most Google services, work.

## Limitations & notes

- **Why some sites still won't load.** A Chrome extension's side panel can only show
  an extension page, so external sites must be loaded in an `<iframe>`. The old Edge
  sidebar used a real browser view (a "webview"), which is **not available** to
  Chrome extensions — that's why Edge could show Gmail and this can't always. A few
  sites (notably **Gmail**, and some banking pages) enforce anti-embedding in
  server- and client-side code that header tweaks can't fully bypass.
- **Use "Open in a new tab" for those.** When adding/editing an app, tick **"Open in
  a new tab"**. Its icon stays in the rail (with a small ↗ badge) and clicking it
  launches the site in a real tab — so it still works as a quick launcher.
- **Panel width:** Resize the sidebar by dragging its left edge (extensions can't
  set the side panel width themselves).
- **Sessions / cookies:** Sites run in a third-party (embedded) context. Depending
  on Chrome's third-party cookie settings, some sites may ask you to sign in again.
  If needed, allow third-party cookies for that site.
- **Security trade-off:** The rule removes framing headers and rewrites
  `Sec-Fetch-*`, `Referer`, and `Origin` on iframe (`sub_frame`) document requests
  browser-wide. It only touches the iframe's own navigation, not the API calls
  inside it, so the impact is small — but it does relax clickjacking protection
  somewhat. Use it only on a machine you trust.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension definition (MV3), permissions, side panel |
| `background.js` | Opens the side panel when the toolbar icon is clicked |
| `sidepanel.html` / `.css` / `.js` | Sidebar UI and all logic |
| `rules.json` | declarativeNetRequest rule that strips framing headers |
| `icons/` | Extension icons |
| `make_icons.py` | Regenerates the icons (optional) |

## Regenerate icons

```bash
python3 make_icons.py
```

## Author

Created and maintained by **Murat Gökçe**.
