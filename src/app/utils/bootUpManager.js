// @ts-nocheck
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { ensureSettingsInitialized } from '../shared/configurations.js';
import { showDialog, uiState } from '../stores/ui.js';
import { initVersionManager } from '../shared/versionManager.js';
import { baseURL } from '../services/api.js';
import { t } from '../stores/i18n.js';

const translate = get(t);
let bootIndex = 0;

// Splash status store for UI
export const bootStatus = writable({
    step: 0,
    message: 'Loading...',
    progress: 0
});

// Load settings
async function loadSettingsStep() {
    bootStatus.set({ step: 1, message: translate('logs.loadingSettings'), progress: 10 });
    await new Promise(res => setTimeout(res, 300)); // Simulate delay
    ensureSettingsInitialized();
}

// Check for updates
async function checkForUpdatesStep() {
    bootStatus.set({ step: 2, message: translate('logs.checkingForUpdates'), progress: 25 });
    // TODO: Replace with real update check
    await new Promise(res => setTimeout(res, 500));
}

async function checkForVersions() {
    bootStatus.set({ step: 3, message: translate('logs.buildingVersions'), progress: 40 });
    initVersionManager();
}
// Initialize services
async function initServicesStep() {
    bootStatus.set({ step: 3, message: translate('logs.initializingServices'), progress: 55 });
    // TODO: Start background services, analytics, etc.
    await new Promise(res => setTimeout(res, 400));
}

// Validate accounts
async function validateAccountsStep() {
    bootStatus.set({ step: 4, message: translate('logs.validatingAccounts'), progress: 60 });
    // TODO: Refresh tokens, remove invalid accounts, etc.
    await new Promise(res => setTimeout(res, 400));
}

// Fetch server list
async function fetchServerListStep() {
    bootStatus.set({ step: 5, message: translate('logs.fetchingServerList'), progress: 75 });
    // TODO: Fetch server list from API or file
    await new Promise(res => setTimeout(res, 600));
}

// Prepare launcher
async function prepareLauncherStep() {
    bootStatus.set({ step: 6, message: translate('logs.preparingLauncher'), progress: 90 });
    // TODO: Preload assets, set up UI, etc.
    await new Promise(res => setTimeout(res, 300));
}

// Check API status
async function checkApiStatusStep() {
  const wakeUpMessageArr = [
    translate('logs.apiFetch.wakingUpServer'),
    translate('logs.apiFetch.wakeup1'),
    translate('logs.apiFetch.wakeup2'),
    translate('logs.apiFetch.wakeup3'),
    translate('logs.apiFetch.wakeup4'),
    translate('logs.apiFetch.wakeup5'),
    translate('logs.apiFetch.wakeup6'),
    translate('logs.apiFetch.wakeup7')
  ];
  bootStatus.set({ step: 2, message: translate('logs.checkingAPIStatus'), progress: 20 });

  const maxWait = 60000; // 60 seconds
  const retryDelay = 5000; // 5 seconds
  const start = Date.now();

  async function tryPing() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`${baseURL}/ping`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('API not OK');
      const data = await res.json();
      if (data.status !== 'ok') throw new Error('Bad ping response');
      // Success!
      return true;
    } catch (e) {
      clearTimeout(timeout);
      return false;
    }
  }

  // First attempt
  if (await tryPing()) return;

  // If failed, start "waking up" loop
  while (Date.now() - start < maxWait) {
    // Show a new random message each retry
    bootStatus.set({
      step: 2,
      message: wakeUpMessageArr[Math.floor(Math.random() * wakeUpMessageArr.length)],
      progress: 20,
      error: false
    });
    await new Promise(res => setTimeout(res, retryDelay));
    if (await tryPing()) return;
  }

  // After maxWait, show error dialog
  bootStatus.set({
    step: 2,
    message: translate('logs.apiUnreachable'),
    progress: 20,
    error: true
  });

  showDialog({
    title: translate('dialog.titles.apiUnreachable'),
    message: translate('dialog.messages.apiUnreachable'),
    buttons: [
      {
        label: translate('dialog.continue'),
        primary: false,
        action: () => {
          bootStatus.update(b => ({ ...b, error: false }));
          runBootSequence(bootIndex + 1);
        }
      },
      {
        label: translate('dialog.retry'),
        primary: true,
        type: 'danger',
        action: async () => {
          try {
            await checkApiStatusStep();
            runBootSequence(bootIndex + 1);
          } catch {
            location.reload();
          }
        }
      }
    ]
  });

  throw new Error('API unreachable');
}

// --- Boot Sequence Runner ---
const steps = [
    loadSettingsStep,
    checkForUpdatesStep,
    checkApiStatusStep,
    checkForVersions,
    initServicesStep,
    validateAccountsStep,
    fetchServerListStep,
    prepareLauncherStep
];

export async function runBootSequence(startIndex = 0) {
    uiState.isBootReady.set(false);

    for (bootIndex = startIndex; bootIndex < steps.length; bootIndex++) {
        const stepFn = steps[bootIndex];
        try {
            await stepFn();
        } catch (err) {
            console.error('Step failed:', err);
            break;
        }
    }

    if (bootIndex >= steps.length) {
        bootStatus.set({ step: steps.length, message: translate('logs.ready'), progress: 100 });
        uiState.isBootReady.set(true);
    }
}