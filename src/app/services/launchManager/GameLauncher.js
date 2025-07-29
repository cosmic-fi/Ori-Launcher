// @ts-nocheck
import { EventEmitter } from 'events';

/**
 * Simple GameLauncher - handles game launching with account management
 * Based on the original launcher logic with IPC communication
 */
export class GameLauncher extends EventEmitter {
    constructor() {
        super();
        this.isLaunching = false;
        this.setupIPCListeners();
    }

    /**
     * Launch game with account handling logic
     * @param {Object} options - Launch options from renderer
     */
    async launch(options) {
        if (this.isLaunching) {
            this.emit('error', new Error('Launch already in progress'));
            return;
        }

        try {
            this.isLaunching = true;
            this.emit('state-change', { type: 'preparing' });

            const account = options.authenticator;
            
            // Handle account type - cracked vs online
            if (account.type === 'cracked') {
                await this.launchGame(account, options);
            } else {
                // Online account - refresh token first
                this.emit('progress', { message: 'Refreshing account...' });
                const refreshedAccount = await this.refreshAccount(account);
                
                if (!refreshedAccount) {
                    // Retry refresh once
                    const retryAccount = await this.refreshAccount(account);
                    if (!retryAccount) {
                        throw new Error('Failed to refresh account after retry');
                    }
                    await this.launchGame(retryAccount, options);
                } else {
                    await this.launchGame(refreshedAccount, options);
                }
            }
        } catch (error) {
            this.isLaunching = false;
            this.emit('error', error);
        }
    }

    /**
     * Launch game with validated account
     * @param {Object} account - Validated account
     * @param {Object} options - Launch options
     */
    async launchGame(account, options) {
        console.log('Launching game...');
        
        // Build launch options
        const launchOptions = {
            url: options.url || '',
            authenticator: account,
            timeout: options.timeout || 10000,
            path: options.path,
            version: options.version,
            detached: options.detached || false,
            downloadFileMultiple: options.downloadFileMultiple || 10,
            intelEnabledMac: options.intelEnabledMac || false,

            loader: {
                type: options.loader?.type || '',
                build: options.loader?.build || 'latest',
                enable: options.loader?.enable || false
            },

            verify: options.verify || false,
            ignored: options.ignored || [
                'config',
                'essential', 
                'logs',
                'resourcepacks',
                'saves',
                'screenshots',
                'shaderpacks',
                'W-OVERFLOW',
                'options.txt',
                'optionsof.txt'
            ],

            javaPath: options.javaPath || null,
            JVM_ARGS: options.JVM_ARGS || [],
            GAME_ARGS: options.GAME_ARGS || [],

            screen: {
                width: options.screen?.width || 854,
                height: options.screen?.height || 480,
                fullscreen: options.screen?.fullscreen || false
            },

            memory: {
                min: options.memory?.min || '1G',
                max: options.memory?.max || '2G'
            }
        };

        // Check if Minecraft is already running
        const isMinecraftRunning = await this.checkMinecraftRunning();
        if (isMinecraftRunning) {
            throw new Error('Minecraft is already running. Please close the current instance before launching a new one.');
        }

        // Send launch request to main process
        this.emit('state-change', { type: 'launching' });
        const result = await window.electron.launchGame(launchOptions);
        
        if (!result.success) {
            throw new Error(result.error);
        }
    }

    /**
     * Refresh online account token
     * @param {Object} account - Account to refresh
     * @returns {Object|null} Refreshed account or null if failed
     */
    async refreshAccount(account) {
        try {
            const result = await window.electron.refreshAccount(account);
            return result.success ? result.account : null;
        } catch (error) {
            console.error('Account refresh failed:', error);
            return null;
        }
    }

    /**
     * Check if Minecraft is currently running
     * @returns {boolean} True if Minecraft is running
     */
    async checkMinecraftRunning() {
        try {
            const result = await window.electron.checkMinecraftRunning();
            return result.isRunning;
        } catch (error) {
            console.error('Failed to check Minecraft status:', error);
            return false;
        }
    }

    /**
     * Setup IPC listeners for main process events
     */
    setupIPCListeners() {
        // Extract event - when extracting files
        window.electron.onLaunchExtract?.((data) => {
            console.log('Extracting:', data);
            this.emit('extract', data);
            this.emit('progress', { message: 'Extracting', data });
        });

        // Progress event - downloading files
        window.electron.onLaunchProgress?.((progress, size, element) => {
            const percentage = Math.round((progress / size) * 100);
            console.log(`[Downloading ${element} ${percentage}%]`);
            
            this.emit('download-progress', {
                progress,
                size,
                element,
                percentage
            });
            this.emit('progress', { 
                message: 'Downloading',
                progress,
                size,
                element,
                percentage
            });
        });

        // Check event - verifying files
        window.electron.onLaunchCheck?.((progress, size, element) => {
            const percentage = Math.round((progress / size) * 100);
            console.log(`Checking ${element} ${percentage}%`);
            
            this.emit('verify-progress', {
                progress,
                size,
                element,
                percentage
            });
            this.emit('progress', {
                message: 'Checking',
                progress,
                size,
                element,
                percentage
            });
        });

        // Estimated time event
        window.electron.onLaunchEstimated?.((time) => {
            const hours = Math.floor(time / 3600);
            const minutes = Math.floor((time - hours * 3600) / 60);
            const seconds = Math.floor(time - hours * 3600 - minutes * 60);
            
            this.emit('estimated-time', { hours, minutes, seconds, total: time });
        });

        // Launch complete
        window.electron.onLaunchComplete?.((data) => {
            this.isLaunching = false;
            this.emit('launch-complete', data);
            this.emit('state-change', { type: 'completed' });
        });

        // Launch error
        window.electron.onLaunchError?.((error) => {
            this.isLaunching = false;
            this.emit('error', new Error(error.message || error));
            this.emit('state-change', { type: 'error' });
        });
    }

    /**
     * Cancel ongoing launch
     */
    async cancel() {
        if (!this.isLaunching) return;
        
        try {
            await window.electron.cancelLaunch?.();
            this.isLaunching = false;
            this.emit('cancelled');
            this.emit('state-change', { type: 'cancelled' });
        } catch (error) {
            this.emit('error', error);
        }
    }

    /**
     * Get current launch state
     */
    getState() {
        return {
            isLaunching: this.isLaunching
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.removeAllListeners();
        this.isLaunching = false;
    }
}