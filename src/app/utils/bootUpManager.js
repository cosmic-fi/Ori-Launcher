// @ts-nocheck
import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { ensureSettingsInitialized } from '../shared/configurations.js';
import { showDialog, uiState } from '../stores/ui.js';
import { initVersionManager } from '../shared/versionManager.js';
import { baseURL } from '../services/api.js';
import { t } from '../stores/i18n.js';
import { getAccounts, updateAccount, removeAccount } from '../shared/user.js';
import { applySystemSettings } from './applySettings.js';
import { settings } from '../stores/settings.js';

let translate = (key) => key;
t.subscribe(fn => translate = fn);
let bootIndex = 0;

export const bootStatus = writable({
    step: 0,
    message: `${translate('logs.loading')}`,
    progress: 0
});

// Load settings
async function loadSettingsStep() {
    bootStatus.set({ step: 1, message: translate('logs.loadingSettings'), progress: 10 });
    await new Promise(res => setTimeout(res, 300)); // Simulate delay
    await ensureSettingsInitialized();
    await settings.init(); // Initialize the settings store
    await applySystemSettings();
}

// Check for updates
async function checkForUpdatesStep() {
    const currentSettings = get(settings);
    if (currentSettings.launcher?.updates?.checkForUpdates?.value) {
        bootStatus.set({ step: 2, message: translate('logs.checkingForUpdates'), progress: 25 });
        // await checkForUpdates();
    } else {
        bootStatus.set({ step: 2, message: translate('logs.skippingUpdateCheck'), progress: 25 });
    }
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
    
    const accounts = getAccounts();
    console.log(accounts);
    const onlineAccounts = accounts.filter(account => account.type === 'online');
    
    if (onlineAccounts.length === 0) {
        await new Promise(res => setTimeout(res, 200));
        return;
    }
    console.log(onlineAccounts);
    bootStatus.set({ step: 4, message: translate('logs.refreshingAccounts'), progress: 65 });
    
    let refreshedCount = 0;
    let failedCount = 0;
    
    for (const account of onlineAccounts) {
        try {
            await window.electron.invoke('refresh-account', account)
            .then(async (result) => {
              if(result.success){
                console.log(result);

                let _mAccount = {
                    ...account,
                    access_token: result.mc.access_token,
                    refresh_token: result.extra.msToken.refresh_token,
                    client_id: result.mc.client_id,
                    user_properties: result.mc.user_properties,
                    profile: result.extra.profile
                };
                updateAccount(account.uuid || account.name, _mAccount);
                refreshedCount++;
              }else{
                console.warn(`⚠ Failed to refresh account: ${account.name} - ${refreshResult.error || 'Unknown error'}`);
                failedCount++;
              }
            });
        } catch (error) {
            console.error(`✗ Error refreshing account: ${account.name}`, error);
            failedCount++;
        }
        
        // Update progress for each account processed
        const progress = 65 + (refreshedCount + failedCount) / onlineAccounts.length * 10;
        bootStatus.set({ 
            step: 4, 
            message: `${translate('logs.refreshingAccounts')} (${refreshedCount + failedCount}/${onlineAccounts.length})`, 
            progress 
        });
    }
    
    // Final status update
    if (failedCount > 0) {
        console.log(`Account refresh completed: ${refreshedCount} successful, ${failedCount} failed`);
    } else {
        console.log(`All ${refreshedCount} accounts refreshed successfully`);
    }
    
    bootStatus.set({ step: 4, message: translate('logs.accountsValidated'), progress: 75 });
    await new Promise(res => setTimeout(res, 300));
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

  const maxWait = 60000;
  const retryDelay = 5000;
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