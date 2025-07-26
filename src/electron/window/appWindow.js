/**
 * @author Cosmic-fi
 * Handles the main application window for Ori Launcher.
 */

import * as remoteMain from '@electron/remote/main/index.js';
remoteMain.initialize();


import{ app, BrowserWindow } from 'electron';
import path from "path";
import os from "os";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
let window = undefined;

const iconPath = `./src/assets/icons/${os.platform() === "win32" ? "win32.ico" : "default.png"}`;
/**
 * Creates and sets up the main application window.
 */
const setAppWindow = () => {
    window = new BrowserWindow({
        title: "Ori Launcher",
        width: 1030,
        height: 600,
        minHeight: 600,
        minWidth: 1030,
        resizable: true,
        closable: true,
        maximizable: true,
        icon: iconPath,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            devTools: true,
            preload: path.join(__dirname, '../preload.js')
        },
        backgroundColor: '#2F2F37',
    });
    
    // Load the main HTML file
    if (isDev) {
        window.loadURL('http://localhost:5173');
    } else {
        window.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    // Show the window once it's ready
    window.once('ready-to-show', () => {
        window.show();
        window.webContents.openDevTools({ mode: "detach" });
    });

    // Remove the default menu
    window.removeMenu();
};

/**
 * Returns the current application window instance.
 * @returns {BrowserWindow | undefined} The application window instance.
 */
const getAppWindow = () => {
    return window;
};

/**
 * Closes the application window and cleans up the instance.
 */
const closeAppWindow = () => {
    if (!window) return;

    window.close();
    window = undefined;
};

export {
    setAppWindow,
    getAppWindow,
    closeAppWindow
}