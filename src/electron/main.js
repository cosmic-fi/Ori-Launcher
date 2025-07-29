// @ts-nocheck
/**
 * @author Cosmic-fi
 * Main entry point for the Ori Launcher application.
 */
"use strict";

import{ app, ipcMain, dialog } from "electron";
import msmc, { Auth } from 'msmc';
import fs from 'fs/promises';
import path from 'path';
import os from 'os'
import { fileURLToPath } from 'url';

// import autoUpdater from "electron-updater";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { setAppWindow, getAppWindow, closeAppWindow } from './window/appWindow.js';
import setTray from "./utils/tray.js";
// import { Launch, Microsoft } from "minecraft-java-core";
import { MinecraftLauncher } from "./utils/MinecraftLauncher.js";
import { Launch } from "ori-mcc";
import { execSync } from "child_process";

/**
 * Sets up IPC handlers for communication between the main and renderer processes.
*/
const launcher = new Launch();
const rootDirectory = process.env.APPDATA || (process.platform === 'darwin' ? `${process.env.APPDATA}/Library/Application Support`: process.env.HOME);

const setupIpcHandlers = () => {
    // Game launch handlers
    ipcMain.handle('launch-game', async (event, options) => {
        try {
            console.log("======= Starting game launch =======");
            // Set up event forwarding from MinecraftLauncher to renderer
            launcher.on('progress', (progress, size, element) => {
                event.sender.send('launch-progress', { progress, size, element });
            });
            
            launcher.on('extract', (data) => {
                event.sender.send('launch-extract', data);
            });
            
            launcher.on('check', (data) => {
                event.sender.send('launch-check', data);
            });
            
            launcher.on('estimated_time', (data) => {
                event.sender.send('launch-estimated-time', data);
            });
            
            launcher.on('complete', (data) => {
                event.sender.send('launch-complete', data);
            });

            launcher.on('data', (data) => {
                event.sender.send('launch-data', data);
            });

            launcher.on('error', (error) => {
                event.sender.send('launch-error', error);
            });

            launcher.on('close', code => {
                event.sender.send('launch-close', code);
            });
            
            launcher.on('cancelled', message => {
                event.sender.send('launch-cancelled');
            })
            
            launcher.Launch(options);
            return { success: true };
        } catch (error) {
            console.error('Launch failed:', error);
            return { success: false, error: error.message };
        }
    });
    
    // Cancel launch handler
    ipcMain.handle('cancel-launch', async (event, _) => {
        try {
            await launcher.cancel();
            console.log('=============Requesting to cancel==============');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    ipcMain.handle("open-folder-dialog", async () => {
        const result = await dialog.showOpenDialog({
            title: "Select a Folder",
            properties: ["openDirectory", "dontAddToRecent"],
        });

        console.log('ahhhhh opening folderrrr')
        return result.filePaths[0] || null;
    });

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
                    `../../public/icons/${os.platform() === "win32" ? "win32.ico" : "default.png"}`
                )
            })
            const mc = await result.getMinecraft();

            console.log(mc.mclc());

            return JSON.stringify({
                success: true,
                mc: mc.mclc(),
            });
        } catch (error) {
            console.error("Error during account authentication:", error);
            return JSON.stringify({
                success: false,
                error: error.message || "Authentication process was canceled or failed.",
            });
        }
    });

    ipcMain.handle('get-app-path', () => {
        return `${rootDirectory}/.OriLauncher`
    });
    ipcMain.handle('get-minecraft-path', () => {
        return `${rootDirectory}/.OriLauncher/.Minecraft`
    });
    ipcMain.handle('get-backup-folder', () => {
        return `${rootDirectory}/.OriLauncher/Backup`
    })
    ipcMain.on("close-app-window", () => {
        closeAppWindow();
    });

    ipcMain.on("minimize-app-window", () => {
        const win = getAppWindow();
        if (win) win.minimize();
    });

    ipcMain.on("maximize-app-window", () => {
        const win = getAppWindow();
        if (win && !win.isMaximized()) win.maximize();
    });

    ipcMain.on("hide-app-window", () => {
        const win = getAppWindow();
        if (win) win.hide();
    });

    ipcMain.on("show-app-window", () => {
        const win = getAppWindow();
        if (win) win.show();
    });

    ipcMain.on("quit-app", () => {
        app.quit();
    });

    // Session-based file logging handlers
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

    ipcMain.handle('get-playtime', async () => {
        try {
            const playtimeFile = path.join(rootDirectory, '.OriLauncher', 'playtime.json');
            
            try {
                const data = await fs.readFile(playtimeFile, 'utf8');
                const playtimeData = JSON.parse(data);
                return { success: true, playtime: playtimeData.totalPlaytime || 0 };
            } catch (error) {
                // File doesn't exist, return 0
                return { success: true, playtime: 0 };
            }
        } catch (error) {
            console.error('Failed to get playtime:', error);
            return { success: false, error: error.message, playtime: 0 };
        }
    });
    
    ipcMain.handle('save-playtime', async (event, totalPlaytime, sessionDuration) => {
        try {
            const appDir = path.join(rootDirectory, '.OriLauncher');
            await fs.mkdir(appDir, { recursive: true });
            
            const playtimeFile = path.join(appDir, 'playtime.json');
            const sessionsFile = path.join(appDir, 'sessions.json');
            
            // Save total playtime
            const playtimeData = {
                totalPlaytime,
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(playtimeFile, JSON.stringify(playtimeData, null, 2), 'utf8');
            
            // Save session history
            let sessions = [];
            try {
                const sessionsData = await fs.readFile(sessionsFile, 'utf8');
                sessions = JSON.parse(sessionsData);
            } catch {
                // File doesn't exist, start with empty array
            }
            
            sessions.push({
                duration: sessionDuration,
                timestamp: new Date().toISOString(),
                date: new Date().toDateString()
            });
            
            // Keep only last 100 sessions
            if (sessions.length > 100) {
                sessions = sessions.slice(-100);
            }
            
            await fs.writeFile(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8');
            
            return { success: true };
        } catch (error) {
            console.error('Failed to save playtime:', error);
            return { success: false, error: error.message };
        }
    });
    
    ipcMain.handle('reset-playtime', async () => {
        try {
            const appDir = path.join(rootDirectory, '.OriLauncher');
            const playtimeFile = path.join(appDir, 'playtime.json');
            const sessionsFile = path.join(appDir, 'sessions.json');
            
            // Reset playtime data
            const playtimeData = {
                totalPlaytime: 0,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(playtimeFile, JSON.stringify(playtimeData, null, 2), 'utf8');
            await fs.writeFile(sessionsFile, JSON.stringify([], null, 2), 'utf8');
            
            return { success: true };
        } catch (error) {
            console.error('Failed to reset playtime:', error);
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
    // ipcMain.handle("check-for-updates", async () => {
    //     try {
    //         const updateCheck = await autoUpdater.checkForUpdates();
    //         return updateCheck.updateInfo;
    //     } catch (error) {
    //         return { error: true, message: error.message };
    //     }
    // });

    // ipcMain.on("start-update", () => autoUpdater.downloadUpdate());
    // ipcMain.on("install-update", () => autoUpdater.quitAndInstall());
};

/**
 * Sets up auto-updater event listeners.
*/
// const setupAutoUpdaterListeners = () => {
//     autoUpdater.autoDownload = false;

//     autoUpdater.on("update-available", (info) => {
//         getAppWindow().webContents.send("update-available", info);
//     });

//     autoUpdater.on("update-not-available", () => {
//         getAppWindow().webContents.send("update-not-available");
//     });

//     autoUpdater.on("download-progress", (progress) => {
//         getAppWindow().webContents.send("update-progress", progress);
//     });

//     autoUpdater.on("update-downloaded", () => {
//         getAppWindow().webContents.send("update-ready");
//     });
// };

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
        // setupAutoUpdaterListeners();
        setAppWindow();
        setTray();
    } catch (error) {
        console.error("Error during app initialization:", error);
        app.quit();
    }
};

// Start the application
initializeApp();