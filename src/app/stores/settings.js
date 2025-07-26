import { writable } from 'svelte/store';
import {
    loadSettings,
    saveSettings,
    updateSetting,
    getSetting,
    resetSettings,
    ensureSettingsInitialized,
    defaultSettings
} from '../shared/configurations.js';
import { applySystemSettings } from '../utils/applySettings.js';

// Ensure settings exist on boot
ensureSettingsInitialized();

function createSettingsStore() {
    const { subscribe, set, update } = writable(loadSettings());

    // Keep localStorage in sync on every change
    subscribe(value => {
        saveSettings(value);
    });

    return {
        subscribe,
        set: (val) => {
            set(val);
            saveSettings(val);
        },
        update: (fn) => {
            update(current => {
                const updated = fn(structuredClone(current));
                saveSettings(updated);
                return updated;
            });
        },
        // Update a single nested setting by path (e.g. "general.appearance.theme")
        updatePath: (path, value) => {
            updateSetting(path, value);
            set(loadSettings());
        },
        // Get a single nested setting by path
        getPath: (path) => getSetting(path),
        reset: () => {
            resetSettings();
            set(structuredClone(defaultSettings));
            applySystemSettings();
        }
    };
}

export const settings = createSettingsStore();