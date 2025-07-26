// @ts-nocheck
import { get } from 'svelte/store';
import { settings } from '../stores/settings';
import { currentLocale } from '../stores/i18n';

export function applySystemSettings() {
  const currentSettings = get(settings);

  // === General Appearance ===
  const theme = currentSettings?.general?.appearance?.theme?.value;
  if (theme) {
    document.body.setAttribute('data-theme', theme);
  }
 
  const language = currentSettings?.general?.appearance?.language?.value;
  if (language) {
    currentLocale.set(language);
    console.log("Language set to:", language);
  }


  // === Developer Tools ===
  const isDev = currentSettings?.developer?.isDeveloper;
  const enableDevTools = currentSettings?.developer?.debug?.enableDevTools?.value;
  if (isDev && enableDevTools && window?.electron?.openDevTools) {
    window.electron.openDevTools(); // you'd implement this in Electron preload
  }

  // === Discord Rich Presence ===
  const discordPresence = currentSettings?.launcher?.integration?.discordRichPresence?.value;
  if (discordPresence) {
    // You would hook into your Discord RPC logic here
    console.log("Discord RPC enabled.");
    // startDiscordPresence()
  }

  // === Notifications ===
  const playSound = currentSettings?.launcher?.notification?.playSound?.value;
  if (playSound) {
    console.log("Notification sounds enabled.");
    // preload audio or configure sound system
  }

  // You can also preload/update other flags for later use, like:
  // const runAsAdmin = currentSettings?.game?.runtime?.runAsAdmin?.value;
  // window.runAsAdmin = runAsAdmin;
}