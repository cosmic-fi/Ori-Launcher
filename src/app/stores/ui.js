import { writable } from "svelte/store";
import { getAccounts } from "../shared/user.js";

export const accountsStore = writable(getAccounts());

export const uiState = {
    activeTab: writable('launch'),
    toggleModel: writable('none'),
    isBootReady: writable(false),
    theme: writable('dark')
}
export const toasts = writable([]);

/**
 * Show a toast.
 * @param {string} message
 * @param {'normal'|'error'|'info'} type
 * @param {number} duration
 */
export function showToast(message, type = 'normal', duration = 2500) {
    const id = Date.now() + Math.random();
    toasts.update(all => [...all, { id, message, type, duration }]);
    setTimeout(() => {
        toasts.update(all => all.filter(t => t.id !== id));
    }, duration);
}

export const dialogStore = writable({
  open: false,
  title: "",
  message: "",
  buttons: []
});

export function showDialog({ title, message, buttons }) {
  dialogStore.set({ open: true, title, message, buttons });
}

export function closeDialog() {
  dialogStore.update(d => ({ ...d, open: false }));
}