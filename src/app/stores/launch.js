import { writable, derived } from 'svelte/store';

// Core launch state
export const isLaunching = writable(false);
export const launchStatus = writable('ready'); // 'ready', 'preparing', 'downloading', 'extracting', 'verifying', 'launching', 'error'
export const launchProgress = writable(null);
export const launchError = writable(null);

// Derived stores for UI states
export const canLaunch = derived(
    [isLaunching, launchStatus],
    ([$isLaunching, $launchStatus]) => !$isLaunching && $launchStatus !== 'error'
);

export const launchButtonText = derived(
    [isLaunching, launchStatus, launchProgress],
    ([$isLaunching, $launchStatus, $launchProgress]) => {
        if (!$isLaunching) return 'ready';
        
        switch ($launchStatus) {
            case 'preparing':
                return 'Preparing Minecraft';
            case 'downloading':
                return 'Downloading Assets';
            case 'extracting':
                return 'Extracting Files';
            case 'verifying':
                return 'Verifying Files';
            case 'launching':
                return 'Starting Minecraft';
            case 'running':
                return 'Minecraft Running';
            case 'cancelling':
                return 'Canceling Launch';
            case 'closing':
                return 'Closiing Game';
            case 'error':
                return 'Launch Failed';
            default:
                return 'Prepairing Minecraft';
        }
    }
);

// Launch state management functions
export const launchActions = {
    setLaunching: (launching) => {
        isLaunching.set(launching);
        if (!launching) {
            launchProgress.set(null);
        }
    },
    
    setStatus: (status) => {
        launchStatus.set(status);
        if (status === 'ready') {
            launchError.set(null);
        }
    },
    
    setProgress: (progress) => {
        launchProgress.set(progress);
    },
    
    setError: (error) => {
        launchError.set(error);
        launchStatus.set('error');
        isLaunching.set(false);
        launchProgress.set(null);
    },
    
    reset: () => {
        isLaunching.set(false);
        launchStatus.set('ready');
        launchProgress.set(null);
        launchError.set(null);
    }
};