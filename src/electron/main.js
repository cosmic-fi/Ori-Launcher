// @ts-nocheck
/**
 * @author Cosmic-fi
 * Main entry point for the Ori Launcher application.
 */
"use strict";

import{ app, ipcMain, dialog } from "electron";
import msmc from 'msmc';
import fs from 'fs/promises';
import path from 'path';
import os from 'os'
import { fileURLToPath } from 'url';

// import autoUpdater from "electron-updater";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import { setAppWindow, getAppWindow, closeAppWindow } from './window/appWindow.js';
import setTray from "./utils/tray.js";

/**
 * Sets up IPC handlers for communication between the main and renderer processes.
*/

const rootDirectory = process.env.APPDATA || 
    (process.platform === 'darwin' ? `${process.env.APPDATA}/Library/Application Support`: process.env.HOME);

console.log(rootDirectory);

const setupIpcHandlers = () => {
    ipcMain.handle('launch-game', async (event, options) => {
        try {
            // event.sender.send('launch-progress', options);
            return { success: true };
        } catch (error) {
            return { success: false, error: err.message };
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
            return JSON.stringify({
                success: true,
                mc
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