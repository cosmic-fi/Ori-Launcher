import { writable } from 'svelte/store';

export const isOnline = writable(navigator.onLine);

export function startConnectionDaemon(onLost, onRestored) {
    window.addEventListener('offline', () => {
        isOnline.set(false);
        if (onLost) onLost();
    });
    window.addEventListener('online', () => {
        isOnline.set(true);
        if (onRestored) onRestored();
    });
}