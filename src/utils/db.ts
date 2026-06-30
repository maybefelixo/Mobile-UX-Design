// IndexedDB module — persistent offline storage for chats, messages, and outbox

const DB_NAME = "ChatAppDB";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // messages: indexed by chatid for fast per-chat lookup
      if (!db.objectStoreNames.contains("messages")) {
        const msgs = db.createObjectStore("messages", { keyPath: "id" });
        msgs.createIndex("by_chatid", "chatid");
      }

      // chats: keyed by chatid
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "chatid" });
      }

      // outbox: pending messages to sync when back online
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function saveMessagesOffline(chatid: number, messages: object[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("messages", "readwrite");
  const store = tx.objectStore("messages");
  for (const msg of messages) {
    store.put({ ...(msg as Record<string, unknown>), chatid });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessagesOffline(chatid: number): Promise<object[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readonly");
    const index = tx.objectStore("messages").index("by_chatid");
    const req = index.getAll(chatid);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Chats ─────────────────────────────────────────────────────────────────────

export async function saveChatsOffline(chats: object[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("chats", "readwrite");
  const store = tx.objectStore("chats");
  for (const chat of chats) {
    store.put(chat);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChatsOffline(): Promise<object[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readonly");
    const req = tx.objectStore("chats").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Outbox ────────────────────────────────────────────────────────────────────

export type OutboxEntry = {
  token: string;
  chatid: number;
  text?: string;
  important?: boolean;
  synced: boolean;
};

export async function addToOutbox(entry: Omit<OutboxEntry, "synced">): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const req = tx.objectStore("outbox").add({ ...entry, synced: false });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingOutbox(): Promise<(OutboxEntry & { id: number })[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readonly");
    const req = tx.objectStore("outbox").getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as (OutboxEntry & { id: number })[]).filter((m) => !m.synced),
      );
    req.onerror = () => reject(req.error);
  });
}
