const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

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
const tabsQuery = (queryInfo) => new Promise((resolve) => {
  try {
    const fn = API.tabs?.query;
    if (!fn) return resolve([]);
    if (fn.length > 1) fn.call(API.tabs, queryInfo, resolve);
    else Promise.resolve(fn.call(API.tabs, queryInfo)).then(resolve);
  } catch { resolve([]); }
});
const canNotify = !!(API && API.notifications && API.notifications.create);
const notify = async (opts) => {
  if (!canNotify) return false;
  return new Promise((resolve) => {
    try {
      if (API.notifications.create.length <= 1) {
        Promise.resolve(API.notifications.create({
          type: "basic", iconUrl: "icon128.png",
          title: opts.title || "Aviso", message: opts.message || ""
        })).then(() => resolve(true), () => resolve(false));
      } else {
        API.notifications.create("", {
          type: "basic", iconUrl: "icon128.png",
          title: opts.title || "Aviso", message: opts.message || ""
        }, () => resolve(true));
      }
    } catch { resolve(false); }
  });
};

// ---- Semillas fallback si no se cargó whitelist.js ----
const DEFAULT_TRUSTED_ETLD1_FALLBACK = globalThis.DEFAULT_TRUSTED_ETLD1 || [
  "bcp.com.pe","interbank.pe","bbva.pe","scotiabank.com.pe","bn.com.pe","banbif.pe",
  "mibanco.com.pe","pichincha.pe","bancofalabella.pe","bancoripley.com.pe",
  "cajaarequipa.pe","cajahuancayo.com.pe","cajapiura.pe","cajasullana.pe","cajatrujillo.pe",
  "google.com","microsoft.com","outlook.com","office.com","live.com","hotmail.com",
  "apple.com","icloud.com","yahoo.com",
  "github.com","gitlab.com","stackoverflow.com","atlassian.com","docker.com","slack.com","zoom.us",
  "linkedin.com","facebook.com","whatsapp.com","instagram.com","x.com",
  "tiktok.com","reddit.com","youtube.com","netflix.com","spotify.com",
  "amazon.com","ebay.com","paypal.com","mercadolibre.com"
];

const DEFAULT_TRUSTED_SUFFIXES_FALLBACK = (globalThis.DEFAULT_TRUSTED_SUFFIXES || ["gob.pe","edu.pe"]);

// ---- Heurísticas / helpers dominio ----
const PUBLIC_SUFFIXES_PE = new Set(["pe","com.pe","org.pe","gob.pe","edu.pe","mil.pe","net.pe"]);
const FIN_BRANDS = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn","yape","plin","visa","mastercard","amex"];
const FIN_TERMS  = [
  "banca","en linea","online banking","transferencia","pago","tarjeta","credito","préstamo","prestamo",
  "hipoteca","saldo","cci","cuenta interbancaria","token","otp","clave dinamica","clave dinámica",
  "mi cuenta","ahorro","ctacte","cajero","cobro","voucher"
];

function getETLD1(host) {
  const parts = (host || "").split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  if (PUBLIC_SUFFIXES_PE.has(last2)) return parts.slice(-3).join(".");
  if (PUBLIC_SUFFIXES_PE.has(parts.at(-1))) return parts.slice(-2).join(".");
  return parts.slice(-2).join(".");
}
function isIPAddress(h){ return /^(\d{1,3}\.){3}\d{1,3}$/.test(h); }
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

// ---- Storage loaders ----
async function getTrustedDomains() {
  const { trustedETLD1 } = await storageGet("trustedETLD1");
  if (Array.isArray(trustedETLD1) && trustedETLD1.length) return trustedETLD1;
  await storageSet({ trustedETLD1: DEFAULT_TRUSTED_ETLD1_FALLBACK });
  return DEFAULT_TRUSTED_ETLD1_FALLBACK;
}
async function getTrustedSuffixes() {
  const { trustedSuffixes } = await storageGet("trustedSuffixes");
  if (Array.isArray(trustedSuffixes) && trustedSuffixes.length) return trustedSuffixes;
  await storageSet({ trustedSuffixes: DEFAULT_TRUSTED_SUFFIXES_FALLBACK });
  return DEFAULT_TRUSTED_SUFFIXES_FALLBACK;
}

// ---- Trust checks (dominio o sufijo) ----
function isTrustedDomainOrSuffix(etld1, host, domains, suffixes) {
  if (domains.includes(etld1)) return true;
  const h = host.toLowerCase();
  const e = (etld1 || "").toLowerCase();
  return suffixes.some(suf => {
    suf = (suf || "").toLowerCase();
    return (h === suf || e === suf || h.endsWith("." + suf) || e.endsWith("." + suf));
  });
}

function isSafeDniBySuffix(etld1, host, suffixes) {
  // Considera “seguro esperable” si el dominio cae bajo un sufijo público confiable (ej. gob.pe, edu.pe).
  return isTrustedDomainOrSuffix(etld1, host, [], suffixes);
}

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

// ---- Config por defecto ----
const DEFAULT_STRICT_MODE = true;
const DEFAULT_STRICT_BLOCK_KINDS = ["card","cvv","expiry","cci"];
const DEFAULT_DNI_ONLY_FINANCIAL = true;

// ---- Evaluador principal ----
async function assessRisk(url, pageHints = {}, senderTabId = null) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase();
  const scheme = u.protocol.replace(":", "");
  const etld1 = getETLD1(host);

  const trustedDomains = await getTrustedDomains();
  const trustedSuffixes = await getTrustedSuffixes();
  const isTrusted = isTrustedDomainOrSuffix(etld1, host, trustedDomains, trustedSuffixes);

  const { strictMode, strictBlockKinds } = {
    strictMode: DEFAULT_STRICT_MODE,
    strictBlockKinds: DEFAULT_STRICT_BLOCK_KINDS
  };
  const { dniOnlyFinancial } = { dniOnlyFinancial: DEFAULT_DNI_ONLY_FINANCIAL };

  let risk = 0; const reasons = [];

  if (isIPAddress(host)) { risk += 2; reasons.push("La URL usa una IP en lugar de dominio."); }
  if (scheme !== "https") { risk += 2; reasons.push("Conexión sin HTTPS."); }
  if (host.includes("xn--")) { risk += 2; reasons.push("Dominio con punycode (posible homógrafo)."); }
  const hyphens = (host.match(/-/g) || []).length;
  if (hyphens >= 3) { risk += 1; reasons.push("Dominio con muchos guiones."); }

  // Look-alike respecto a dominios confiables (si no cae en sufijo/dominio confiable)
  if (!isTrusted) {
    let minDist = Infinity, closest = null;
    for (const t of trustedDomains) {
      const d = levenshtein(etld1, t);
      if (d < minDist) { minDist = d; closest = t; }
    }
    if (minDist <= 2) {
      risk += 2; reasons.push(`Dominio muy parecido a “${closest}” (${etld1}).`);
    }
  }

  // Marca financiera en dominio NO oficial (si no está en confiables)
  if (!isTrusted) {
    const brandKeys = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn"];
    if (brandKeys.some(k => host.includes(k) || u.pathname.toLowerCase().includes(k))) {
      risk += 2; reasons.push("Marca de entidad financiera en dominio no oficial.");
    }
  }

  // Formularios con acción hacia otro dominio o sin HTTPS
  if (Array.isArray(pageHints.forms)) {
    const badActs = pageHints.forms.filter(a => {
      try {
        const au = new URL(a, url);
        return (au.protocol !== "https:" || getETLD1(au.hostname.toLowerCase()) !== etld1);
      } catch { return true; }
    });
    if (badActs.length) { risk += 2; reasons.push("Formularios que envían datos a otro dominio o sin HTTPS."); }
  }

  // Datos sensibles
  const s = pageHints.sensitive || {};
  const totalSensitive = (s.dni||0)+(s.card||0)+(s.cci||0)+(s.expiry||0)+(s.cvv||0);

  if (!isTrusted && totalSensitive > 0) {
    const intent = financialIntentScore({
      host, path: u.pathname || "", lexical: pageHints.lexical || {}, sensitive: s
    });
    const hasCardLike = (s.card||0) + (s.cci||0) + (s.expiry||0) + (s.cvv||0) > 0;

    if (hasCardLike || intent >= 2) {
      const highWeight = (s.card||0) + (s.cvv||0) > 0 ? 4 : 3;
      risk += highWeight;
      const kinds=[]; if (s.dni)kinds.push(`DNI (${s.dni})`); if (s.card)kinds.push(`Tarjeta (${s.card})`);
      if (s.cvv)kinds.push(`CVV (${s.cvv})`); if (s.expiry)kinds.push(`Fecha de vencimiento (${s.expiry})`); if (s.cci)kinds.push(`CCI (${s.cci})`);
      reasons.push(`Datos sensibles en contexto no oficial: ${kinds.join(", ")}.`);
    } else if (s.dni) {
      if (isSafeDniBySuffix(etld1, host, trustedSuffixes)) {
        reasons.push("DNI solicitado en dominio/sufijo público (esperable).");
      } else if (!dniOnlyFinancial) {
        risk += 1; reasons.push("DNI detectado fuera de lista oficial (alerta suave).");
      } else {
        reasons.push("DNI detectado sin señales financieras; se mantiene en BAJO.");
      }
    }
  }

  if (pageHints.hasPasswordFields && !isTrusted) {
    risk += 1; reasons.push("Página solicita credenciales en dominio no confiable.");
  }

  let level = "BAJO";
  if (risk >= 5) level = "ALTO";
  else if (risk >= 2) level = "MEDIO";

  // Badge
  try {
    const tabId = senderTabId;
    if (tabId && API.action?.setBadgeText) {
      const badge = level === "ALTO" ? "!!" : level === "MEDIO" ? "!" : "";
      API.action.setBadgeText({ tabId, text: badge });
      if (API.action?.setBadgeBackgroundColor) {
        API.action.setBadgeBackgroundColor({
          tabId,
          color: level === "ALTO" ? [255,0,0,255] : level === "MEDIO" ? [255,165,0,255] : [0,0,0,0]
        });
      }
    }
  } catch {}

  if (level === "ALTO" && canNotify) {
    try { await notify({ title: "⚠️ Posible phishing detectado", message: reasons.slice(0,2).join(" • ") }); } catch {}
  }

  return { level, risk, reasons, etld1, isTrusted };
}

// ---- Mensajería ----
API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === "PAGE_HINTS") {
      const { url, hints } = msg.payload || {};
      const tabId = sender?.tab?.id || null;
      const res = await assessRisk(url, hints || {}, tabId);
      sendResponse({ type: "RISK_RESULT", payload: res });
    }
  })();
  return true;
});