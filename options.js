// =========================
// Anti-Phishing Perú — options.js (cross-browser)
// =========================
const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

function storageGet(keys) {
  return new Promise((resolve) => {
    try {
      const fn = API.storage?.sync?.get;
      if (!fn) return resolve({});
      if (fn.length > 1) fn.call(API.storage.sync, keys, resolve);
      else Promise.resolve(fn.call(API.storage.sync, keys)).then(resolve);
    } catch { resolve({}); }
  });
}
function storageSet(items) {
  return new Promise((resolve) => {
    try {
      const fn = API.storage?.sync?.set;
      if (!fn) return resolve();
      if (fn.length > 1) fn.call(API.storage.sync, items, resolve);
      else Promise.resolve(fn.call(API.storage.sync, items)).then(resolve);
    } catch { resolve(); }
  });
}

function chip(text) {
  const s = document.createElement("span");
  s.className = "chip";
  s.textContent = text;
  return s;
}
function sanitizeLines(val) {
  return Array.from(new Set(
    (val || "")
      .split(/\r?\n/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  ));
}

// ---- TRUST LISTS ----
async function loadTrustLists() {
  const resp = await new Promise((resolve) => {
    try { API.runtime.sendMessage({ type: "GET_TRUST_LISTS" }, (res) => resolve(res)); }
    catch { resolve(null); }
  });
  if (!resp || resp.type !== "GET_TRUST_LISTS_OK") return;
  const { baseD, baseS, userD, userS } = resp.payload || {};

  const baseDomainsChips = document.getElementById("baseDomainsChips");
  baseDomainsChips.innerHTML = "";
  (baseD || []).forEach(d => baseDomainsChips.appendChild(chip(d)));

  const baseSuffixesChips = document.getElementById("baseSuffixesChips");
  baseSuffixesChips.innerHTML = "";
  (baseS || []).forEach(s => baseSuffixesChips.appendChild(chip(s)));

  document.getElementById("userDomains").value = (userD || []).join("\n");
  document.getElementById("userSuffixes").value = (userS || []).join("\n");
}

async function saveUserDomains() {
  const list = sanitizeLines(document.getElementById("userDomains").value);
  await storageSet({ userTrustedETLD1: list });
  document.getElementById("userDomainsMsg").textContent = "Guardado.";
  setTimeout(() => document.getElementById("userDomainsMsg").textContent = "", 1500);
}
async function clearUserDomains() {
  await storageSet({ userTrustedETLD1: [] });
  document.getElementById("userDomains").value = "";
  document.getElementById("userDomainsMsg").textContent = "Limpio.";
  setTimeout(() => document.getElementById("userDomainsMsg").textContent = "", 1500);
}
async function saveUserSuffixes() {
  const list = sanitizeLines(document.getElementById("userSuffixes").value);
  await storageSet({ userTrustedSuffixes: list });
  document.getElementById("userSuffixesMsg").textContent = "Guardado.";
  setTimeout(() => document.getElementById("userSuffixesMsg").textContent = "", 1500);
}
async function clearUserSuffixes() {
  await storageSet({ userTrustedSuffixes: [] });
  document.getElementById("userSuffixes").value = "";
  document.getElementById("userSuffixesMsg").textContent = "Limpio.";
  setTimeout(() => document.getElementById("userSuffixesMsg").textContent = "", 1500);
}

// ---- SETTINGS (Modo Estricto) ----
function getStrictBlockKindsFromUI() {
  const vals = [];
  document.querySelectorAll(".sb").forEach(cb => { if (cb.checked) vals.push(cb.value); });
  return vals;
}
function setStrictBlockKindsToUI(list) {
  const want = new Set(list || []);
  document.querySelectorAll(".sb").forEach(cb => { cb.checked = want.has(cb.value); });
}

async function loadSettings() {
  const resp = await new Promise((resolve) => {
    try { API.runtime.sendMessage({ type: "GET_SETTINGS" }, (res) => resolve(res)); }
    catch { resolve(null); }
  });
  if (!resp || resp.type !== "GET_SETTINGS_OK") return;
  const s = resp.payload || {};

  document.getElementById("strictMode").checked = !!s.strictMode;

  document.getElementById("ek_card").checked   = s.enabledKinds?.card   !== false;
  document.getElementById("ek_cvv").checked    = s.enabledKinds?.cvv    !== false;
  document.getElementById("ek_expiry").checked = s.enabledKinds?.expiry !== false;
  document.getElementById("ek_dni").checked    = s.enabledKinds?.dni    !== false;
  document.getElementById("ek_cci").checked    = s.enabledKinds?.cci    !== false;

  setStrictBlockKindsToUI(s.strictBlockKinds || ["card","cvv","expiry","cci"]);
  document.getElementById("dniOnlyFinancial").checked = s.dniOnlyFinancial !== false;
}

async function saveSettings() {
  const next = {
    strictMode: document.getElementById("strictMode").checked,
    enabledKinds: {
      card:   document.getElementById("ek_card").checked,
      cvv:    document.getElementById("ek_cvv").checked,
      expiry: document.getElementById("ek_expiry").checked,
      dni:    document.getElementById("ek_dni").checked,
      cci:    document.getElementById("ek_cci").checked
    },
    strictBlockKinds: getStrictBlockKindsFromUI(),
    dniOnlyFinancial: document.getElementById("dniOnlyFinancial").checked
  };

  const res = await new Promise((resolve) => {
    try { API.runtime.sendMessage({ type: "SET_SETTINGS", payload: next }, (r) => resolve(r)); }
    catch { resolve(null); }
  });

  const msg = document.getElementById("settingsMsg");
  msg.textContent = (res && res.type === "SET_SETTINGS_OK") ? "Guardado." : "Error al guardar.";
  setTimeout(()=> msg.textContent = "", 1500);
}

async function resetSettings() {
  const def = {
    strictMode: false,
    enabledKinds: { card:true, cvv:true, expiry:true, dni:true, cci:true },
    strictBlockKinds: ["card","cvv","expiry","cci"],
    dniOnlyFinancial: true
  };
  await storageSet(def);
  await loadSettings();
  const msg = document.getElementById("settingsMsg");
  msg.textContent = "Restablecido.";
  setTimeout(()=> msg.textContent = "", 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  loadTrustLists().catch(()=>{});
  loadSettings().catch(()=>{});

  document.getElementById("saveUserDomains").onclick = saveUserDomains;
  document.getElementById("clearUserDomains").onclick = clearUserDomains;
  document.getElementById("saveUserSuffixes").onclick = saveUserSuffixes;
  document.getElementById("clearUserSuffixes").onclick = clearUserSuffixes;

  document.getElementById("saveSettings").onclick = saveSettings;
  document.getElementById("resetSettings").onclick = resetSettings;
});