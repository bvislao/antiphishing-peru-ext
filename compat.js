// Simple selector cross-browser
export const api = (typeof globalThis.browser !== "undefined") ? globalThis.browser : globalThis.chrome;

// Promisify helpers cuando solo existe callback (Chrome antiguo)
const maybePromisify = (fn) => (...args) => {
  try {
    // Si devuelve promesa, úsala
    const r = fn(...args);
    if (r && typeof r.then === "function") return r;
  } catch {}
  return new Promise((resolve) => fn(...args, resolve));
};

// Storage (get/set)
export const storageGet = (keys) =>
  (api.storage?.sync?.get.length > 1) ? new Promise(r => api.storage.sync.get(keys, r))
                                      : api.storage.sync.get(keys);
export const storageSet = (items) =>
  (api.storage?.sync?.set.length > 1) ? new Promise(r => api.storage.sync.set(items, r))
                                      : api.storage.sync.set(items);

// Tabs
export const tabsQuery = (queryInfo) =>
  (api.tabs?.query.length > 1) ? new Promise(r => api.tabs.query(queryInfo, r))
                               : api.tabs.query(queryInfo);
export const tabsSendMessage = (tabId, msg) =>
  (api.tabs?.sendMessage.length > 2) ? new Promise(r => api.tabs.sendMessage(tabId, msg, r))
                                     : api.tabs.sendMessage(tabId, msg);

// Notifications (Safari puede no tenerlo)
export const canNotify = !!api.notifications;
export const notify = async (opts) => {
  if (!api.notifications) return false;
  if (api.notifications.create.length <= 1) { // browser.*
    await api.notifications.create({ ...opts, type: "basic", iconUrl: "icon128.png" });
    return true;
  }
  return new Promise(r =>
    api.notifications.create("", { ...opts, type: "basic", iconUrl: "icon128.png" }, () => r(true))
  );
};