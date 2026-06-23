"use strict";

const STORE_KEY = "apps";
const ACTIVE_KEY = "activeId";

// Example apps shown on first install
const DEFAULT_APPS = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com" },
  { id: "youtube", name: "YouTube", url: "https://youtube.com" },
  { id: "gmail", name: "Gmail", url: "https://mail.google.com", external: true },
  { id: "translate", name: "Translate", url: "https://translate.google.com" },
  { id: "maps", name: "Maps", url: "https://maps.google.com" },
];

let apps = [];
let activeId = null;

// ---- DOM ----
const railIcons = document.getElementById("icons");
const framesEl = document.getElementById("frames");
const emptyEl = document.getElementById("empty");
const topbar = document.getElementById("topbar");
const currentName = document.getElementById("currentName");
const ctxMenu = document.getElementById("ctxMenu");
const modal = document.getElementById("modal");
const modalForm = document.getElementById("modalForm");
const modalTitle = document.getElementById("modalTitle");
const nameInput = document.getElementById("nameInput");
const urlInput = document.getElementById("urlInput");
const iconInput = document.getElementById("iconInput");
const externalInput = document.getElementById("externalInput");
const useTabBtn = document.getElementById("useTabBtn");
const aboutOverlay = document.getElementById("about");
const importFile = document.getElementById("importFile");

const EXT_BADGE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>';

let editingId = null; // app being edited in the modal
let ctxId = null; // target of the right-click menu
let deleteArmed = false; // two-step delete

// ---- Storage ----
function load() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORE_KEY, ACTIVE_KEY], (res) => {
      apps = Array.isArray(res[STORE_KEY]) ? res[STORE_KEY] : null;
      if (apps === null) {
        apps = DEFAULT_APPS.slice();
        chrome.storage.sync.set({ [STORE_KEY]: apps });
      }
      activeId = res[ACTIVE_KEY] || null;
      resolve();
    });
  });
}
function saveApps() { chrome.storage.sync.set({ [STORE_KEY]: apps }); }
function saveActive() { chrome.storage.sync.set({ [ACTIVE_KEY]: activeId }); }

// ---- Helpers ----
function uid() {
  return "a" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
function cssEscape(s) {
  return window.CSS && CSS.escape ? CSS.escape(s) : String(s);
}
function normalizeUrl(input) {
  let u = (input || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try { return new URL(u).href; } catch { return null; }
}
function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
// Several favicon sources, tried in order until one loads. This recovers icons
// for subdomains (e.g. web.whatsapp.com) by also trying the base domain.
function faviconCandidates(url) {
  let host = "";
  try { host = new URL(url).hostname; } catch { host = hostnameOf(url); }
  const base = host.split(".").slice(-2).join(".");
  const out = ["https://icons.duckduckgo.com/ip3/" + host + ".ico"];
  if (base !== host) out.push("https://icons.duckduckgo.com/ip3/" + base + ".ico");
  out.push("https://www.google.com/s2/favicons?domain=" + encodeURIComponent(base) + "&sz=64");
  if (base !== host) {
    out.push("https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=64");
  }
  return out;
}

// Pick the first favicon source that returns a real image (HTTP 200). Some
// services (e.g. DuckDuckGo) return a 404 WITH a placeholder image body, which an
// <img> would happily display — so we check the status with fetch first. The
// extension's <all_urls> host permission lets these cross-origin fetches succeed.
async function resolveFavicon(app, btn, img, label) {
  for (const url of faviconCandidates(app.url)) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) { img.src = url; return; }
    } catch (e) { /* network error → try next */ }
  }
  const span = document.createElement("span");
  span.className = "letter";
  span.style.background = colorFor(app.name || app.url);
  span.textContent = (label || "?").charAt(0).toUpperCase();
  btn.replaceChildren(span);
  if (app.external) addExtBadge(btn);
}
function colorFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return "hsl(" + h + " 55% 45%)";
}
// First app that opens inside the panel (not flagged "open in new tab")
function firstPanelApp() {
  return apps.find((a) => !a.external) || null;
}

// ---- Rail (left icon strip) ----
function renderRail() {
  railIcons.innerHTML = "";
  apps.forEach((app) => {
    const btn = document.createElement("button");
    btn.className = "app-icon" + (app.id === activeId ? " active" : "");
    btn.dataset.id = app.id;
    btn.draggable = true;
    const label = app.name || hostnameOf(app.url);
    btn.setAttribute("aria-label", label);
    btn.setAttribute("data-tip", app.external ? label + " (opens in a tab)" : label);
    btn.setAttribute("data-tip-pos", "right");

    if (app.icon) {
      const span = document.createElement("span");
      span.className = "emoji";
      span.textContent = app.icon;
      btn.appendChild(span);
    } else {
      const img = document.createElement("img");
      img.alt = "";
      btn.appendChild(img);
      resolveFavicon(app, btn, img, label);
    }
    if (app.external) addExtBadge(btn);

    btn.addEventListener("click", () => openApp(app.id));
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showCtxMenu(e.clientX, e.clientY, app.id);
    });
    btn.addEventListener("dragstart", (e) => {
      btn.classList.add("dragging");
      hideTip();
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", app.id);
    });
    btn.addEventListener("dragend", () => {
      btn.classList.remove("dragging");
      persistOrderFromDom();
    });

    railIcons.appendChild(btn);
  });
}

function addExtBadge(btn) {
  const badge = document.createElement("span");
  badge.className = "ext-badge";
  badge.innerHTML = EXT_BADGE_SVG;
  btn.appendChild(badge);
}

railIcons.addEventListener("dragover", (e) => {
  e.preventDefault();
  const dragging = railIcons.querySelector(".dragging");
  if (!dragging) return;
  const after = getDragAfterElement(e.clientY);
  if (after == null) railIcons.appendChild(dragging);
  else railIcons.insertBefore(dragging, after);
});

function getDragAfterElement(y) {
  const els = [...railIcons.querySelectorAll(".app-icon:not(.dragging)")];
  let closest = { offset: -Infinity, element: null };
  for (const el of els) {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: el };
    }
  }
  return closest.element;
}

function persistOrderFromDom() {
  const ids = [...railIcons.querySelectorAll(".app-icon")].map((b) => b.dataset.id);
  apps.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  saveApps();
}

// ---- iframe management (keep opened sites alive) ----
function ensureFrame(app) {
  let frame = framesEl.querySelector('iframe[data-id="' + cssEscape(app.id) + '"]');
  if (!frame) {
    frame = document.createElement("iframe");
    frame.dataset.id = app.id;
    frame.src = app.url;
    frame.setAttribute(
      "allow",
      "camera; microphone; clipboard-read; clipboard-write; fullscreen; autoplay; display-capture; geolocation; encrypted-media; picture-in-picture"
    );
    framesEl.appendChild(frame);
  }
  return frame;
}
function removeFrame(id) {
  const f = framesEl.querySelector('iframe[data-id="' + cssEscape(id) + '"]');
  if (f) f.remove();
}

function openApp(id) {
  const app = apps.find((a) => a.id === id);
  if (!app) return;
  // Apps flagged "external" open in a real browser tab instead of the panel.
  if (app.external) {
    chrome.tabs.create({ url: app.url });
    return;
  }
  activeId = id;
  saveActive();
  ensureFrame(app);
  [...framesEl.querySelectorAll("iframe")].forEach((f) => {
    f.classList.toggle("hidden", f.dataset.id !== id);
  });
  currentName.textContent = app.name || hostnameOf(app.url);
  [...railIcons.querySelectorAll(".app-icon")].forEach((b) => {
    b.classList.toggle("active", b.dataset.id === id);
  });
  updateEmpty();
}

function updateEmpty() {
  const has = apps.length > 0;
  emptyEl.classList.toggle("hidden", has);
  topbar.classList.toggle("hidden", !has);
  if (!has) currentName.textContent = "";
}

// ---- Add / Edit / Remove ----
function addOrUpdate(name, url, icon, external) {
  if (editingId) {
    const app = apps.find((a) => a.id === editingId);
    if (app) {
      const urlChanged = app.url !== url;
      app.name = name;
      app.url = url;
      if (icon) app.icon = icon; else delete app.icon;
      if (external) app.external = true; else delete app.external;
      if (urlChanged || external) removeFrame(app.id);
      saveApps();
      renderRail();
      if (!external && activeId === app.id) {
        openApp(app.id);
      } else if (external && activeId === app.id) {
        const f = firstPanelApp();
        activeId = f ? f.id : null;
        saveActive();
        if (activeId) openApp(activeId);
        else updateEmpty();
      }
    }
  } else {
    const app = { id: uid(), name, url };
    if (icon) app.icon = icon;
    if (external) app.external = true;
    apps.push(app);
    saveApps();
    renderRail();
    if (!external) openApp(app.id); // don't spawn a tab on add
  }
}

function deleteApp(id) {
  const app = apps.find((a) => a.id === id);
  if (!app) return;
  apps = apps.filter((a) => a.id !== id);
  removeFrame(id);
  if (activeId === id) {
    const f = firstPanelApp();
    activeId = f ? f.id : null;
  }
  saveApps();
  saveActive();
  renderRail();
  if (activeId) openApp(activeId);
  else updateEmpty();
}

// ---- Modal ----
function openModal(app) {
  editingId = app ? app.id : null;
  modalTitle.textContent = app ? "Edit app" : "Add app";
  nameInput.value = app ? app.name || "" : "";
  urlInput.value = app ? app.url || "" : "";
  iconInput.value = app && app.icon ? app.icon : "";
  externalInput.checked = !!(app && app.external);
  useTabBtn.classList.toggle("hidden", !!app); // only when adding
  modal.classList.remove("hidden");
  setTimeout(() => urlInput.focus(), 0);
}
function closeModal() {
  modal.classList.add("hidden");
  editingId = null;
  modalForm.reset();
}

modalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const url = normalizeUrl(urlInput.value);
  if (!url) { urlInput.focus(); return; }
  const name = nameInput.value.trim() || hostnameOf(url);
  const icon = iconInput.value.trim();
  addOrUpdate(name, url, icon, externalInput.checked);
  closeModal();
});

useTabBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.url || !/^https?:/i.test(tab.url)) return;
    urlInput.value = tab.url;
    if (!nameInput.value.trim() && tab.title) nameInput.value = tab.title;
    urlInput.focus();
  });
});

// ---- About + backup ----
function openAbout() {
  document.getElementById("aboutVersion").textContent =
    chrome.runtime.getManifest().version;
  aboutOverlay.classList.remove("hidden");
  hideTip();
}
function closeAbout() { aboutOverlay.classList.add("hidden"); }

function exportApps() {
  const blob = new Blob([JSON.stringify(apps, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sidebar-apps.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importAppsFromFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data)) return;
      const cleaned = data
        .filter((a) => a && typeof a.url === "string")
        .map((a) => {
          const item = { id: a.id || uid(), name: a.name || hostnameOf(a.url), url: a.url };
          if (a.icon) item.icon = a.icon;
          if (a.external) item.external = true;
          return item;
        });
      if (!cleaned.length) return;
      apps = cleaned;
      saveApps();
      framesEl.replaceChildren();
      const f = firstPanelApp();
      activeId = f ? f.id : null;
      saveActive();
      renderRail();
      updateEmpty();
      if (activeId) openApp(activeId);
      closeAbout();
    } catch (e) {
      console.error("Import failed:", e);
    } finally {
      importFile.value = "";
    }
  };
  reader.readAsText(file);
}

// ---- Right-click menu ----
function resetCtxMenu() {
  deleteArmed = false;
  const del = ctxMenu.querySelector('[data-act="delete"]');
  del.textContent = "Remove";
  del.classList.remove("danger");
}
function showCtxMenu(x, y, id) {
  ctxId = id;
  resetCtxMenu();
  ctxMenu.classList.remove("hidden");
  const rect = ctxMenu.getBoundingClientRect();
  const px = Math.min(x, window.innerWidth - rect.width - 8);
  const py = Math.min(y, window.innerHeight - rect.height - 8);
  ctxMenu.style.left = Math.max(8, px) + "px";
  ctxMenu.style.top = Math.max(8, py) + "px";
}
function hideCtxMenu() {
  ctxMenu.classList.add("hidden");
  ctxId = null;
  resetCtxMenu();
}

ctxMenu.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn || !ctxId) return;
  const app = apps.find((a) => a.id === ctxId);
  if (!app) { hideCtxMenu(); return; }

  if (btn.dataset.act === "edit") {
    openModal(app);
    hideCtxMenu();
  } else if (btn.dataset.act === "delete") {
    if (!deleteArmed) {
      deleteArmed = true;
      btn.textContent = "Click again to remove";
      btn.classList.add("danger");
      return;
    }
    deleteApp(app.id);
    hideCtxMenu();
  }
});

// ---- Tooltips (floating element, works even inside the clipped rail) ----
const tipEl = document.createElement("div");
tipEl.className = "tooltip hidden";
document.body.appendChild(tipEl);
let tipTarget = null;

function showTip(el) {
  const text = el.getAttribute("data-tip");
  if (!text) return;
  tipEl.textContent = text;
  tipEl.classList.remove("hidden");
  const r = el.getBoundingClientRect();
  const tr = tipEl.getBoundingClientRect();
  const pos = el.getAttribute("data-tip-pos") || "bottom";
  const gap = 8;
  let x, y;
  if (pos === "right") {
    x = r.right + gap;
    y = r.top + r.height / 2 - tr.height / 2;
  } else if (pos === "left") {
    x = r.left - tr.width - gap;
    y = r.top + r.height / 2 - tr.height / 2;
  } else if (pos === "top") {
    x = r.left + r.width / 2 - tr.width / 2;
    y = r.top - tr.height - gap;
  } else {
    x = r.left + r.width / 2 - tr.width / 2;
    y = r.bottom + gap;
  }
  x = Math.max(4, Math.min(x, window.innerWidth - tr.width - 4));
  y = Math.max(4, Math.min(y, window.innerHeight - tr.height - 4));
  tipEl.style.left = x + "px";
  tipEl.style.top = y + "px";
}
function hideTip() {
  tipEl.classList.add("hidden");
  tipTarget = null;
}

document.addEventListener("mouseover", (e) => {
  const el = e.target.closest("[data-tip]");
  if (el === tipTarget) return;
  if (el) { tipTarget = el; showTip(el); }
});
document.addEventListener("mouseout", (e) => {
  const el = e.target.closest("[data-tip]");
  if (el && !el.contains(e.relatedTarget)) hideTip();
});

// ---- Wiring ----
document.getElementById("addBtn").addEventListener("click", () => openModal(null));
document.getElementById("emptyAdd").addEventListener("click", () => openModal(null));
document.getElementById("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

document.getElementById("aboutBtn").addEventListener("click", openAbout);
document.getElementById("aboutClose").addEventListener("click", closeAbout);
aboutOverlay.addEventListener("click", (e) => { if (e.target === aboutOverlay) closeAbout(); });
document.getElementById("exportBtn").addEventListener("click", exportApps);
document.getElementById("importBtn").addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files && importFile.files[0];
  if (file) importAppsFromFile(file);
});

document.getElementById("reloadBtn").addEventListener("click", () => {
  if (!activeId) return;
  const f = framesEl.querySelector('iframe[data-id="' + cssEscape(activeId) + '"]');
  if (f) f.src = f.src; // reload to the app's URL
});
document.getElementById("openTabBtn").addEventListener("click", () => {
  const app = apps.find((a) => a.id === activeId);
  if (app) chrome.tabs.create({ url: app.url });
});

document.addEventListener("click", (e) => {
  if (!ctxMenu.classList.contains("hidden") && !ctxMenu.contains(e.target)) {
    hideCtxMenu();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideCtxMenu();
    closeModal();
    closeAbout();
  }
});

// Reflect changes made elsewhere (e.g. right-click "Add to Sidebar Apps",
// or another window's panel).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[STORE_KEY]) return;
  const next = changes[STORE_KEY].newValue;
  if (!Array.isArray(next)) return;
  if (JSON.stringify(next) === JSON.stringify(apps)) return; // our own write
  const oldIds = new Set(apps.map((a) => a.id));
  apps = next;
  renderRail();
  updateEmpty();
  const added = apps.find((a) => !oldIds.has(a.id));
  if (added && !added.external) {
    openApp(added.id);
  } else if (!apps.some((a) => a.id === activeId && !a.external)) {
    const f = firstPanelApp();
    activeId = f ? f.id : null;
    if (activeId) openApp(activeId);
    else updateEmpty();
  } else {
    openApp(activeId);
  }
});

// ---- Start ----
async function init() {
  await load();
  renderRail();
  updateEmpty();
  if (activeId && apps.some((a) => a.id === activeId && !a.external)) {
    openApp(activeId);
  } else {
    const f = firstPanelApp();
    if (f) openApp(f.id);
  }
}
init();
