# Ori Launcher

Ori Launcher is a modern, cross‑platform Minecraft launcher built with Svelte, Electron, and Vite. It focuses on speed, a clean user experience, and practical features such as multi‑account support, instance management, and localization. The project is fully open source and welcomes community contributions.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Quick Start](#quick-start)
- [Build](#build)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Localization](#localization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & Usage](#license-usage)
- [Credits](#credits)

---

## 🚀 Features
- Multi‑account support (Microsoft via `msmc`, offline profiles)
- Instance Manager: create, edit, delete instances, choose Vanilla/Forge/Fabric
- Mod & resource pack support (with incremental improvements planned)
- Customizable RAM/Java settings and Minecraft directory
- Auto‑update integration for packaged builds
- Localization with multiple languages (`locale/*.json`)
- Discord Rich Presence integration
- Modern, responsive UI powered by Svelte + Vite

---

## 🧰 Tech Stack
- Electron (Main & Preload)
- Svelte (Renderer)
- Vite (dev server & production bundling)
- Electron Builder (packaging & distribution)

---

## 🖼️ Screenshots
> Add screenshots in `public/images/` and reference them here.

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- Git
- npm (or yarn)

### Install
```bash
npm install
```

### Run in Development
Starts Vite on `http://localhost:5173` and launches Electron after the dev server becomes ready.
```bash
npm run dev
```

### Build UI (Renderer)
```bash
npm run build
```

### Preview Built UI
```bash
npm run preview
```

---

## 📦 Build
For local development and personal builds only. Do not distribute or publish artifacts.

Common commands:
```bash
# Install dependencies
npm install

# Run in development (Vite + Electron)
npm run dev

# Build renderer (Svelte)
npm run build

# Preview built UI
npm run preview

# Optional: package locally (personal use only — do not distribute)
npm run dist
npm run dist:win
npm run dist:mac
npm run dist:linux
npm run dist:all

# Publish release to GitHub
npm run release
```

Environment for publishing:
- Create `.env` with `GH_TOKEN=your_github_personal_access_token`
- Do not commit `.env` to the repository

---

## 📁 Project Structure
```
ori-launcher/
├── .github/workflows/build.yml
├── BUILD_AND_RELEASE.md
├── README.md
├── index.html
├── jsconfig.json
├── locale/
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   ├── id.json
│   └── tr.json
├── public/
│   ├── icon.*
│   ├── images/
│   └── sfx/
├── src/
│   └── electron/
│       ├── main.js
│       ├── preload.js
│       ├── autoStartManager.js
│       ├── utils/
│       └── window/
├── svelte.config.js
├── vite.config.mjs
└── package.json
```

---

## 🧠 Architecture Overview
- Electron Main (`src/electron/main.js`): application lifecycle, windows, packaging integration, updater hooks
- Electron Preload (`src/electron/preload.js`): secure bridging to renderer via context‑isolated APIs
- Renderer (Svelte + Vite): UI logic, settings, instance management, localization
- Packaging (Electron Builder): distributables for Windows/macOS/Linux; release flows via scripts and GitHub Actions

TypeScript/JS language services are configured via `jsconfig.json`. The project uses ESM (`"type": "module"` in `package.json`).

---

## 🌍 Localization
Localization keys live under `locale/*.json`. Each language file mirrors `en.json`.

Guidelines:
- Keep keys and structure consistent with `en.json`
- When adding UI features, first add strings to `en.json`, then update other locales
- Use clear, concise phrasing and avoid hard‑coding HTML unless necessary for styling

Contributions:
- Submit PRs that add or fix translations
- Ensure new keys are present across all languages

---

## 🧪 Troubleshooting
- Electron Builder missing: `npm install --save-dev electron-builder`
- Auto‑updates only work in packaged builds: use `npm run dist` to test locally
- Editor warnings about deleted Svelte files: restart TS/Svelte language servers, or adjust `jsconfig.json` includes

For more, see BUILD.md (Troubleshooting section).

---

## 🤝 Contributing
1. Fork the repo and create a feature branch
2. Run `npm run dev` and develop against the dev server
3. Add/adjust localization strings in all language files when introducing UI changes
4. Write clear commit messages and open a PR

---

## 🙏 Credits
Developed and crafted with 💖 by **Cosmic** & **Olly**.

---

<a id="license-usage"></a>
## 📄 License & Usage
- Contributions are welcome: open issues and submit pull requests.
- Personal builds are permitted for local testing and evaluation.
- Redistribution, repackaging, or publishing of binaries or modified sources is NOT permitted without explicit written permission from the maintainers.
- Do not upload builds to stores, mirrors, or release pages.
- Forks should remain private unless you have permission to publish.

For exceptions or partnership inquiries, please contact the maintainers.