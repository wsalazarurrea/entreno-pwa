/* storage.js — reemplaza window.storage (API de artefactos de Claude) por IndexedDB,
   manteniendo la misma interfaz get/set/delete/list. */

const DB_NAME = "training-assistant";
const STORE = "kv";
let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const storage = {
  async get(key) {
    const db = await getDB();
    const value = await reqToPromise(db.transaction(STORE, "readonly").objectStore(STORE).get(key));
    return value === undefined ? undefined : { value };
  },
  async set(key, value) {
    const db = await getDB();
    await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key));
  },
  async delete(key) {
    const db = await getDB();
    await reqToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(key));
  },
  async list(prefix = "") {
    const db = await getDB();
    const keys = await reqToPromise(db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys());
    return keys.filter((k) => k.startsWith(prefix));
  },
};
