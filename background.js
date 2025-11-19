// =========================
// Anti-Phishing Perú — background.js (cross-browser)
// =========================
const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

// ---- Storage helpers ----
const storageGet = (keys) => new Promise((resolve) => {
  try {
    const fn = API.storage?.sync?.get;
    if (!fn) return resolve({});
    if (fn.length > 1) fn.call(API.storage.sync, keys, resolve);
    else Promise.resolve(fn.call(API.storage.sync, keys)).then(resolve);
  } catch { resolve({}); }
});
const storageSet = (items) => new Promise((resolve) => {
  try {
    const fn = API.storage?.sync?.set;
    if (!fn) return resolve();
    if (fn.length > 1) fn.call(API.storage.sync, items, resolve);
    else Promise.resolve(fn.call(API.storage.sync, items)).then(resolve);
  } catch { resolve(); }
});

// ---- Notificaciones (no todas las plataformas soportan) ----
const canNotify = !!(API && API.notifications && API.notifications.create);
const notify = async ({ title, message }) => {
  if (!canNotify) return false;
  return new Promise((resolve) => {
    try {
      if (API.notifications.create.length <= 1) {
        Promise.resolve(API.notifications.create({
          type: "basic", iconUrl: "icon128.png",
          title: title || "Aviso", message: message || ""
        })).then(() => resolve(true), () => resolve(false));
      } else {
        API.notifications.create("", {
          type: "basic", iconUrl: "icon128.png",
          title: title || "Aviso", message: message || ""
        }, () => resolve(true));
      }
    } catch { resolve(false); }
  });
};

// ===========================================================
// Whitelist remota con fallback y caché en storage.sync
// ===========================================================
const REMOTE_WHITELIST_URL = "https://whitelist-antiphishing-pe.netlify.app/whitelist.json";
const REMOTE_TTL_MS = 1 * 60 * 60 * 1000; //1hr

// Fallback local si el remoto falla por cualquier motivo
const DEFAULT_TRUSTED_ETLD1_FALLBACK = [
  "viabcp.com","interbank.pe","bbva.pe","scotiabank.com.pe","bn.com.pe","banbif.com.pe","citibank.com","compartamos.com.pe","santander.com.pe",
  "mibanco.com.pe","pichincha.pe","bancofalabella.pe","bancoripley.com.pe","bancom.pe","bancognb.com.pe","bancofalabella.pe","alfinbanco.pe","bankofchina.com",".bancobci.pe",
  "cajaarequipa.pe","cajahuancayo.com.pe","cajapiura.pe","cajasullana.pe","cajatrujillo.com.pe","icbc.com.pe","santanderconsumer.com.pe",
  "agrobanco.com.pe","cofide.com.pe","mivivienda.com.pe","confianza.pe","efectiva.com.pe","proempresa.com.pe","surgir.com.pe","mafperu.com","tarjetaoh.pe",
  "qapaq.pe","cmac-cusco.com.pe","cajadelsanta.pe","cajaica.pe","cajamaynas.pe","cajapaita.pe","cmactacna.com.pe","cajametropolitana.com.pe","cajaincasur.com.pe",
  "losandes.pe","prymera.pe","cajacentro.com.pe","tarjetacencosud.pe","alternativa.com.pe","volvofinancialservices.com","vivela.lat","santanderconsumer.com.pe","totalserviciosfinancieros.com.pe",
  "jpmorgan.com",
  "google.com","microsoft.com","outlook.com","office.com","live.com","hotmail.com",
  "apple.com","icloud.com","yahoo.com",
  "github.com","gitlab.com","stackoverflow.com","atlassian.com","docker.com","slack.com","zoom.us",
  "linkedin.com","facebook.com","whatsapp.com","instagram.com","x.com",
  "tiktok.com","reddit.com","youtube.com","netflix.com","spotify.com",
  "amazon.com","ebay.com","paypal.com","mercadolibre.com","mercadolibre.com.pe"
];
const DEFAULT_TRUSTED_SUFFIXES_FALLBACK = ["gob.pe","edu.pe"];

// Intenta traer la whitelist desde el remoto (acepta array o {domainsDefault:[]})
async function fetchRemoteWhitelistOnce() {
  try {
    const resp = await fetch(REMOTE_WHITELIST_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("Remote not ok");
    const json = await resp.json();
    let list = Array.isArray(json) ? json : (json?.domainsDefault || []);
    list = list.map(s => String(s || "").toLowerCase().trim()).filter(Boolean);
    return list.length ? list : null;
  } catch {
    return null;
  }
}

// Obtiene lista base con caché (preferencia: remoto -> storage -> fallback)
async function getRemoteOrCachedBaseDomains(force = false) {
  const { trustedETLD1, trustedETLD1_ts } = await storageGet(["trustedETLD1", "trustedETLD1_ts"]);
  const now = Date.now();

  // Usa caché si existe y no está vencida
  if (!force && Array.isArray(trustedETLD1) && trustedETLD1.length && typeof trustedETLD1_ts === "number" && (now - trustedETLD1_ts) < REMOTE_TTL_MS) {
    return trustedETLD1;
  }

  // Refresca desde remoto
  const remote = await fetchRemoteWhitelistOnce();
  if (remote && remote.length) {
    await storageSet({ trustedETLD1: remote, trustedETLD1_ts: now });
    return remote;
  }

  // Si no hay remoto, usa lo que hubiera en caché; si no, fallback local
  if (Array.isArray(trustedETLD1) && trustedETLD1.length) {
    return trustedETLD1;
  }
  await storageSet({ trustedETLD1: DEFAULT_TRUSTED_ETLD1_FALLBACK, trustedETLD1_ts: now });
  return DEFAULT_TRUSTED_ETLD1_FALLBACK;
}

// ===========================================================
// Lógica existente (usando la lista base remota/caché/fallback)
// ===========================================================

// ---- SETTINGS por defecto ----
const SETTINGS_DEFAULT = {
  strictMode: false,
  enabledKinds: { card:true, cvv:true, expiry:true, dni:true, cci:true },
  strictBlockKinds: ["card","cvv","expiry","cci"],
  dniOnlyFinancial: true
};

// ---- Helpers de dominio ----
const PUBLIC_SUFFIXES_PE = new Set(["pe","com.pe","org.pe","gob.pe","edu.pe","mil.pe","net.pe"]);
function getETLD1(host) {
  const parts = (host || "").split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  if (PUBLIC_SUFFIXES_PE.has(last2)) return parts.slice(-3).join(".");
  if (PUBLIC_SUFFIXES_PE.has(parts.at(-1))) return parts.slice(-2).join(".");
  return parts.slice(-2).join(".");
}
const isIPAddress = (h) => /^(\d{1,3}\.){3}\d{1,3}$/.test(h);
function levenshtein(a,b){
  const m = Array.from({length:a.length+1},(_,i)=>[i]);
  for(let j=1;j<=b.length;j++) m[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      const c = a[i-1]===b[j-1]?0:1;
      m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1]+c);
    }
  }
  return m[a.length][b.length];
}

// ---- Listas (base + usuario) ----
async function getBaseDomains() {
  return getRemoteOrCachedBaseDomains(false);
}
async function getBaseSuffixes() {
  const { trustedSuffixes } = await storageGet(["trustedSuffixes"]);
  if (Array.isArray(trustedSuffixes) && trustedSuffixes.length) return trustedSuffixes;
  await storageSet({ trustedSuffixes: DEFAULT_TRUSTED_SUFFIXES_FALLBACK });
  return DEFAULT_TRUSTED_SUFFIXES_FALLBACK;
}
async function getUserDomains() {
  const { userTrustedETLD1 } = await storageGet(["userTrustedETLD1"]);
  return Array.isArray(userTrustedETLD1) ? userTrustedETLD1 : [];
}
async function getUserSuffixes() {
  const { userTrustedSuffixes } = await storageGet(["userTrustedSuffixes"]);
  return Array.isArray(userTrustedSuffixes) ? userTrustedSuffixes : [];
}
async function getEffectiveLists() {
  const [baseD, baseS, userD, userS] = await Promise.all([
    getBaseDomains(), getBaseSuffixes(), getUserDomains(), getUserSuffixes()
  ]);
  const effD = Array.from(new Set([...baseD, ...userD]));
  const effS = Array.from(new Set([...baseS, ...userS]));
  return { baseD, baseS, userD, userS, effD, effS };
}
function isTrustedDomainOrSuffix(etld1, host, doms, sufx) {
  const h = (host||"").toLowerCase();
  const e = (etld1||"").toLowerCase();
  if (doms.includes(e)) return true;
  return sufx.some(suf => {
    suf = (suf||"").toLowerCase();
    return (h === suf || e === suf || h.endsWith("." + suf) || e.endsWith("." + suf));
  });
}

// ---- Señales semánticas ----
const FIN_BRANDS = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn","yape","plin","visa","mastercard","amex"];
const FIN_TERMS  = [
  "banca","en linea","online banking","transferencia","pago","tarjeta","credito","préstamo","prestamo",
  "hipoteca","saldo","cci","cuenta interbancaria","token","otp","clave dinamica","clave dinámica",
  "mi cuenta","ahorro","ctacte","cajero","cobro","voucher"
];
function financialIntentScore({ host, path, lexical = {}, sensitive = {} }) {
  let score = 0;
  const hp = (host + " " + path).toLowerCase();
  if (FIN_BRANDS.some(k => hp.includes(k))) score += 2;
  const finHits = Number(lexical.financialHits || 0);
  const brandHits = Number(lexical.brandHits || 0);
  score += Math.min(4, finHits + brandHits);
  const hasCardLike = (sensitive.card||0) + (sensitive.cci||0) + (sensitive.expiry||0) + (sensitive.cvv||0) > 0;
  if (hasCardLike) score += 3;
  return score;
}

// ---- SETTINGS ----
async function getSettings() {
  const s = await storageGet(["strictMode","enabledKinds","strictBlockKinds","dniOnlyFinancial"]);
  return {
    strictMode: (typeof s.strictMode === "boolean") ? s.strictMode : SETTINGS_DEFAULT.strictMode,
    enabledKinds: { ...SETTINGS_DEFAULT.enabledKinds, ...(s.enabledKinds || {}) },
    strictBlockKinds: Array.isArray(s.strictBlockKinds) ? s.strictBlockKinds : SETTINGS_DEFAULT.strictBlockKinds,
    dniOnlyFinancial: (typeof s.dniOnlyFinancial === "boolean") ? s.dniOnlyFinancial : SETTINGS_DEFAULT.dniOnlyFinancial
  };
}
async function setSettings(next) {
  const cur = await getSettings();
  const upd = { ...cur, ...(next || {}) };
  await storageSet(upd);
  return upd;
}

// ---- Evaluación ----
async function assessRisk(url, pageHints = {}, senderTabId = null) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase();
  const scheme = u.protocol.replace(":", "");
  const etld1 = getETLD1(host);

  const [{ effD, effS }, settings] = await Promise.all([getEffectiveLists(), getSettings()]);
  const isTrusted = isTrustedDomainOrSuffix(etld1, host, effD, effS);

  if (isTrusted) {
    try { if (senderTabId && API.action?.setBadgeText) API.action.setBadgeText({ tabId: senderTabId, text: "" }); } catch {}
    return { level: "BAJO", risk: 0, reasons: ["Dominio marcado como confiable."], etld1, isTrusted: true, settings };
  }

  let risk = 0; const reasons = [];
  if (isIPAddress(host)) { risk += 2; reasons.push("La URL usa una IP en lugar de dominio."); }
  if (scheme !== "https") { risk += 2; reasons.push("Conexión sin HTTPS."); }
  if (host.includes("xn--")) { risk += 2; reasons.push("Dominio con punycode (posible homógrafo)."); }
  const hyphens = (host.match(/-/g) || []).length; if (hyphens >= 3) { risk += 1; reasons.push("Dominio con muchos guiones."); }

  let minDist = Infinity, closest = null;
  for (const t of effD) { const d = levenshtein(etld1, t); if (d < minDist) { minDist = d; closest = t; } }
  if (minDist <= 2) { risk += 2; reasons.push(`Dominio muy parecido a “${closest}” (${etld1}).`); }

  const brandKeys = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn"];
  if (brandKeys.some(k => host.includes(k) || u.pathname.toLowerCase().includes(k))) {
    risk += 2; reasons.push("Marca de entidad financiera en dominio no oficial.");
  }

  if (Array.isArray(pageHints.forms)) {
    const badActs = pageHints.forms.filter(a => {
      try { const au = new URL(a, url); return (au.protocol !== "https:" || getETLD1(au.hostname.toLowerCase()) !== etld1); }
      catch { return true; }
    });
    if (badActs.length) { risk += 2; reasons.push("Formularios que envían datos a otro dominio o sin HTTPS."); }
  }

  const s = pageHints.sensitive || {};
  const totalSensitive = (s.dni||0)+(s.card||0)+(s.cci||0)+(s.expiry||0)+(s.cvv||0);
  if (totalSensitive > 0) {
    const intent = financialIntentScore({ host, path: u.pathname || "", lexical: pageHints.lexical || {}, sensitive: s });
    const hasCardLike = (s.card||0) + (s.cci||0) + (s.expiry||0) + (s.cvv||0) > 0;
    if (hasCardLike || intent >= 2) {
      const highWeight = (s.card||0) + (s.cvv||0) > 0 ? 4 : 3;
      risk += highWeight;
      const kinds=[]; if (s.dni)kinds.push(`DNI (${s.dni})`); if (s.card)kinds.push(`Tarjeta (${s.card})`);
      if (s.cvv)kinds.push(`CVV (${s.cvv})`); if (s.expiry)kinds.push(`Fecha de vencimiento (${s.expiry})`); if (s.cci)kinds.push(`CCI (${s.cci})`);
      reasons.push(`Datos sensibles en contexto no oficial: ${kinds.join(", ")}.`);
    }
  }

  let level = "BAJO";
  if (risk >= 5) level = "ALTO"; else if (risk >= 2) level = "MEDIO";

  try {
    const tabId = senderTabId;
    if (tabId && API.action?.setBadgeText) {
      const badge = level === "ALTO" ? "!!" : level === "MEDIO" ? "!" : "";
      API.action.setBadgeText({ tabId, text: badge });
      if (API.action?.setBadgeBackgroundColor) {
        API.action.setBadgeBackgroundColor({ tabId, color: (level === "ALTO" ? [255,0,0,255] : level === "MEDIO" ? [255,165,0,255] : [0,0,0,0]) });
      }
    }
  } catch {}

  if (level === "ALTO" && canNotify) {
    try { await notify({ title: "⚠️ Posible phishing detectado", message: reasons.slice(0,2).join(" • ") }); } catch {}
  }
  return { level, risk, reasons, etld1, isTrusted: false, settings };
}

// ---- Acciones de confianza + Settings API ----
async function addUserTrustedDomain(etld1) {
  const { userTrustedETLD1 = [] } = await storageGet(["userTrustedETLD1"]);
  if (!userTrustedETLD1.includes(etld1)) { userTrustedETLD1.push(etld1); await storageSet({ userTrustedETLD1 }); }
  return userTrustedETLD1;
}
async function removeUserTrustedDomain(etld1) {
  const { userTrustedETLD1 = [] } = await storageGet(["userTrustedETLD1"]);
  const next = userTrustedETLD1.filter(d => d !== etld1);
  await storageSet({ userTrustedETLD1: next });
  return next;
}

// ---- Mensajería
API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "PAGE_HINTS") {
        const { url, hints } = msg.payload || {};
        const tabId = sender?.tab?.id || null;
        const res = await assessRisk(url, hints || {}, tabId);
        sendResponse({ type: "RISK_RESULT", payload: res });
      } else if (msg?.type === "USER_TRUST_DOMAIN_ADD") {
        const { url } = msg.payload || {};
        const u = new URL(url); const etld1 = getETLD1(u.hostname.toLowerCase());
        await addUserTrustedDomain(etld1);
        sendResponse({ type: "USER_TRUST_DOMAIN_ADD_OK", payload: { etld1 } });
      } else if (msg?.type === "USER_TRUST_DOMAIN_REMOVE") {
        const { url, etld1: e } = msg.payload || {};
        const etld1 = e || (url ? getETLD1(new URL(url).hostname.toLowerCase()) : "");
        if (!etld1) throw new Error("Sin etld1");
        await removeUserTrustedDomain(etld1);
        sendResponse({ type: "USER_TRUST_DOMAIN_REMOVE_OK", payload: { etld1 } });
      } else if (msg?.type === "GET_TRUST_LISTS") {
        const { baseD, baseS, userD, userS, effD, effS } = await getEffectiveLists();
        sendResponse({ type: "GET_TRUST_LISTS_OK", payload: { baseD, baseS, userD, userS, effD, effS } });
      } else if (msg?.type === "SET_TRUST_LISTS") {
        const { trustedETLD1, trustedSuffixes, userTrustedETLD1, userTrustedSuffixes } = msg.payload || {};
        if (Array.isArray(trustedETLD1)) await storageSet({ trustedETLD1 });
        if (Array.isArray(trustedSuffixes)) await storageSet({ trustedSuffixes });
        if (Array.isArray(userTrustedETLD1)) await storageSet({ userTrustedETLD1 });
        if (Array.isArray(userTrustedSuffixes)) await storageSet({ userTrustedSuffixes });
        const lists = await getEffectiveLists();
        sendResponse({ type: "SET_TRUST_LISTS_OK", payload: lists });
      } else if (msg?.type === "GET_SETTINGS") {
        const settings = await getSettings();
        sendResponse({ type: "GET_SETTINGS_OK", payload: settings });
      } else if (msg?.type === "SET_SETTINGS") {
        const settings = await setSettings(msg.payload || {});
        sendResponse({ type: "SET_SETTINGS_OK", payload: settings });
      } else if (msg?.type === "REFRESH_REMOTE_WHITELIST") {
        const base = await getRemoteOrCachedBaseDomains(true);
        sendResponse({ type: "REFRESH_REMOTE_WHITELIST_OK", payload: { base } });
      }
    } catch (e) {
      sendResponse({ type: "ERROR", error: String(e) });
    }
  })();
  return true;
});

// ---- Refresco automático al instalar/arrancar
try { API.runtime.onInstalled.addListener(() => { getRemoteOrCachedBaseDomains(true); }); } catch {}
try { API.runtime.onStartup?.addListener(() => { getRemoteOrCachedBaseDomains(false); }); } catch {}