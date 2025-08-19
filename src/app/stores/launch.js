// @ts-nocheck
import { writable, derived, get } from 'svelte/store'; // Add 'get' import
import { logger } from '../utils/logger';
import { showToast } from './ui';
import { t } from './i18n';

// Core launch state
export const isLaunching = writable(false);
export const launchStatus = writable('ready');
export const launchError = writable(null);
export const launchTimeout = writable(null); // Add missing launchTimeout

// Derived stores
export const canLaunch = derived(
    [isLaunching, launchStatus],
    ([$isLaunching, $launchStatus]) => {
        return !$isLaunching && ($launchStatus === 'ready' || $launchStatus === 'error');
    }
);

export const launchButtonText = derived(
    [launchStatus, t],
    ([$launchStatus, $t]) => {
        switch ($launchStatus) {
            case 'preparing':
                return `${$t('mainContent.launch.launchStatus.preparing')}...`;
            case 'downloading':
                return `${$t('mainContent.launch.launchStatus.downloading')} ${$t('mainContent.launch.launchStatus.assets')}...`;
            case 'extracting':
                return `${$t('mainContent.launch.launchStatus.extracting')}...`;
            case 'verifying':
                return `${$t('mainContent.launch.launchStatus.verifying')}...`;
            case 'running':
                return `${$t('mainContent.launch.launchStatus.running')}`;
            case 'error':
                return `${$t('mainContent.launch.launchStatus.error')}`;
            default:
                return `${$t('mainContent.launch.launchStatus.ready')}`;
        }
    }
);

export const launchActions = {
    setLaunching: (launching) => {
        isLaunching.set(launching);
    },
    
    setStatus: (status) => {
        launchStatus.set(status);
        if (status === 'ready') {
            launchError.set(null);
        }
    },
    setError: (error) => {
        launchError.set(error);
        launchStatus.set('error');
        isLaunching.set(false);
        
        // Clear timeout on error
        const timeoutId = get(launchTimeout);
        if (timeoutId) {
            clearTimeout(timeoutId);
            launchTimeout.set(null);
        }
        
        // Auto-reset after timeout errors (allow retry)
        if (error && error.includes('timeout')) {
            launchStatus.set('ready');
            launchError.set(null);
        }
    },
    
    // Add manual reset for timeout errors
    resetTimeout: () => {
        launchStatus.set('ready');
        launchError.set(null);
        isLaunching.set(false);
    },
    
    reset: () => {
        isLaunching.set(false);
        launchStatus.set('ready');
        launchError.set(null);
    }
};