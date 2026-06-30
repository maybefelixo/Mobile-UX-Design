// ── Service Worker ───────────────────────────────────────────────────────────
// Cache strategy: Cache with Network Fallback for static assets
// Background Sync: queued messages from IndexedDB outbox

const CACHE_NAME = "chat-app-v1";

// Derive the scope so this works both in dev (/) and on GH Pages (/Mobile-UX-Design/)
const SCOPE = self.registration.scope; // always ends with "/"
const APP_SHELL = [SCOPE, SCOPE + "index.html"];

// ── 1. INSTALL: precache the app shell ───────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ── 2. ACTIVATE: delete outdated cache versions ───────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ── 3. FETCH: Cache with Network Fallback ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  // Never intercept cross-origin API calls — let them go straight to the server
  if (!event.request.url.startsWith(self.location.origin)) return;
  // Never intercept POST requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Only cache valid same-origin responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback: serve index.html for navigation so the SPA loads
          if (event.request.mode === "navigate") {
            return caches.match(SCOPE + "index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

// ── 4. BACKGROUND SYNC: flush the outbox when back online ────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(flushOutbox());
  }
});

const API = "https://www2.hs-esslingen.de/~nitzsche/api/";
const DB_NAME = "ChatAppDB";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    // Schema is created by the main app on first open; SW only reads/deletes outbox
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

async function flushOutbox() {
  const db = await openDB();

  const pending = await new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readonly");
    const req = tx.objectStore("outbox").getAll();
    req.onsuccess = () => resolve(req.result.filter((m) => !m.synced));
    req.onerror = () => reject(req.error);
  });

  for (const msg of pending) {
    try {
      const body = { request: "postmessage", token: msg.token, chatid: msg.chatid };
      if (msg.text) body.text = msg.text;
      if (msg.important) body.important = msg.important;

      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === "ok") {
        await new Promise((resolve, reject) => {
          const tx = db.transaction("outbox", "readwrite");
          const req = tx.objectStore("outbox").delete(msg.id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    } catch {
      // Network still unavailable — the browser will retry the sync event
    }
  }
}
