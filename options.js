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

async function loadLists() {
  const resp = await new Promise((resolve) => {
    try {
      API.runtime.sendMessage({ type: "GET_TRUST_LISTS" }, (res) => resolve(res));
    } catch { resolve(null); }
  });

  if (!resp || resp.type !== "GET_TRUST_LISTS_OK") return;

  const { baseD, baseS, userD, userS } = resp.payload || {};

  // Render base chips
  const baseDomainsChips = document.getElementById("baseDomainsChips");
  baseDomainsChips.innerHTML = "";
  (baseD || []).forEach(d => baseDomainsChips.appendChild(chip(d)));

  const baseSuffixesChips = document.getElementById("baseSuffixesChips");
  baseSuffixesChips.innerHTML = "";
  (baseS || []).forEach(s => baseSuffixesChips.appendChild(chip(s)));

  // Render textareas (user)
  const userDomains = document.getElementById("userDomains");
  userDomains.value = (userD || []).join("\n");

  const userSuffixes = document.getElementById("userSuffixes");
  userSuffixes.value = (userS || []).join("\n");
}

function sanitizeLines(val) {
  return Array.from(new Set(
    (val || "")
      .split(/\r?\n/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  ));
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

document.addEventListener("DOMContentLoaded", () => {
  loadLists().catch(()=>{});
  document.getElementById("saveUserDomains").onclick = saveUserDomains;
  document.getElementById("clearUserDomains").onclick = clearUserDomains;
  document.getElementById("saveUserSuffixes").onclick = saveUserSuffixes;
  document.getElementById("clearUserSuffixes").onclick = clearUserSuffixes;
});