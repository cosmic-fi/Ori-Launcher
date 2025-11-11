<img width="1580" height="791" alt="Frame 108" src="https://github.com/user-attachments/assets/97648670-5dcb-45ef-a2b3-8f32692f7893" />

---

Ori Launcher is a cross-platform custom Minecraft launcher built with Svelte, Electron, and Vite. It focuses on speed, a clean user experience, and practical features such as multi-account support, version management, and localization. The project is fully open source and welcomes community contributions.
<br>

## ⥄ Table of Contents <a id="table-of-contents"></a>
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Build](#build)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Localization](#localization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License & Usage](#license-usage)
- [Credits](#credits)
<br>

## ⥄ Features <a id="features"></a>
- Multi-account support (Microsoft via `msmc`, offline profiles)
- Instance Manager: Easily select between Vanilla/Forge/Fabric
- Mod & resource pack support (with incremental improvements planned)
- Customizable RAM/Java settings and Minecraft directory
- Localization with multiple languages (`locale/*.json`)
- Modern, responsive UI powered by Svelte + Vite
- And more...
<br>

## ⥄ Tech Stack <a id="tech-stack"></a>
- Electron (Main & Preload)
- Svelte (Renderer)
- Vite (dev server & production bundling)
- Electron Builder (packaging & distribution)
<br>

## ⥄ Quick Start <a id="quick-start"></a>

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
<br>

## ⥄ Build <a id="build"></a>
For local development and personal builds only. Do not distribute or publish artifacts.

- Full local build guide: [BUILD.md](./BUILD.md)

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
```
<br>

## ⥄ Project Structure <a id="project-structure"></a>
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
<br>

## ⥄ Architecture Overview <a id="architecture-overview"></a>
- Electron Main (`src/electron/main.js`): application lifecycle, windows, packaging integration, updater hooks  
- Electron Preload (`src/electron/preload.js`): secure bridging to renderer via context-isolated APIs  
- Renderer (Svelte + Vite): UI logic, settings, instance management, localization  
- Packaging (Electron Builder): distributables for Windows/macOS/Linux; release flows via scripts and GitHub Actions  

TypeScript/JS language services are configured via `jsconfig.json`. The project uses ESM (`"type": "module"` in `package.json`).
<br>

## ⥄ Localization <a id="localization"></a>
Localization keys live under `locale/*.json`. Each language file mirrors `en.json`.

Guidelines:
- Keep keys and structure consistent with `en.json`
- When adding UI features, first add strings to `en.json`, then update other locales
- Use clear, concise phrasing and avoid hard-coding HTML unless necessary for styling

Contributions:
- Submit PRs that add or fix translations
- Ensure new keys are present across all languages
<br>

## ⥄ Troubleshooting <a id="troubleshooting"></a>
- Electron Builder missing: `npm install --save-dev electron-builder`
- GH_TOKEN not set: create `.env` with a valid token
- Auto-updates only work in packaged builds: use `npm run dist` to test
- Editor warnings about deleted Svelte files: restart TS/Svelte language servers, or adjust `jsconfig.json` includes

For more, see BUILD.md (Troubleshooting section).
<br>

## ⥄ Contributing <a id="contributing"></a>
1. Fork the repo and create a feature branch
2. Run `npm run dev` and develop against the dev server
3. Add/adjust localization strings in all language files when introducing UI changes
4. Write clear commit messages and open a PR

- Full contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
<br>

## ⥄ License & Usage <a id="license-usage"></a>
- Contributions are welcome: open issues and submit pull requests.
- Personal builds are permitted for local testing and evaluation.
- Redistribution, repackaging, or publishing of binaries or modified sources is NOT permitted without explicit written permission from the maintainers.
- Do not upload builds to stores, mirrors, or release pages.
- Forks should remain private unless you have permission to publish.

Full terms: see [LICENSE](./LICENSE).

For exceptions or partnership inquiries, please contact the maintainers.

## ⥄ Credits <a id="credits"></a>
Developed and crafted with 💖 by **Cosmic** & **Olly**.

## ⥄ Buy me a coffee!
If you like this project and would like to see it grow consider buying a coffee ☕ <br><br>
<a href="https://buymeacoffee.com/cosmic_fi" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/arial-orange.png" style="width: 120px;margin-top:30px"/>
</a>

---
<a href="https://discord.gg/2sPdCcuwm5">
<img width="1534" height="575" alt="Frame 109" src="https://github.com/user-attachments/assets/97f4e0e4-ec1e-42e3-a4d4-427526b198f5" />
</a>