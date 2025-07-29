import { writable, derived } from "svelte/store";
import { getAccounts } from "../shared/user.js";

export const accountsStore = writable(getAccounts());

// Helper to refresh the store after add/remove
export function refreshAccounts() {
    accountsStore.set(getAccounts());
}

export const uiState = {
    activeTab: writable('launch'),
    toggleModel: writable('none'),
    isBootReady: writable(false),
    theme: writable('dark')
}

export const userAccountState = {
    hasAccount: writable(false),
    selectedAccountUuid: writable(null)
}
function createFavorites() {
    const stored = JSON.parse(localStorage.getItem('favoriteServers') || '[]');
    const { subscribe, set, update } = writable(stored);

    return {
        subscribe,
        toggle: (slug) => update(favs => {
            let newFavs;
            if (favs.includes(slug)) {
                newFavs = favs.filter(s => s !== slug);
            } else {
                newFavs = [...favs, slug];
            }
            localStorage.setItem('favoriteServers', JSON.stringify(newFavs));
            return newFavs;
        }),
        isFavorite: (slug, favs) => favs.includes(slug)
    };
}
export const favoriteSlugs = createFavorites();

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

export const selectedAccount = writable(
    localStorage.getItem('selectedAccount') || null
);

// Keep localStorage in sync
selectedAccount.subscribe(val => {
    if (val) {
        localStorage.setItem('selectedAccount', val);
    } else {
        localStorage.removeItem('selectedAccount');
    }
});

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

export const selectedAccountUsername = derived(
  [selectedAccount, accountsStore],
  ([$selectedAccount, $accountsStore]) => {
    const acc = $accountsStore.find(
      a => a.uuid === $selectedAccount || a.name === $selectedAccount
    );
    return acc ? acc.name : '';
  }
);
export const userBurst = derived(
  [selectedAccount, accountsStore],
  ([$selectedAccount, $accountsStore]) => {
    const acc = $accountsStore.find(
      a => a.uuid === $selectedAccount || a.name === $selectedAccount
    );
    return acc ? acc.burst : '';
  }
);