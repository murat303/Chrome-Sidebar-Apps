# Store submission kit — Sidebar Apps

Copy/paste material for the Chrome Web Store and Microsoft Edge Add-ons listings.

> **Name note:** "Sidebar Apps" may already be taken. If so, pick a unique name
> (e.g. "Side Apps Panel", "AppRail Sidebar") and update it in `manifest.json`
> (`name`) and in the listings below.

## Short description (≤132 chars)

Pin sites like YouTube and ChatGPT to the sidebar and use them as apps — add, remove, reorder, and switch between them.

## Detailed description

Bring back the "sites as sidebar apps" experience. Sidebar Apps puts a vertical icon
rail in the browser side panel: click an icon to open a site in the panel, and switch
between your apps without leaving the page you're on.

Features
• Add any website as an app — or right-click a page and choose "Add to Sidebar Apps"
• Pages stay live in the background as you switch between them
• Reorder with drag & drop; right-click to edit or remove
• Custom emoji icons and names
• Reload or open the current app in a new tab
• "Open in a new tab" option for sites that block embedding (e.g. Gmail)
• Backup & restore your app list as a JSON file
• Syncs across your signed-in browser devices

Note: Some sites (e.g. Gmail) block being embedded in a frame and will open in a new
tab instead. This is a limitation of those sites, not the extension.

## Category
Productivity

## Single purpose (Chrome requires this)
A side-panel launcher that lets the user open and switch between websites they choose,
shown as app icons in the browser side panel.

## Permission justifications (for the review form)

- **storage** — Save the user's list of apps and sync it across their own devices.
- **sidePanel** — The entire UI is rendered in the browser side panel.
- **contextMenus** — Adds a single "Add to Sidebar Apps" item so a user can add the
  current page/link.
- **declarativeNetRequest** — Removes framing headers (X-Frame-Options,
  Content-Security-Policy) and normalizes Sec-Fetch/Referer/Origin on framed requests
  so the user's chosen sites can load inside the side panel. No request data is read
  or transmitted; rules only modify headers locally.
- **host_permissions `<all_urls>`** — The user can add ANY website as an app, so the
  header rules must be able to apply to whatever site the user chooses. The extension
  does not read page content or browsing history.

## Data usage disclosures (Chrome "Privacy practices" tab)
- Does the extension collect user data? **No** (the app list is stored locally and
  synced by the browser; it is not sent to the developer).
- Uses remote code? **No** (all code is in the package).
- Sold/transferred to third parties? **No.**
- Privacy policy URL: host `store-assets/PRIVACY.md` somewhere public and paste the
  link (see step in the publishing guide — a GitHub raw/Pages URL works). Remember to
  fill in the contact email placeholder first.

## Assets you must provide yourself
- **Screenshots:** at least 1. Chrome accepts 1280×800 or 640×400; Edge wants
  1280×800. Take a few of the panel with a couple of apps open.
- **Store icon:** 128×128 (already in `icons/icon128.png`).
- (Optional Chrome) Small promo tile 440×280.
