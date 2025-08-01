import { writable } from 'svelte/store';

// --- Stores ---
export const versions = writable([]); // All grouped versions
export const selectedMajor = writable('');
export const selectedVariant = writable('');
export const selectedType = writable('');

// --- Helpers for localStorage persistence ---
function persistStore(store, key) {
    // Load from localStorage if present
    const stored = localStorage.getItem(key);
    if (stored) store.set(stored);
    // Save to localStorage on change
    store.subscribe(value => {
        if (value) localStorage.setItem(key, value);
    });
}

// --- Bootup: Fetch versions and set defaults if needed ---
export async function initVersionManager() {
    const res = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest.json');
    const data = await res.json();

    // Only keep releases
    const releases = data.versions.filter(v => v.type === "release");

    // Group by major version (e.g., "1.21", "1.20", etc.)
    const grouped = {};
    releases.forEach(v => {
        const match = v.id.match(/^(\d+\.\d+)/);
        const major = match ? match[1] : v.id;
        if (!grouped[major]) grouped[major] = [];
        grouped[major].push({
            id: v.id,
            type: v.type
        });
    });

    // Build the versions array for the selector
    const groupedVersions = Object.entries(grouped).map(([name, variants]) => ({
        name,
        variants
    }));

    versions.set(groupedVersions);

    // --- Set defaults if not present ---
    persistStore(selectedMajor, 'selectedMajor');
    persistStore(selectedVariant, 'selectedVariant');
    persistStore(selectedType, 'selectedType');

    let major, variant, type;
    selectedMajor.subscribe(v => major = v)();
    selectedVariant.subscribe(v => variant = v)();
    selectedType.subscribe(v => type = v)();

    if (!major || !variant || !type) {
        const latest = groupedVersions[0];
        const latestVariant = latest.variants.find(v => v.id === latest.name) || latest.variants[0];
        selectedMajor.set(latest.name);
        selectedVariant.set(latestVariant.id);
        selectedType.set(latestVariant.type);
    }
}

// --- Update selected version/variant/type from anywhere ---
export function setSelectedVersion(major, variantId, type) {
    selectedMajor.set(major);
    selectedVariant.set(variantId);
    selectedType.set(type);
}