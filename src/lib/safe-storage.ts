import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage when the browser allows it; otherwise (blocked site data, some
 * webviews, the server) an in-memory store, so persisted stores still work for
 * the visit instead of zustand dropping its persist API and crashing the page.
 */
export function safeStorage(): StateStorage {
  try {
    const storage = window.localStorage;
    const probe = '__mago_storage_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    };
  }
}

const sessionMemory = new Map<string, string>();

/** sessionStorage when allowed, otherwise memory that lasts for this page's lifetime. */
export function safeSessionStorage(): StateStorage & { removeItem(name: string): void } {
  try {
    const storage = window.sessionStorage;
    const probe = '__mago_storage_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return {
      getItem: (key) => sessionMemory.get(key) ?? null,
      setItem: (key, value) => void sessionMemory.set(key, value),
      removeItem: (key) => void sessionMemory.delete(key),
    };
  }
}
