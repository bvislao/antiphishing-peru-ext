// =========================
// Anti-Phishing Perú — popup.js (cross-browser)
// =========================
const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

const tabsQuery = (queryInfo) =>
  new Promise((resolve) => {
    try {
      const fn = API.tabs?.query;
      if (!fn) return resolve([]);
      if (fn.length > 1) fn.call(API.tabs, queryInfo, resolve);
      else { Promise.resolve(fn.call(API.tabs, queryInfo)).then(resolve); }
    } catch { resolve([]); }
  });

const tabsSendMessage = (tabId, msg) =>
  new Promise((resolve) => {
    try {
      const fn = API.tabs?.sendMessage;
      if (!fn) return resolve(null);
      if (fn.length > 2) fn.call(API.tabs, tabId, msg, resolve);
      else { Promise.resolve(fn.call(API.tabs, tabId, msg)).then(resolve); }
    } catch { resolve(null); }
  });

async function getActiveTabUrl() {
  const [tab] = await tabsQuery({ active: true, currentWindow: true });
  return tab?.url || "";
}

function render(res) {
  const root = document.getElementById("status");
  if (!res) { root.textContent = "No disponible."; return; }
  const { level, reasons, etld1, trustedMatch } = res;
  const cls = level === "ALTO" ? "high" : level === "MEDIO" ? "mid" : "low";
  root.innerHTML = `
    <div><span class="pill ${cls}">${level}</span> &nbsp; Dominio: <b>${etld1 || "N/D"}</b> ${trustedMatch ? "✔️ (confiable)" : ""}</div>
    ${reasons?.length ? `<ul>${reasons.slice(0,5).map(r=>`<li>${r}</li>`).join("")}</ul>` : "<div class='muted'>Sin señales relevantes.</div>"}
  `;
}

async function assessNow() {
  const url = await getActiveTabUrl();
  if (!url) return render(null);
  const [tab] = await tabsQuery({ active: true, currentWindow: true });
  const res = await tabsSendMessage(tab.id, { type: "PAGE_HINTS", payload: { url, hints: {} } });
  render(res?.payload);
}

document.getElementById("openOptions").onclick = () => API.runtime.openOptionsPage();
document.getElementById("refresh").onclick = assessNow;

assessNow();