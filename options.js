// =========================
// Anti-Phishing Perú — options.js (cross-browser)
// =========================
const API = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

const storageGet = (keys) =>
  new Promise((resolve) => {
    try {
      const fn = API.storage?.sync?.get;
      if (!fn) return resolve({});
      if (fn.length > 1) fn.call(API.storage.sync, keys, resolve);
      else { Promise.resolve(fn.call(API.storage.sync, keys)).then(resolve); }
    } catch { resolve({}); }
  });

const storageSet = (items) =>
  new Promise((resolve) => {
    try {
      const fn = API.storage?.sync?.set;
      if (!fn) return resolve();
      if (fn.length > 1) fn.call(API.storage.sync, items, resolve);
      else { Promise.resolve(fn.call(API.storage.sync, items)).then(resolve); }
    } catch { resolve(); }
  });

// Fallback de semilla si no está definida en otro archivo
const DEFAULT_TRUSTED_ETLD1_SEED = (globalThis.DEFAULT_TRUSTED_ETLD1 || [
  "viabcp.com","interbank.pe","bbva.pe","scotiabank.com.pe","bn.com.pe","banbif.pe",
  "mibanco.com.pe","pichincha.pe","bancofalabella.pe","bancoripley.com.pe",
  "cajaarequipa.pe","cajahuancayo.com.pe","cajapiura.pe","cajasullana.pe","cajatrujillo.pe"
]);

const ta = document.getElementById("list");
const strictModeEl = document.getElementById("strictMode");
const kindEls = Array.from(document.querySelectorAll(".strictKind"));
const savedLabel = document.getElementById("saved");
const savedStrict = document.getElementById("savedStrict");
const dniOnlyFinancialEl = document.getElementById("dniOnlyFinancial");
const savedBehavior = document.getElementById("savedBehavior");

const DEFAULT_STRICT_MODE = true;
const DEFAULT_STRICT_BLOCK_KINDS = ["card","cvv","expiry","cci"];
const DEFAULT_DNI_ONLY_FINANCIAL = true;

async function load() {
  const { trustedETLD1 } = await storageGet("trustedETLD1");
  const list = Array.isArray(trustedETLD1) && trustedETLD1.length ? trustedETLD1 : DEFAULT_TRUSTED_ETLD1_SEED;
  ta.value = list.join("\n");

  const { strictMode, strictBlockKinds, dniOnlyFinancial } = await storageGet(["strictMode", "strictBlockKinds", "dniOnlyFinancial"]);
  strictModeEl.checked = typeof strictMode === "boolean" ? strictMode : DEFAULT_STRICT_MODE;

  const kinds = Array.isArray(strictBlockKinds) && strictBlockKinds.length ? strictBlockKinds : DEFAULT_STRICT_BLOCK_KINDS;
  kindEls.forEach(el => el.checked = kinds.includes(el.value));

  dniOnlyFinancialEl.checked = typeof dniOnlyFinancial === "boolean" ? dniOnlyFinancial : DEFAULT_DNI_ONLY_FINANCIAL;
}
load();

document.getElementById("save").onclick = async () => {
  const lines = ta.value.split("\n").map(s => s.trim().toLowerCase()).filter(Boolean);
  await storageSet({ trustedETLD1: Array.from(new Set(lines)) });
  savedLabel.textContent = "Guardado."; setTimeout(()=>savedLabel.textContent="",1500);
};
document.getElementById("reset").onclick = async () => {
  await storageSet({ trustedETLD1: DEFAULT_TRUSTED_ETLD1_SEED });
  await load();
  savedLabel.textContent = "Restablecido."; setTimeout(()=>savedLabel.textContent="",1500);
};
document.getElementById("saveStrict").onclick = async () => {
  const kinds = kindEls.filter(el => el.checked).map(el => el.value);
  await storageSet({
    strictMode: strictModeEl.checked,
    strictBlockKinds: kinds.length ? kinds : DEFAULT_STRICT_BLOCK_KINDS
  });
  savedStrict.textContent = "Guardado."; setTimeout(()=>savedStrict.textContent="",1500);
};
document.getElementById("saveBehavior").onclick = async () => {
  await storageSet({ dniOnlyFinancial: dniOnlyFinancialEl.checked });
  savedBehavior.textContent = "Guardado."; setTimeout(()=>savedBehavior.textContent="",1500);
};