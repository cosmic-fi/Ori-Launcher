// @ts-nocheck
import { EventEmitter } from 'events';
import { Launch, Microsoft } from 'minecraft-java-core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Main process Minecraft launcher - handles actual game launching
 */
export class MinecraftLauncher extends EventEmitter {
    constructor() {
        super();
        this.isLaunching = false;
        this.currentLauncher = null;
    }

    /**
     * Convert account data to minecraft-java-core authenticator format
     * @param {Object} account - Account data from renderer
     * @returns {Object} - Authenticator object for minecraft-java-core
     */
    convertToAuthenticator(account) {
        if (account.type === 'offline') {
            // For offline accounts, create a basic authenticator
            return {
                name: account.username || account.name,
                uuid: account.uuid || this.generateOfflineUUID(account.username || account.name),
                access_token: 'offline',
                user_type: 'offline'
            };
        } else if (account.type === 'online') {
            // For online accounts, use the existing token data
            return {
                name: account.username || account.name,
                uuid: account.uuid,
                access_token: account.access_token,
                user_type: 'msa', // Microsoft account
                meta: {
                    type: 'msa',
                    ...(account.meta || {})
                }
            };
        }
        
        throw new Error(`Unsupported account type: ${account.type}`);
    }

    /**
     * Generate offline UUID for username
     * @param {string} username - Username
     * @returns {string} - Generated UUID
     */
    generateOfflineUUID(username) {
        // Simple UUID generation for offline mode
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest('hex');
        return [
            hash.substring(0, 8),
            hash.substring(8, 12),
            hash.substring(12, 16),
            hash.substring(16, 20),
            hash.substring(20, 32)
        ].join('-');
    }

    /**
     * Convert launcher options to minecraft-java-core format
     * @param {Object} options - Launch options from renderer
     * @returns {Object} - Options for minecraft-java-core
     */
    convertLaunchOptions(options) {
        const authenticator = this.convertToAuthenticator(options.authenticator);
        
        return {
            // Required parameters
            path: options.path || './.minecraft', // Working directory
            authenticator: authenticator,
            version: options.version || 'latest_release',
            
            // Memory settings
            memory: {
                min: options.memory?.min || '2G',
                max: options.memory?.max || '4G'
            },
            
            // Optional parameters
            timeout: 10000, // Network timeout
            instance: options.instance || null, // Multi-instance support
            detached: false, // Keep process attached
            
            // Java settings
            java: {
                path: options.javaPath || null,
                version: null, // Let minecraft-java-core auto-detect
                type: 'jre'
            },
            
            // Screen settings
            screen: {
                width: options.screen?.width || null,
                height: options.screen?.height || null,
                fullscreen: options.screen?.fullscreen || false
            },
            
            // Loader settings (for modded Minecraft)
            loader: {
                enable: false, // Set to true if you want mod support
                type: null, // 'forge', 'fabric', 'neoforge', etc.
                build: 'latest'
            },
            
            // Additional JVM and game arguments
            JVM_ARGS: options.jvmArgs || [],
            GAME_ARGS: options.gameArgs || [],
            
            // File verification
            verify: false, // Set to true for production
            ignored: []
        };
    }

    /**
     * Launch game with options
     * @param {Object} options - Launch options
     */
    async launch(options) {
        console.log('Launch options received:', options);
        
        if (this.isLaunching) {
            throw new Error('Launch already in progress');
        }

        try {
            this.isLaunching = true;
            
            // Check if Minecraft is already running
            const isRunning = await this.checkMinecraftRunning();
            if (isRunning) {
                throw new Error('Minecraft is already running');
            }

            // Convert options to minecraft-java-core format
            const launchOptions = this.convertLaunchOptions(options);
            console.log('Converted launch options:', launchOptions);
            
            // Create launcher instance
            this.currentLauncher = new Launch();
            
            // Set up event listeners for minecraft-java-core
            this.currentLauncher.on('progress', (progress) => {
                this.emit('progress', { 
                    message: `Downloading... ${progress}%`,
                    progress: progress
                });
            });
            
            this.currentLauncher.on('data', (data) => {
                // Forward game output
                this.emit('data', data);
            });
            
            this.currentLauncher.on('close', (code) => {
                this.isLaunching = false;
                this.emit('complete', { 
                    message: `Game exited with code ${code}`,
                    exitCode: code
                });
            });
            
            // Emit initial progress
            this.emit('progress', { message: 'Initializing launcher...' });
            
            // Launch the game
            await this.currentLauncher.Launch(launchOptions);
            
            console.log('Minecraft launched successfully');
        } catch (error) {
            this.isLaunching = false;
            console.error('Launch failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Cancel ongoing launch
     */
    async cancel() {
        try {
            // Try to kill any running Minecraft processes
            try {
                await execAsync('taskkill /F /IM javaw.exe');
            } catch (killError) {
                // Process might not be running, ignore error
            }
            
            this.emit('cancelled');
        } catch (error) {
            console.error('Cancel failed:', error);
            this.emit('error', error);
        }
    }

    /**
     * Check if Minecraft is running
     */
    async checkMinecraftRunning() {
        try {
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq javaw.exe" /FO CSV');
            return stdout.includes('javaw.exe');
        } catch (error) {
            console.error('Failed to check Minecraft status:', error);
            return false;
        }
    }
}