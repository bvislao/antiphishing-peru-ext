import { DEFAULT_TRUSTED_ETLD1 } from "./whitelist.js";

const ta = document.getElementById("list");
const strictModeEl = document.getElementById("strictMode");
const kindEls = Array.from(document.querySelectorAll(".strictKind"));
const savedLabel = document.getElementById("saved");
const savedStrict = document.getElementById("savedStrict");

// DNI comportamiento
const dniOnlyFinancialEl = document.getElementById("dniOnlyFinancial");
const savedBehavior = document.getElementById("savedBehavior");

const DEFAULT_STRICT_MODE = true;
const DEFAULT_STRICT_BLOCK_KINDS = ["card","cvv","expiry","cci"];
const DEFAULT_DNI_ONLY_FINANCIAL = true;

async function load() {
  // Lista confiable
  const { trustedETLD1 } = await chrome.storage.sync.get("trustedETLD1");
  const list = Array.isArray(trustedETLD1) && trustedETLD1.length ? trustedETLD1 : DEFAULT_TRUSTED_ETLD1;
  ta.value = list.join("\n");

  // Strict settings
  const { strictMode, strictBlockKinds, dniOnlyFinancial } = await chrome.storage.sync.get(["strictMode", "strictBlockKinds", "dniOnlyFinancial"]);
  strictModeEl.checked = typeof strictMode === "boolean" ? strictMode : DEFAULT_STRICT_MODE;
  const kinds = Array.isArray(strictBlockKinds) && strictBlockKinds.length ? strictBlockKinds : DEFAULT_STRICT_BLOCK_KINDS;
  kindEls.forEach(el => el.checked = kinds.includes(el.value));

  // DNI setting
  dniOnlyFinancialEl.checked = typeof dniOnlyFinancial === "boolean" ? dniOnlyFinancial : DEFAULT_DNI_ONLY_FINANCIAL;
}
load();

document.getElementById("save").onclick = async () => {
  const lines = ta.value.split("\n").map(s => s.trim().toLowerCase()).filter(Boolean);
  await chrome.storage.sync.set({ trustedETLD1: Array.from(new Set(lines)) });
  savedLabel.textContent = "Guardado."; setTimeout(()=>savedLabel.textContent="",1500);
};
document.getElementById("reset").onclick = async () => {
  await chrome.storage.sync.set({ trustedETLD1: DEFAULT_TRUSTED_ETLD1 });
  await load();
  savedLabel.textContent = "Restablecido."; setTimeout(()=>savedLabel.textContent="",1500);
};
document.getElementById("saveStrict").onclick = async () => {
  const kinds = kindEls.filter(el => el.checked).map(el => el.value);
  await chrome.storage.sync.set({
    strictMode: strictModeEl.checked,
    strictBlockKinds: kinds.length ? kinds : DEFAULT_STRICT_BLOCK_KINDS
  });
  savedStrict.textContent = "Guardado."; setTimeout(()=>savedStrict.textContent="",1500);
};
document.getElementById("saveBehavior").onclick = async () => {
  await chrome.storage.sync.set({ dniOnlyFinancial: dniOnlyFinancialEl.checked });
  savedBehavior.textContent = "Guardado."; setTimeout(()=>savedBehavior.textContent="",1500);
};