import { getAppFolder, getBackupFolder, getMinecraftFolder } from "../utils/helper";

const SETTINGS_KEY = 'ori_settings';

const appFolder = await getAppFolder();
const minecraftFolder = await getMinecraftFolder();
const backupFolder = await getBackupFolder();

export const defaultSettings = {
    general: {
        appearance: {
            theme: { value: "dark" },
            language: { value: "en" }
        },
        startup: {
            autoStart: { value: false },
            minimizeToTray: { value: false }
        }
    },
    game: {
        versions: {
            allowSnapshotVersions: { value: false }
        },
        performance: {
            ramAllocation: { 
                min: { value: 2 },
                max: { value: 3 }
             }
        },
        resolution:{
            fullscreen: { value: false },
            width: { value: 1280},
            height: { value: 720}
        },
        runtime: {
            JVMArgs: { value: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M' },
            gameArgs: { value: '' },
            environmentVariables: { value: '' },
            javaPath: { value: '' },
            runAsAdmin: { value: false },
            runDetached: { value: true }
        }
    },
    launcher: {
        updates: {
            checkForUpdates: { value: true }
        },
        integration: {
            discordRichPresence: { value: false },
        },
        notification: {
            updateNotification: { value: false },
            playSound: { value: false },
        }
    },
    storage: {
        directories: {
            launcherFolder: { value:  appFolder },
            minecraftFolder: { value: minecraftFolder }
        },
        backup: {
            backupSaves: { value: true },
            backupFolder: { value: backupFolder }
        }
    },
    developer: {
        isDeveloper: { value: false },
        debug: {
            enableDevTools: { value: false }
        },
        experimental: {
            allowBetaFeatures: { value: false }
        }
    }
};

export function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || structuredClone(defaultSettings);
    } catch {
        return structuredClone(defaultSettings);
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSetting(path) {
    const settings = loadSettings();
    return path.split('.').reduce((obj, key) => obj && obj[key], settings);
}

export function updateSetting(path, value) {
    const settings = loadSettings();
    const keys = path.split('.');
    let current = settings;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) return;
        current = current[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (current[lastKey] && current[lastKey].value !== undefined) {
        current[lastKey].value = value;
        saveSettings(settings);
    }
}

export function resetSettings() {
    saveSettings(defaultSettings);
}

export function ensureSettingsInitialized() {
    if (!localStorage.getItem(SETTINGS_KEY)) {
        saveSettings(defaultSettings);
    }
}