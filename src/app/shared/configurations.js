import { getAppFolder, getBackupFolder, getMinecraftFolder } from "../utils/helper";

const SETTINGS_KEY = 'ori_settings';

// Initialize folders asynchronously
let appFolder, minecraftFolder, backupFolder;

async function initializeFolders() {
    if (!appFolder) {
        appFolder = await getAppFolder();
        minecraftFolder = await getMinecraftFolder();
        backupFolder = await getBackupFolder();
    }
    return { appFolder, minecraftFolder, backupFolder };
}

async function getDefaultSettings() {
    await initializeFolders();
    return {
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
                runDetached: { value: true },
                intelEnabledMac: { value: false },
                verifyGameFiles: { value: false },
                ignored: {
                    value: [
                        'config',
                        'essential',
                        'logs',
                        'resourcepacks',
                        'saves',
                        'screenshots',
                        'shaderpacks',
                        'W-OVERFLOW',
                        'options.txt',
                        'optionsof.txt'
                    ]
                }
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
                updateNotification: { value: true },
                playSound: { value: true },
                systemNotifications: { value: true },
                categories: {
                    updates: { value: true },
                    launches: { value: true },
                    downloads: { value: true },
                    errors: { value: true },
                    general: { value: true }
                },
                priority: {
                    showLowPriority: { value: true },
                    showNormalPriority: { value: true },
                    showHighPriority: { value: true },
                    showUrgentPriority: { value: true }
                },
                sound: {
                    volume: { value: 0.7 },
                    onlyForImportant: { value: false }
                }
            },
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
}

// For backward compatibility, export a promise that resolves to default settings
export const defaultSettings = getDefaultSettings();

// Also export the function for direct use
export { getDefaultSettings };

export async function loadSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const defaults = await getDefaultSettings();
        return structuredClone(defaults);
    } catch {
        const defaults = await getDefaultSettings();
        return structuredClone(defaults);
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getSetting(path) {
    const settings = await loadSettings();
    return path.split('.').reduce((obj, key) => obj && obj[key], settings);
}

export async function updateSetting(path, value) {
    const settings = await loadSettings();
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

export async function resetSettings() {
    const defaults = await getDefaultSettings();
    saveSettings(defaults);
}

export async function ensureSettingsInitialized() {
    if (!localStorage.getItem(SETTINGS_KEY)) {
        const defaults = await getDefaultSettings();
        saveSettings(defaults);
    }
}