// =========================
// Anti-Phishing Perú — content.js (cross-browser)
// =========================
(function () {
  const X = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;
  const url = location.href;
  let strictUnlockUntil = 0;
  let lastStrictKinds = ["card","cvv","expiry","cci"]; // puedes cambiar vía Options

  // --- Léxico financiero
  const FIN_BRANDS = ["bcp","interbank","bbva","scotiabank","banbif","mibanco","pichincha","falabella","ripley","bn","yape","plin","visa","mastercard","amex"];
  const FIN_TERMS  = [
    "banca","en linea","online banking","transferencia","pago","tarjeta","credito","préstamo","prestamo",
    "hipoteca","saldo","cci","cuenta interbancaria","token","otp","clave dinamica","clave dinámica",
    "mi cuenta","ahorro","ctacte","cajero","cobro","voucher"
  ];

  const norm = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
  const isNumLike = (el) => ["tel","number","text","password","search"].includes(el.type || "") || !el.type;

  function labelTextFor(input) {
    try {
      if (input.id) {
        const byFor = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (byFor && byFor.textContent) return byFor.textContent.trim();
      }
      const parentLabel = input.closest("label");
      if (parentLabel && parentLabel.textContent) return parentLabel.textContent.trim();
      const prev = input.previousElementSibling;
      if (prev && prev.textContent && prev.textContent.length < 80) return prev.textContent.trim();
      return input.getAttribute("placeholder") || input.getAttribute("aria-label") || input.name || input.id || "";
    } catch { return input.name || input.id || ""; }
  }

  function luhnValid(num) {
    const s = (num || "").replace(/\D/g, "");
    if (s.length < 13 || s.length > 19) return false;
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = +s[i];
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return (sum % 10) === 0;
  }

  function classifySensitiveByText(txt, input) {
    const t = norm(txt);
    if (/\bdni\b/.test(t) || /documento( de)? identidad|nro(\.|) doc|num(\.|) doc/.test(t)) return "dni";
    if (/tarjeta|card( number|)|numero de tarjeta|nro tarjeta|pan\b/.test(t)) return "card";
    if (/\bcci\b|cuenta interbancaria/.test(t)) return "cci";
    if (/vencimiento|expiraci[oó]n|mm\s*\/\s*(aa|yy|aaaa|yyyy)|fecha de exp/.test(t)) return "expiry";
    if (/\bcvv\b|\bcvc\b|codigo de seguridad|cod\.?\s*seguridad/.test(t)) return "cvv";

    const max = parseInt(input.getAttribute("maxlength") || "0", 10);
    const pattern = input.getAttribute("pattern") || "";
    const nameId = norm((input.name || "") + " " + (input.id || ""));

    if ((/dni\b/.test(nameId) || (max === 8 && isNumLike(input)))) return "dni";
    if (/cci\b|cuenta\s*interbancaria/.test(nameId) || max === 20) return "cci";
    if (/mm.*yy|mm.*aaaa|mm\/yy|mm\/\d{2,4}/i.test(pattern) || /exp|venc/.test(nameId)) return "expiry";
    if (/cvv|cvc|seguridad/.test(nameId) || max === 3 || max === 4) return "cvv";
    if (/card|tarjeta|pan/.test(nameId) || (isNumLike(input) && (max >= 15 && max <= 19))) return "card";
    return null;
  }

  function scanSensitiveFields() {
    const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
    const counts = { dni:0, card:0, cci:0, expiry:0, cvv:0 };
    const details = [];

    for (const el of inputs) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      const t = (el.type || "").toLowerCase();
      if (el.disabled || el.readOnly) continue;
      if (el instanceof HTMLInputElement && ["hidden","submit","button","image","checkbox","radio","file","range","color","reset"].includes(t)) continue;

      const lbl = labelTextFor(el);
      let kind = classifySensitiveByText(lbl, el);

      const v = (el.value || "").replace(/\s/g, "");
      if (!kind) {
        if (/\d{8}/.test(v) && v.replace(/\D/g,"").length === 8) kind = "dni";
        if (/\d{20}/.test(v) && v.replace(/\D/g,"").length === 20) kind = "cci";
        if (/\d{2}\s*\/\s*\d{2,4}/.test(v)) kind = "expiry";
        if (/\d{13,19}/.test(v) && luhnValid(v)) kind = "card";
        if (/^\d{3,4}$/.test(v) && /cvv|cvc|seguridad/i.test(lbl)) kind = "cvv";
      }
      if (kind) {
        counts[kind]++;
        details.push({ type: kind, name: el.name || "", id: el.id || "", label: (lbl || "").slice(0, 80) });
      }
    }
    return { counts, details };
  }

  function collectLexicalHints() {
    const nodes = [
      ...document.querySelectorAll("h1,h2,h3,h4,label,button,a,[role='button'],.btn,input[placeholder]")
    ].slice(0, 400);
    const imgs = Array.from(document.querySelectorAll("img[alt], img[src]")).slice(0, 150);
    let text = nodes.map(n => (n.getAttribute("aria-label") || n.textContent || n.placeholder || "")).join(" ");
    text += " " + imgs.map(i => (i.alt || i.src || "")).join(" ");
    const t = norm(text);
    let financialHits = 0, brandHits = 0;
    FIN_TERMS.forEach(k => { if (t.includes(k)) financialHits++; });
    FIN_BRANDS.forEach(k => { if (t.includes(k)) brandHits++; });
    return { financialHits, brandHits };
  }

  function collectPageHints() {
    const forms = Array.from(document.forms || []).map(f => f.getAttribute("action") || "");
    const hasPasswordFields = !!document.querySelector('input[type="password"]');
    const s = scanSensitiveFields();
    const sensitive = { dni:s.counts.dni, card:s.counts.card, cci:s.counts.cci, expiry:s.counts.expiry, cvv:s.counts.cvv, _details:s.details };
    const lexical = collectLexicalHints();
    return { forms, hasPasswordFields, sensitive, lexical };
  }

  function send() {
    try {
      X.runtime.sendMessage({ type:"PAGE_HINTS", payload:{ url, hints: collectPageHints() } }, (res) => {
        // Algunos navegadores usan promesas, otros callback. Resguárdate:
        if (!res || (res.type !== "RISK_RESULT")) return;
        const { level, reasons } = res.payload || {};
        if (level === "MEDIO" || level === "ALTO") {
          showBanner(level, reasons);
          beep(level);
        }
        // (Bloqueo estricto opcional: se puede activar aquí según config,
        // mantenemos UI de pill para no romper Safari/Firefox permisos)
      });
    } catch {}
  }

  // ---- UI alerta ----
  function baseBtn() { return { border:"1px solid #bbb", borderRadius:"8px", padding:"6px 10px", cursor:"pointer", background:"#fff", fontWeight:"600" }; }
  function showBanner(level, reasons) {
    if (document.getElementById("__anti_phishing_banner")) return;
    const wrap = document.createElement("div");
    wrap.id = "__anti_phishing_banner";
    wrap.style.position = "fixed";
    wrap.style.zIndex = 2147483647;
    wrap.style.left = "16px"; wrap.style.right = "16px"; wrap.style.top = "16px";
    wrap.style.padding = "12px 16px"; wrap.style.borderRadius = "12px";
    wrap.style.boxShadow = "0 8px 24px rgba(0,0,0,.2)";
    wrap.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Arial";
    wrap.style.color = "#111";
    wrap.style.background = level === "ALTO" ? "#ffd1d1" : "#ffe8b3";
    wrap.style.border = level === "ALTO" ? "1px solid #ff6b6b" : "1px solid #ffb84d";

    const title = document.createElement("div");
    title.style.fontWeight = "700"; title.style.marginBottom = "6px";
    title.textContent = level === "ALTO" ? "⚠️ Posible PHISHING (datos sensibles)" : "⚠️ Riesgo potencial";

    const list = document.createElement("ul");
    list.style.margin = "0"; list.style.paddingInlineStart = "18px";
    (reasons || []).slice(0, 3).forEach(r => { const li = document.createElement("li"); li.textContent = r; list.appendChild(li); });

    const row = document.createElement("div");
    row.style.display = "flex"; row.style.gap = "8px"; row.style.marginTop = "10px";
    const btnMore = document.createElement("button"); btnMore.textContent = "Más info"; Object.assign(btnMore.style, baseBtn());
    const btnClose = document.createElement("button"); btnClose.textContent = "Cerrar"; Object.assign(btnClose.style, baseBtn());
    btnMore.onclick = () => window.open("https://github.com/bvislao/antiphishing-peru-ext","_blank","noopener,noreferrer");
    btnClose.onclick = () => wrap.remove();

    row.appendChild(btnMore); row.appendChild(btnClose);
    wrap.appendChild(title); wrap.appendChild(list); wrap.appendChild(row);
    document.documentElement.appendChild(wrap);
  }

  function beep(level) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = level === "ALTO" ? 980 : 700; g.gain.value = 0.035;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(()=>{ o.stop(); ctx.close(); }, level === "ALTO" ? 450 : 280);
    } catch {}
  }

  // Ejecuta envíos (inicio + al cargar + pequeño delay)
  try { send(); } catch {}
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => send());
  else send();
  setTimeout(() => { try { send(); } catch {} }, 1200);
})();