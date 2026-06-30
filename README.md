# Mobile Chat App

A mobile-first chat application built with React, TypeScript, and Tailwind CSS. The app connects to a university REST API and is designed to work like a native mobile app — installable from the browser, with offline support.

**Live:** https://maybefelixo.github.io/Mobile-UX-Design/

---

## Features

- Real-time chat with 2-second polling
- Send text messages, images (gallery or camera), files (PDF, DOCX, ZIP, …), and live location
- WhatsApp-style image lightbox (tap to fullscreen)
- Offline support — reads cached chats/messages without internet, queues outgoing messages and syncs automatically when back online
- Installable as a PWA (Add to Home Screen on iOS/Android)
- Group chat management (create, join, leave, delete)
- User profiles and settings

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Build | Vite 8 |
| Routing | React Router v7 (HashRouter) |
| Offline | Service Worker + IndexedDB + Background Sync |
| API | REST (Hochschule Esslingen) |
| Hosting | GitHub Pages via GitHub Actions |

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/maybefelixo/Mobile-UX-Design.git
cd Mobile-UX-Design
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The dev server hot-reloads on every file save.

> **Note:** The Service Worker is not active in dev mode. To test offline features, run a production build locally with `npm run build && npm run preview`.

---

## Deploying to GitHub Pages

Deployment is automatic — every push to `main` triggers a GitHub Actions workflow that builds and deploys the app.

### First-time setup (do this once)

**1. Make sure the repository is on GitHub**

The repo should be at `https://github.com/<your-username>/Mobile-UX-Design`.

**2. Update the base path if your repo name is different**

Open `vite.config.ts` and change `base` to match your repository name:

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/<your-repo-name>/",
});
```

**3. Enable GitHub Pages in the repository settings**

1. Open your repository on GitHub
2. Go to **Settings** → **Pages** (left sidebar)
3. Under **"Build and deployment"**, change **Source** to **`GitHub Actions`**
4. Click **Save**

**4. Push to `main` to trigger the first deploy**

```bash
git push origin main
```

Watch the progress at `https://github.com/<your-username>/Mobile-UX-Design/actions`.
It takes about 1 minute. When the workflow shows a green checkmark, the app is live at:

```
https://<your-username>.github.io/Mobile-UX-Design/
```

### How it works

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`:

1. Checks out the code
2. Installs Node.js 20 and runs `npm ci`
3. Builds the app with `npm run build`
4. Uploads the `dist/` folder as a GitHub Pages artifact
5. Deploys it — no `gh-pages` branch needed

---

## Installing on Your Phone

Open the live URL in a mobile browser:

- **Android (Chrome):** tap the menu (⋮) → **Add to Home Screen**
- **iOS (Safari):** tap the share icon → **Add to Home Screen**

The app installs like a native app and works offline after the first load.

---

## Project Structure

```
src/
├── components/
│   ├── BottomNav.tsx           # Bottom navigation bar
│   └── chat/
│       ├── ChatDetailView.tsx  # Message thread + input bar
│       ├── ChatListView.tsx    # Chat list with search and filter
│       ├── ChatInfoView.tsx    # Group info, leave, delete
│       ├── PhotoMessage.tsx    # Image lightbox + file card renderer
│       ├── LocationMessage.tsx
│       └── MessageStatus.tsx
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Chat.tsx                # Main page — polling, state, send handlers
│   ├── Profile.tsx
│   ├── Settings.tsx
│   └── Debug.tsx
├── services/
│   ├── apiClient.ts            # Base fetch wrappers (getApi, postApi, getBinaryApi)
│   ├── authApi.ts              # Login, register, profile
│   └── chatApi.ts              # Chats, messages, files
└── utils/
    ├── db.ts                   # IndexedDB (offline storage and outbox)
    ├── imageUtils.ts           # Canvas-based PNG conversion
    ├── dateUtils.ts
    └── avatarUtils.ts

public/
└── sw.js                       # Service Worker (cache-first + background sync)

.github/
└── workflows/
    └── deploy.yml              # GitHub Actions deployment workflow
```

---

## API

The app uses a REST API hosted by Hochschule Esslingen:

```
https://www2.hs-esslingen.de/~nitzsche/api/
```

All requests use `cache: "no-store"` to prevent stale token responses. GET requests pass parameters as query strings; POST requests send a JSON body with a `request` field identifying the action.

> The `getfile` endpoint does not return CORS headers, so file downloads and images use direct `<a href>` and `<img src>` URLs instead of `fetch()`. This bypasses the CORS restriction because browser navigation is not subject to the same-origin policy.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
