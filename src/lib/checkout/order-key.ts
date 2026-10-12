type KeyStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };

const STORAGE_KEY = 'mago-order-key';

/**
 * The idempotency key for placing an order of this cart. The same cart keeps its key across
 * retries and reloads (so a lost response never becomes a second order); a different cart
 * gets a new one. `signature` identifies the cart contents.
 */
export function orderKeyFor(signature: string, storage: KeyStorage, makeId: () => string): string {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as { signature?: unknown; key?: unknown } | null;
    if (saved && saved.signature === signature && typeof saved.key === 'string') return saved.key;
  } catch {
    // Corrupt value: fall through and replace it.
  }
  const key = makeId();
  storage.setItem(STORAGE_KEY, JSON.stringify({ signature, key }));
  return key;
}

/** Called once an order is confirmed, so the next order of the same items is a new order. */
export function forgetOrderKey(storage: KeyStorage): void {
  storage.removeItem(STORAGE_KEY);
}
