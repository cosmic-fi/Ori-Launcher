// @ts-nocheck
const ACCOUNTS_KEY = 'user_accounts';

import { userAccountState, refreshAccounts, selectedAccount } from '../stores/ui.js';
import { fetchFaceAndSkin } from '../services/api.js';


function loadAccounts() {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
}

function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getAccounts() {
    return loadAccounts();
}

export async function addAccount(account) {
    const accounts = loadAccounts();
    // Prevent duplicate: for online by uuid, for offline by username
    if (
        (account.type === 'offline' && accounts.some(a => a.type === 'offline' && a.name === account.name)) ||
        (account.type === 'online' && accounts.some(a => a.type === 'online' && a.uuid === account.uuid))
    ) {
        return false;
    }

    // Fetch face, skin, and burst
    const { face, skin, burst } = await fetchFaceAndSkin(account.name);
    account.face = face;
    account.skin = skin;
    account.burst = burst;
    
    // Initialize account_activities with playtime structure
    account.account_activities = {
        playtime: {
            totalSeconds: 0,
            lastUpdated: new Date().toISOString(),
            lastSessionDuration: 0,
            sessionCount: 0
        }
    };

    accounts.push(account);
    saveAccounts(accounts);
    refreshHasAccount();
    refreshAccounts();
    return true;
}

export function updateAccount(identifier, updates) {
    const accounts = loadAccounts();
    const idx = accounts.findIndex(a =>
        (a.type === 'offline' && a.name === identifier) ||
        (a.type === 'online' && a.uuid === identifier)
    );
    if (idx === -1) return false;
    accounts[idx] = { ...accounts[idx], ...updates };
    saveAccounts(accounts);
    return true;
}

export function removeAccount(identifier) {
    let accounts = loadAccounts();
    // Check if the account to be removed is the selected account
    const selectedId = localStorage.getItem('selectedAccount');
    const isSelected = accounts.some(
        a =>
            ((a.type === 'offline' && a.name === identifier) ||
             (a.type === 'online' && a.uuid === identifier)) &&
            (a.uuid === selectedId || a.name === selectedId)
    );

    accounts = accounts.filter(a =>
        !((a.type === 'offline' && a.name === identifier) ||
          (a.type === 'online' && a.uuid === identifier))
    );
    saveAccounts(accounts);
    refreshHasAccount();
    refreshAccounts();

    if (isSelected) {
        localStorage.removeItem('selectedAccount');
        selectedAccount.set(null);
        userAccountState.selectedAccountUuid.set(null);
    }
}

export function refreshHasAccount() {
    const accounts = getAccounts();
    userAccountState.hasAccount.set(accounts.length > 0);
}

export function setSelectedAccount(identifier) {
    selectedAccount.set(identifier);
    userAccountState.selectedAccountUuid.set(identifier);
    
    // Remove this obsolete call:
    // if (typeof window !== 'undefined' && window.playtimeActions) {
    //     window.playtimeActions.loadPlaytime();
    // }
}

export function getSelectedAccount() {
    const id = localStorage.getItem('selectedAccount');
    if (!id) return null;

    const accounts = getAccounts();
    return accounts.find(a => a.uuid === id || a.name === id) || null;
}