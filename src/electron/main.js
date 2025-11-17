// @ts-nocheck
/**
 * @author Cosmic-f
 * @description Main entry point for the Ori Launcher application.
*/

import{ app, ipcMain, dialog, Notification, shell } from "electron";
import msmc, { Auth } from 'msmc';
import fs from 'fs/promises';
import path from 'path';
import os from 'os'
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { setAppWindow, getAppWindow, closeAppWindow } from './window/appWindow.js';
import { Launch } from "ori-mcc";
import { execSync } from "child_process";
import { discordRPC } from './utils/discordRPC.js';

const rootDirectory = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.APPDATA}/Library/Application Support`: process.env.HOME);
const LOG_DIR = `${rootDirectory}/.OriLauncher/logs`

/**
 * Sets up IPC handlers for communication between the main and renderer processes.
*/
const setupIpcHandlers = () => {
    // GAME LAUNCH HANDLERS
    ipcMain.handle('launch-game', async (event, options) => {
        // Create a new launcher instance for each launch
        const launcher = new Launch();
        let isCancelled = false;
        
        console.log(options);
        // Set up cancel listener WITHIN this handler
        const cancelHandler = ipcMain.handle('cancel-launch', async (cancelEvent, _) => {
            try {
                console.log('=============Requesting to cancel==============');
                console.log('Cancelling launcher instance from within launch handler...');
                
                if (launcher) {
                    try {
                        await launcher.cancel();
                        isCancelled = true;
                        console.log('Launcher cancelled successfully', launcher);
                    } catch (cancelError) {
                        console.error('Error cancelling launcher:', cancelError);
                    }
                }
                return { success: true };
            } catch (error) {
                console.error('Cancel failed:', error);
                return { success: false, error: error.message };
            }
        });
    
        try {
            console.log(options);
            console.log("======= Starting game launch =======");
            
            launcher.on('progress', (progress, size, element) => {
                if (!isCancelled) {
                    event.sender.send('launch-progress', { progress, size, element });
                }
            });
            
            launcher.on('extract', (data) => {
                if (!isCancelled) {
                    event.sender.send('launch-extract', data);
                }
            });
            
            launcher.on('check', (data) => {
                if (!isCancelled) {
                    event.sender.send('launch-check', data);
                }
            });
            
            launcher.on('estimated_time', (data) => {
                if (!isCancelled) {
                    event.sender.send('launch-estimated-time', data);
                }
            });
            
            launcher.on('complete', (data) => {
                if (!isCancelled) {
                    event.sender.send('launch-complete', data);
                }
            });
    
            launcher.on('data', (data) => {
                if (!isCancelled) {
                    event.sender.send('launch-data', data);
                }
            });
    
            launcher.on('error', (error) => {
                if (!isCancelled) {
                    event.sender.send('error', error);
                    console.log(error);
                }
            });
    
            launcher.on('close', code => {
                if (!isCancelled) {
                    event.sender.send('launch-close', code);
                }
                ipcMain.removeHandler('cancel-launch');
            });
            
            launcher.on('cancelled', message => {
                event.sender.send('launch-cancelled', message);
                console.log('huh---cancelling? Aw man!!!!!@@')
                ipcMain.removeHandler('cancel-launch');
            });
            
            await launcher.Launch(options);
            console.log(options);
            console.log('Launch initiated successfully');
            return { success: true };
        } catch (error) {
            console.error('Launch failed:', error);
            event.sender.send('launch-error', error);
            console.log(error);
            // Clean up the cancel handler on error
            ipcMain.removeHandler('cancel-launch');
            return { success: false, error: error.message };
        }
    });

    // ACCOUNT HANDLERS
    ipcMain.handle('add-account', async () => {
        try {
            const auth = new msmc.Auth('select_account');
            const result = await auth.launch('electron', {
                resizable: false,
                width: 700,
                height: 500,
                title: "Add Minecraft Account",
                icon: path.join(
                    __dirname,
                    `../../public/${os.platform() === "win32" ? "icon.ico" : "icon.png"}`
                )
            })
            const mc = await result.getMinecraft();

            console.log(mc.mclc());

            return JSON.stringify({
                success: true,
                mc: mc.mclc(),
                extra: mc
            });
        } catch (error) {
            console.error("Error during account authentication:", error);
            return JSON.stringify({
                success: false,
                error: error.message || "Authentication process was canceled or failed.",
            });
        }
    });
    ipcMain.handle('refresh-account', async (event, profile) => {
        try {
            console.log(profile);
            if(!profile){
                return {
                    success: false,
                    error: 'Profile is null!'
                }
            }    
            const refreshed = await new msmc.Auth().refresh(profile.refresh_token);
            return {
                success: true,
                mc: (await refreshed.getMinecraft()).mclc(),
                extra: refreshed
            }
        } catch (error) {
            console.log('Account refresh error: ', error);
            return {
                success: false,
                error: error.message | 'Account refresh failed!'
            }
        }
    });

    // SYSTEM & UTILITY HANDLERS
    ipcMain.handle("open-folder-dialog", async () => {
        const result = await dialog.showOpenDialog(getAppWindow(), {
            properties: ["openDirectory", "dontAddToRecent"],
        });

        return result.filePaths[0] || null;
    });
    ipcMain.handle('open-folder-in-explorer', async (event, folderPath) => {
        await shell.openPath(folderPath);
    });
    ipcMain.handle('get-app-path', () => {
        return `${rootDirectory}/.OriLauncher`
    });
    ipcMain.handle('get-minecraft-path', () => {
        return `${rootDirectory}/.OriLauncher/.Minecraft`
    });
    ipcMain.handle('get-backup-folder', () => {
        return `${rootDirectory}/.OriLauncher/Backup`
    });
    ipcMain.handle("minimize-app", () => {
        const win = getAppWindow();
        if (win) win.minimize();
    });
    ipcMain.handle("quit-app", () => {
        app.quit();
    });
    ipcMain.handle('download-skin', async (event, skinUrl, filename) => {
        try {
            // Show save dialog
            const result = await dialog.showSaveDialog({
                title: 'Save Skin',
                defaultPath: filename || 'skin.png',
                filters: [
                    { name: 'PNG Images', extensions: ['png'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            
            if (result.canceled) {
                return { success: false, canceled: true };
            }
            
            // Download the skin
            const protocol = skinUrl.startsWith('https:') ? https : http;
            
            return new Promise((resolve) => {
                protocol.get(skinUrl, (response) => {
                    if (response.statusCode === 200) {
                        const chunks = [];
                        
                        response.on('data', (chunk) => {
                            chunks.push(chunk);
                        });
                        
                        response.on('end', async () => {
                            try {
                                const buffer = Buffer.concat(chunks);
                                await fs.writeFile(result.filePath, buffer);
                                resolve({ success: true, filePath: result.filePath });
                            } catch (error) {
                                resolve({ success: false, error: error.message });
                            }
                        });
                    } else {
                        resolve({ success: false, error: `HTTP ${response.statusCode}` });
                    }
                }).on('error', (error) => {
                    resolve({ success: false, error: error.message });
                });
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // LOG HANDLERS
    ipcMain.handle('start-log-session', async () => {
        try {
            const logsDir = path.join(rootDirectory, '.OriLauncher', 'logs');
            await fs.mkdir(logsDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const sessionFile = path.join(logsDir, `session-${timestamp}.log`);
            
            // Store current session file path
            global.currentLogSession = sessionFile;
            
            const sessionStart = `
            ******************************************************\n
            |   ORI LAUNCHER v${app.getVersion()}\n - by Cosmic-fi
            ******************************************************\n
            === LOG SESSION STARTED: ${new Date().toISOString()} ===\n`;
            await fs.writeFile(sessionFile, sessionStart, 'utf8');
            
            return { success: true, sessionFile };
        } catch (error) {
            console.error('Failed to start log session:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('end-log-session', async () => {
        try {
            if (global.currentLogSession) {
                const sessionEnd = `=============[ LOG SESSION ENDED: ${new Date().toISOString()} ]=============\n`;
                await fs.appendFile(global.currentLogSession, sessionEnd, 'utf8');
                global.currentLogSession = null;
            }
            return { success: true };
        } catch (error) {
            console.error('Failed to end log session:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('write-session-log', async (event, logEntry) => {
        try {
            if (!global.currentLogSession) {
                return { success: false, error: 'No active log session' };
            }
            
            const logLine = `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}${logEntry.data ? ' ' + JSON.stringify(logEntry.data) : ''}\n`;
            await fs.appendFile(global.currentLogSession, logLine, 'utf8');
            
            return { success: true };
        } catch (error) {
            console.error('Failed to write session log:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('read-session-logs', async (event, options = {}) => {
        try {
            const logsDir = path.join(rootDirectory, '.OriLauncher', 'logs');
            const { maxSessions = 5, maxLines = 1000 } = options;
            
            const files = await fs.readdir(logsDir);
            const sessionFiles = files
                .filter(file => file.startsWith('session-') && file.endsWith('.log'))
                .sort()
                .slice(-maxSessions);
            
            const logs = [];
            
            for (const file of sessionFiles) {
                const filePath = path.join(logsDir, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const lines = content.trim().split('\n').filter(line => line.length > 0);
                    
                    for (const line of lines) {
                        if (line.startsWith('===')) {
                            // Session markers
                            logs.push({
                                timestamp: new Date().toISOString(),
                                level: 'INFO',
                                message: line,
                                data: null
                            });
                        } else {
                            const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([A-Z]+)\] (.+)$/);
                            if (match) {
                                const [, timestamp, level, messageAndData] = match;
                                let message = messageAndData;
                                let data = null;
                                
                                const lastBraceIndex = messageAndData.lastIndexOf('{');
                                if (lastBraceIndex !== -1) {
                                    try {
                                        const potentialJson = messageAndData.substring(lastBraceIndex);
                                        data = JSON.parse(potentialJson);
                                        message = messageAndData.substring(0, lastBraceIndex).trim();
                                    } catch {
                                        // Not valid JSON, keep as message
                                    }
                                }
                                
                                logs.push({ timestamp, level, message, data });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to read session file ${file}:`, error);
                }
            }
            
            return { success: true, logs: logs.slice(-maxLines) };
        } catch (error) {
            console.error('Failed to read session logs:', error);
            return { success: false, error: error.message, logs: [] };
        }
    });
    ipcMain.handle('clear-log-files', async () => {
        try {
            const logsDir = path.join(rootDirectory, '.OriLauncher', 'logs');
            const files = await fs.readdir(logsDir);
            
            for (const file of files) {
                if (file.endsWith('.log')) {
                    await fs.unlink(path.join(logsDir, file));
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('Failed to clear log files:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('get-session-history', async () => {
        try {
            const sessionsFile = path.join(rootDirectory, '.OriLauncher', 'sessions.json');
            
            try {
                const data = await fs.readFile(sessionsFile, 'utf8');
                const sessions = JSON.parse(data);
                return { success: true, sessions };
            } catch (error) {
                return { success: true, sessions: [] };
            }
        } catch (error) {
            console.error('Failed to get session history:', error);
            return { success: false, error: error.message, sessions: [] };
        }
    });

    // DISCORD RPC HANDLERS
    ipcMain.handle('discord-rpc-init', async () => {
        try {
            await discordRPC.initialize();
            return { success: true };
        } catch (error) {
            console.error('Discord RPC initialization failed:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('discord-rpc-disconnect', async () => {
        try {
            await discordRPC.disconnect();
            return { success: true };
        } catch (error) {
            console.error('Discord RPC disconnect failed:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('discord-rpc-set-idle', () => {
        discordRPC.setIdleActivity();
        return { success: true };
    });
    ipcMain.handle('discord-rpc-set-launching', (event, version, variant) => {
        discordRPC.setLaunchingActivity(version, variant);
        return { success: true };
    });
    ipcMain.handle('discord-rpc-set-playing', (event, version, variant, username) => {
        discordRPC.setPlayingActivity(version, variant, username);
        return { success: true };
    });
    ipcMain.handle('discord-rpc-set-downloading', (event, progress, version) => {
        discordRPC.setDownloadingActivity(progress, version);
        return { success: true };
    });
    ipcMain.handle('discord-rpc-clear', async () => {
        try {
            await discordRPC.clearActivity();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('discord-rpc-status', () => {
        return discordRPC.getStatus();
    });

    // SYSTEM NOTIFICATION HANDLERS
    ipcMain.handle('show-system-notification', async (_, { title, body, icon, actions, silent = true }) => {
        try {
            const notification = new Notification({
                title,
                body,
                icon: icon || path.join(__dirname, '../../public/icons/default.png'),
                actions: actions || [],
                silent: silent // This disables the default Windows notification sound
            });

            notification.show();
            
            return { success: true };
        } catch (error) {
            console.error('Failed to show system notification:', error);
            return { success: false, error: error.message };
        }
    });
    ipcMain.handle('check-notification-permission', async () => {
        // On Windows/Linux, notifications are always available
        // On macOS, we might need to check system preferences
        return { permission: 'granted' };
    });
    ipcMain.handle('get-app-version', async () => {
        return {
            version: app.getVersion(),
            isPackaged: app.isPackaged
        };
    });
    
    // Additional updater handlers for manual control
    ipcMain.handle('check-for-updates-manual', async () => {
        try {
            if (!app.isPackaged) {
                return { success: false, message: 'Updates not available in development mode' };
            }
            
            // The AppUpdater instance will handle this via the 'update-app' handler
            return { success: true, message: 'Use update-app IPC handler instead' };
        } catch (error) {
            console.error('Error with manual update check:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('set-update-channel', async (event, channel) => {
        try {
            if (!app.isPackaged) {
                return { success: false, message: 'Update channel not available in development mode' };
            }
            
            // This would need to be handled by the AppUpdater instance
            // For now, return success but note that channel setting should be done via AppUpdater
            return { success: true, message: `Update channel functionality available via AppUpdater class` };
        } catch (error) {
            console.error('Error setting update channel:', error);
            return { success: false, error: error.message };
        }
    });

    // Network & API
    ipcMain.handle('ping-api', async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const res = await fetch('https://api.cosmicfi.dev/orilauncher', {
            method: 'GET',
            headers: {
                'User-Agent': 'OriLauncher/2.0.0 (Electron)',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            signal: controller.signal
            });

            clearTimeout(timeout);
            if (!res.ok) throw new Error('API not OK');

            const data = await res.json();
            if (!data.status || !data.status.includes('Online')) // your actual API says "Online", not "Alive"
            throw new Error('Bad ping response');

            return true;
        } catch (e) {
            clearTimeout(timeout);
            console.error('Ping failed:', e.message);
            return false;
        }
    });
};

// HELPER FUNCTIONS
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const items = await fs.readdir(src, { withFileTypes: true });
    
    for (const item of items) {
        const srcPath = path.join(src, item.name);
        const destPath = path.join(dest, item.name);
        
        if (item.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}
async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch {}
}
function formatEntry(entry) {
  const { timestamp, level, message, data } = entry;
  const payload = data !== null && data !== undefined ? ` | ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${payload}\n`;
}

/**
 * Initializes the application.
*/
const initializeApp = async () => {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
        app.quit();
        return;
    }

    app.disableHardwareAcceleration();
    
    app.on("second-instance", () => {
        const mainWindow = getAppWindow();
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") app.quit();
    });

    app.on("activate", () => {
        if (!getAppWindow()) setAppWindow();
    });

    try {
        await app.whenReady();
        setupIpcHandlers();
        setAppWindow();
    } catch (error) {
        console.error("Error during app initialization:", error);
        app.quit();
    }
};

// Start the application
initializeApp();