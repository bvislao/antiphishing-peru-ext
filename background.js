import { DEFAULT_TRUSTED_ETLD1 } from "./whitelist.js";

// --- Config por defecto del modo estricto ---
const DEFAULT_STRICT_MODE = true;
const DEFAULT_STRICT_BLOCK_KINDS = ["card", "cvv", "expiry", "cci","dni"];

// --- Utilidades dominio ---
const PUBLIC_SUFFIXES_PE = new Set(["pe","com.pe","org.pe","gob.pe","edu.pe","mil.pe","net.pe"]);

function getETLD1(host) {
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  if (PUBLIC_SUFFIXES_PE.has(last2)) return parts.slice(-3).join(".");
  if (PUBLIC_SUFFIXES_PE.has(parts.at(-1))) return parts.slice(-2).join(".");
  return parts.slice(-2).join(".");
}
function isIPAddress(host){ return /^(\d{1,3}\.){3}\d{1,3}$/.test(host); }
function levenshtein(a,b){
  const m = Array.from({length:a.length+1},(_,i)=>[i]);
  for (let j=1;j<=b.length;j++) m[0][j]=j;
  for (let i=1;i<=a.length;i++){
    for (let j=1;j<=b.length;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+cost);
    }
  }
  return m[a.length][b.length];
}

// --- Storage helpers ---
async function getTrustedDomains() {
  const { trustedETLD1 } = await chrome.storage.sync.get("trustedETLD1");
  if (Array.isArray(trustedETLD1) && trustedETLD1.length) return trustedETLD1;
  await chrome.storage.sync.set({ trustedETLD1: DEFAULT_TRUSTED_ETLD1 });
  return DEFAULT_TRUSTED_ETLD1;
}
async function getStrictSettings() {
  const { strictMode, strictBlockKinds } = await chrome.storage.sync.get(["strictMode", "strictBlockKinds"]);
  return {
    strictMode: typeof strictMode === "boolean" ? strictMode : DEFAULT_STRICT_MODE,
    strictBlockKinds: Array.isArray(strictBlockKinds) && strictBlockKinds.length ? strictBlockKinds : DEFAULT_STRICT_BLOCK_KINDS
  };
}

// --- Evaluación de riesgo ---
async function assessRisk(url, pageHints = {}) {
  const u = new URL(url);
  const host = u.hostname.toLowerCase();
  const scheme = u.protocol.replace(":", "");
  const etld1 = getETLD1(host);
  const trusted = await getTrustedDomains();
  const { strictMode, strictBlockKinds } = await getStrictSettings();

  let risk = 0;
  const reasons = [];

  if (isIPAddress(host)) { risk += 2; reasons.push("La URL usa una IP en lugar de dominio."); }
  if (scheme !== "https") { risk += 2; reasons.push("Conexión sin HTTPS."); }
  if (host.includes("xn--")) { risk += 2; reasons.push("Dominio con punycode (posible homógrafo)."); }
  const hyphens = (host.match(/-/g) || []).length;
  if (hyphens >= 3) { risk += 1; reasons.push("Dominio con muchos guiones."); }

  let minDist = Infinity, closest = null;
  for (const t of trusted) {
    const d = levenshtein(etld1, t);
    if (d < minDist) { minDist = d; closest = t; }
  }
  if (!trusted.includes(etld1) && minDist <= 2) {
    risk += 2; reasons.push(`Dominio muy parecido a “${closest}” (${etld1}).`);
  }

  const keywords = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn"];
  const inHostOrPath = keywords.some(k => host.includes(k) || u.pathname.toLowerCase().includes(k));
  if (!trusted.includes(etld1) && inHostOrPath) {
    risk += 2; reasons.push("Marca de entidad financiera en dominio no oficial.");
  }

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
  if (!trusted.includes(etld1) && totalSensitive > 0) {
    const highWeight = (s.card||0)+(s.cvv||0) > 0 ? 4 : 3;
    risk += highWeight;
    const kinds = [];
    if (s.dni)   kinds.push(`DNI (${s.dni})`);
    if (s.card)  kinds.push(`Tarjeta (${s.card})`);
    if (s.cvv)   kinds.push(`CVV (${s.cvv})`);
    if (s.expiry)kinds.push(`Fecha de vencimiento (${s.expiry})`);
    if (s.cci)   kinds.push(`CCI (${s.cci})`);
    reasons.push(`Página solicita datos sensibles en dominio no oficial: ${kinds.join(", ")}.`);
  }

  if (pageHints.hasPasswordFields && !trusted.includes(etld1)) {
    risk += 1; reasons.push("Página solicita credenciales en dominio no confiable.");
  }

  let level = "BAJO";
  if (risk >= 5) level = "ALTO";
  else if (risk >= 2) level = "MEDIO";

  // Decidir bloqueo estricto
  let enforceStrict = false;
  if (strictMode && !trusted.includes(etld1)) {
    // si hay alguno de los tipos configurados presentes, aplicamos bloqueo
    const present = strictBlockKinds.some(k => (s[k] || 0) > 0);
    enforceStrict = present;
  }

  return {
    level, risk, reasons, etld1,
    trustedMatch: trusted.includes(etld1),
    closestTrusted: closest,
    strict: { enforce: enforceStrict, blockKinds: strictBlockKinds }
  };
}

// --- Mensajería ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "PAGE_HINTS") {
      const { url, hints } = msg.payload;
      const res = await assessRisk(url, hints);

      const tabId = sender.tab?.id;
      if (tabId) {
        const badge = res.level === "ALTO" ? "!!" : res.level === "MEDIO" ? "!" : "";
        const color = res.level === "ALTO" ? [255,0,0,255] : res.level === "MEDIO" ? [255,165,0,255] : [0,0,0,0];
        chrome.action.setBadgeText({ tabId, text: badge });
        chrome.action.setBadgeBackgroundColor({ tabId, color });
      }
      if (res.level === "ALTO" && sender.tab?.id) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon128.png",
          title: "⚠️ Posible phishing detectado",
          message: res.reasons.slice(0, 2).join(" • ")
        });
      }
      sendResponse({ type: "RISK_RESULT", payload: res });
    }

    if (msg.type === "SAFE_BROWSING_CHECK") {
      const { url, apiKey } = msg.payload;
      try {
        const resp = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: { clientId: "anti-phishing-pe", clientVersion: "1.0.0" },
            threatInfo: {
              threatTypes: ["MALWARE","SOCIAL_ENGINEERING","POTENTIALLY_HARMFUL_APPLICATION","UNWANTED_SOFTWARE"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: [{ url }]
            }
          })
        });
        const data = await resp.json();
        sendResponse({ type: "SAFE_BROWSING_RESULT", payload: data?.matches?.length ? "UNSAFE" : "SAFE" });
      } catch (e) {
        sendResponse({ type: "SAFE_BROWSING_RESULT", payload: "UNKNOWN", error: String(e) });
      }
    }
  })();
  return true;
});