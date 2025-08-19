import DiscordRPC from 'discord-rpc';
import { app } from 'electron';
import dotenv from 'dotenv';

dotenv.config();

class DiscordRPCService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.clientId = process.env.DISCORD_CLIENT_ID;
        this.startTime = null;
        this.currentActivity = null;
    }

    async initialize() {
        if (this.client) {
            return;
        }

        try {
            this.client = new DiscordRPC.Client({ transport: 'ipc' });
            
            this.client.on('ready', () => {
                console.log('Discord RPC connected');
                this.isConnected = true;
                this.startTime = Date.now();
                this.setIdleActivity();
            });

            this.client.on('disconnected', () => {
                console.log('Discord RPC disconnected');
                this.isConnected = false;
            });

            await this.client.login({ clientId: this.clientId });
        } catch (error) {
            console.error('Failed to initialize Discord RPC:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    async disconnect() {
        if (this.client && this.isConnected) {
            try {
                await this.client.destroy();
                console.log('Discord RPC disconnected');
            } catch (error) {
                console.error('Error disconnecting Discord RPC:', error);
            }
        }
        this.client = null;
        this.isConnected = false;
        this.startTime = null;
        this.currentActivity = null;
    }

    setIdleActivity() {
        if (!this.isConnected) return;

        const activity = {
            details: 'In Launcher',
            state: 'Browsing',
            startTimestamp: this.startTime,
            largeImageKey: 'ori_launcher_logo',
            largeImageText: `Ori Launcher v${app.getVersion()}`,
            smallImageKey: 'orilauncher_idle',
            smallImageText: 'Idle',
            instance: false,
            buttons: [
                {
                    label: 'Download Ori Launcher',
                    url: 'https://github.com/cosmic-fi/ori-launcher'
                }
            ]
        };

        this.setActivity(activity);
    }

    setLaunchingActivity(version, variant) {
        if (!this.isConnected) return;

        const activity = {
            details: `Launching Minecraft ${version}`,
            state: `${variant} Version`,
            startTimestamp: Date.now(),
            largeImageKey: 'ori_launcher_logo',
            largeImageText: `Ori Launcher v${app.getVersion()}`,
            smallImageKey: 'orilauncher_minecraft',
            smallImageText: 'Minecraft',
            instance: false,
            buttons: [
                {
                    label: 'Download Ori Launcher',
                    url: 'https://github.com/cosmic-fi/ori-launcher'
                }
            ]
        };

        this.setActivity(activity);
    }

    setPlayingActivity(version, variant, username) {
        if (!this.isConnected) return;

        const activity = {
            details: `Playing Minecraft ${version}`,
            state: `as ${username} (${variant})`,
            startTimestamp: Date.now(),
            largeImageKey: 'orilauncher_minecraft',
            largeImageText: `Minecraft ${version}`,
            smallImageKey: 'orilauncher_logo',
            smallImageText: `Ori Launcher v${app.getVersion()}`,
            instance: false,
            buttons: [
                {
                    label: 'Download Ori Launcher',
                    url: 'https://github.com/cosmic-fi/ori-launcher'
                }
            ]
        };

        this.setActivity(activity);
    }

    setDownloadingActivity(progress, version) {
        if (!this.isConnected) return;

        const activity = {
            details: `Downloading Minecraft ${version}`,
            state: `${Math.round(progress)}% complete`,
            startTimestamp: this.startTime,
            largeImageKey: 'orilauncher_logo',
            largeImageText: `Ori Launcher v${app.getVersion()}`,
            smallImageKey: 'orilauncher_download',
            smallImageText: 'Downloading',
            instance: false,
        };

        this.setActivity(activity);
    }

    async setActivity(activity) {
        if (!this.isConnected || !this.client) return;

        try {
            await this.client.setActivity(activity);
            this.currentActivity = activity;
        } catch (error) {
            console.error('Failed to set Discord activity:', error);
        }
    }

    async clearActivity() {
        if (!this.isConnected || !this.client) return;

        try {
            await this.client.clearActivity();
            this.currentActivity = null;
        } catch (error) {
            console.error('Failed to clear Discord activity:', error);
        }
    }

    getStatus() {
        return {
            isConnected: this.isConnected,
            currentActivity: this.currentActivity
        };
    }
}

// Export singleton instance
export const discordRPC = new DiscordRPCService();