# Mobile Chat App

A mobile-first chat application built with React, TypeScript, and Tailwind CSS. The app connects to a university REST API and is designed to work like a native mobile app — installable from the browser, with offline support.

**Live:** https://maybefelixo.github.io/Mobile-UX-Design/

---

## Features

- Real-time messaging
- Send text, images, files, and location
- Offline support with automatic sync when back online
- Group chat management
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

---

## Deploying to GitHub Pages

Deployment is automatic — every push to `main` triggers a GitHub Actions workflow that builds and deploys the app.

### How it works

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main`:

1. Checks out the code
2. Installs Node.js 20 and runs `npm ci`
3. Builds the app with `npm run build`
4. Uploads the `dist/` folder as a GitHub Pages artifact
5. Deploys it — no `gh-pages` branch needed

---

## API

The app uses a REST API hosted by Hochschule Esslingen:

```
https://www2.hs-esslingen.de/~nitzsche/api/
```
