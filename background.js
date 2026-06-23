// Open the side panel when the toolbar icon is clicked.
function enablePanelOnClick() {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error("setPanelBehavior failed:", err));
}

// Right-click → "Add to Sidebar Apps"
const MENU_ID = "add-to-sidebar-apps";
function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Add to Sidebar Apps",
      contexts: ["page", "link"],
    });
  });
}

function setup() {
  enablePanelOnClick();
  createMenu();
}
chrome.runtime.onInstalled.addListener(setup);
chrome.runtime.onStartup.addListener(setup);
enablePanelOnClick();

function uid() {
  return "a" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function addApp(url, name) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apps"], (res) => {
      const apps = Array.isArray(res.apps) ? res.apps : [];
      if (apps.some((a) => a.url === url)) { resolve(); return; }
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      apps.push({ id: uid(), name: name || host, url });
      chrome.storage.sync.set({ apps }, resolve);
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const url = info.linkUrl || info.pageUrl || (tab && tab.url);
  if (!url) return;
  const name = !info.linkUrl && tab && tab.title ? tab.title : "";
  await addApp(url, name);
  if (tab && tab.windowId != null) {
    try { await chrome.sidePanel.open({ windowId: tab.windowId }); } catch (e) {}
  }
});
