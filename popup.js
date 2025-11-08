// =========================
// Anti-Phishing Perú — popup.js (cross-browser)
// =========================
const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

const $ = (id) => document.getElementById(id);

const tabsQuery = (q) => new Promise((res) => {
  try {
    const fn = API.tabs?.query;
    if (!fn) return res([]);
    if (fn.length > 1) fn.call(API.tabs, q, res);
    else Promise.resolve(fn.call(API.tabs, q)).then(res);
  } catch { res([]); }
});
const tabsSendMessage = (tabId, msg) => new Promise((res) => {
  try {
    const fn = API.tabs?.sendMessage;
    if (!fn) return res(null);
    if (fn.length > 2) fn.call(API.tabs, tabId, msg, res);
    else Promise.resolve(fn.call(API.tabs, tabId, msg)).then(res);
  } catch { res(null); }
});
const rtSend = (msg) => new Promise((res) => {
  try {
    API.runtime.sendMessage(msg, (r) => res(r));
  } catch { res(null); }
});

// ---- UI helpers
function setRiskUI(level){
  const pill = $("riskPill");
  const bar  = $("riskbar");
  const mini = $("miniHint");
  const map = { "BAJO":"low", "MEDIO":"mid", "ALTO":"high" };
  const cls = map[level] || "low";
  pill.className = `pill ${cls}`;
  pill.textContent = level || "BAJO";
  bar.className = `riskbar ${cls}`;
  mini.textContent = (level ? "Listo" : "—");
}

function renderReasons(reasons){
  const wrap = $("reasonsWrap");
  if (!reasons || !reasons.length) {
    wrap.className = "muted";
    wrap.textContent = "Sin señales relevantes.";
    return;
  }
  wrap.className = "";
  wrap.innerHTML = `<ul>${reasons.slice(0,5).map(r=>`<li>${r}</li>`).join("")}</ul>`;
}

function setTrustedFlag(isTrusted){
  $("trustedFlag").textContent = isTrusted ? "✔️ Dominio en tu lista de confianza" : "";
  $("trustToggle").textContent = isTrusted ? "Quitar confianza" : "Confiar";
}

// ---- State
let lastRes = null;  // { level, reasons, etld1, isTrusted, settings, url? }
let activeTabId = null;

// ---- Actions
async function assessActive(){
  $("miniHint").innerHTML = `<span class="spinner"></span> Analizando…`;
  setRiskUI("BAJO"); renderReasons([]); setTrustedFlag(false);
  $("etld1").textContent = "—";

  const [tab] = await tabsQuery({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    $("miniHint").textContent = "No disponible";
    return;
  }
  activeTabId = tab.id;

  // Pedimos al content script que recoja hints y pida evaluación al background
  // Si no hay content (chrome://, pdf, tienda, etc.), hacemos fallback a dominio puro
  let res = await tabsSendMessage(tab.id, { type: "POPUP_COLLECT_AND_ASSESS" });

  if (!res || res.type !== "RISK_RESULT") {
    // Fallback: intenta evaluación básica (sin hints)
    const bg = await rtSend({ type:"PAGE_HINTS", payload: { url: tab.url || "", hints: {} } });
    res = bg;
  }

  if (!res || res.type !== "RISK_RESULT") {
    $("miniHint").textContent = "No se pudo analizar esta página.";
    return;
  }

  const payload = res.payload || {};
  lastRes = { ...payload, url: tab.url || "" };

  setRiskUI(payload.level || "BAJO");
  renderReasons(payload.reasons || []);
  $("etld1").textContent = payload.etld1 || "—";
  setTrustedFlag(!!payload.isTrusted);

  // Carga estado de Modo Estricto
  const strict = !!payload.settings?.strictMode;
  $("strictToggle").checked = strict;
}

async function toggleTrust(){
  if (!lastRes) return;
  const etld1 = lastRes.etld1 || "";
  const url = lastRes.url || "";

  if (!lastRes.isTrusted) {
    const ok = confirm(
      "Añadir este dominio a tu lista de confianza.\n" +
      "Úsalo solo si estás 100% seguro. Ocultará futuras alertas para este dominio.\n\n" +
      "¿Continuar?"
    );
    if (!ok) return;
    const r = await rtSend({ type:"USER_TRUST_DOMAIN_ADD", payload:{ url } });
    if (r && r.type === "USER_TRUST_DOMAIN_ADD_OK") {
      lastRes.isTrusted = true;
      setTrustedFlag(true);
    }
  } else {
    const ok = confirm("Quitar este dominio de tu lista de confianza. ¿Continuar?");
    if (!ok) return;
    const r = await rtSend({ type:"USER_TRUST_DOMAIN_REMOVE", payload:{ etld1, url } });
    if (r && r.type === "USER_TRUST_DOMAIN_REMOVE_OK") {
      lastRes.isTrusted = false;
      setTrustedFlag(false);
    }
  }
}

async function toggleStrict(ev){
  const want = !!ev.target.checked;
  const r = await rtSend({ type:"SET_SETTINGS", payload:{ strictMode: want } });
  if (!(r && r.type === "SET_SETTINGS_OK")) {
    // revertir si falla
    ev.target.checked = !want;
    alert("No se pudo actualizar el Modo Estricto. Intenta desde Opciones.");
  }
}

// ---- Bind
$("openOptions").onclick = () => API.runtime.openOptionsPage();
$("refresh").onclick = assessActive;
$("trustToggle").onclick = toggleTrust;
$("strictToggle").onchange = toggleStrict;

// ---- Start
assessActive();