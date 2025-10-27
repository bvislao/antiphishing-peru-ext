import { DEFAULT_TRUSTED_ETLD1 } from "./whitelist.js";

async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || "";
}

function render(res) {
  const root = document.getElementById("status");
  if (!res) { root.textContent = "No disponible."; return; }
  const { level, reasons, etld1, trustedMatch } = res;

  const cls = level === "ALTO" ? "high" : level === "MEDIO" ? "mid" : "low";

  // Recupera detecciones detalladas del content script (si respondió con payload completo)
  // Como el background devuelve sólo conteos, pedimos al content una vez más:
  chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
    let detailsHtml = "";
    try {
      const probe = await chrome.tabs.sendMessage(tab.id, { type: "PAGE_HINTS", payload: { url: tab.url, hints: {} }});
      const dets = probe?.payload?.sensitive?._details || [];
      if (dets.length) {
        const grouped = dets.slice(0, 6).map(d => `<li>${d.type.toUpperCase()} — <span class="muted">${(d.label||d.name||d.id)||"campo"}</span></li>`).join("");
        detailsHtml = `<div class="muted">Campos sensibles detectados:</div><ul>${grouped}</ul>`;
      }
    } catch {}

    root.innerHTML = `
      <div><span class="pill ${cls}">${level}</span> &nbsp; Dominio: <b>${etld1 || "N/D"}</b> ${trustedMatch ? "✔️ (confiable)" : ""}</div>
      ${reasons?.length ? `<ul>${reasons.slice(0,5).map(r=>`<li>${r}</li>`).join("")}</ul>` : "<div class='muted'>Sin señales relevantes.</div>"}
      ${detailsHtml}
    `;
  });
}

async function assessNow() {
  const url = await getActiveTabUrl();
  if (!url) return render(null);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const res = await chrome.tabs.sendMessage(tab.id, { type: "PAGE_HINTS", payload: { url, hints: {} }});
  render(res?.payload);
}

document.getElementById("openOptions").onclick = () => chrome.runtime.openOptionsPage();
document.getElementById("refresh").onclick = assessNow;

assessNow();