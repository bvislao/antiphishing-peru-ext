async function getActiveTabUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || "";
}
function render(res) {
  const root = document.getElementById("status");
  if (!res) { root.textContent = "No disponible."; return; }
  const { level, reasons, etld1, trustedMatch, closestTrusted } = res;
  const cls = level === "ALTO" ? "high" : level === "MEDIO" ? "mid" : "low";
  root.innerHTML = `
    <div><span class="pill ${cls}">${level}</span> &nbsp; Dominio: <b>${etld1 || "N/D"}</b> ${trustedMatch ? "✔️ (confiable)" : ""}</div>
    ${!trustedMatch && closestTrusted ? `<div class="muted">Similar a: ${closestTrusted}</div>` : ""}
    ${reasons?.length ? `<ul>${reasons.slice(0,5).map(r=>`<li>${r}</li>`).join("")}</ul>` : "<div class='muted'>Sin señales relevantes.</div>"}
  `;
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