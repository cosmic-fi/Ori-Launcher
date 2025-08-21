// @ts-nocheck
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { app, dialog, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Disable auto-download for manual control
autoUpdater.autoDownload = false;

class AppUpdater {
    constructor() {
        this.setupIpcHandlers();
        this.setupAutoUpdaterEvents();
    }

    setupIpcHandlers() {
        // Handle update check requests from renderer
        ipcMain.handle('update-app', async () => {
            try {
                const result = await autoUpdater.checkForUpdates();
                return { success: true, updateInfo: result };
            } catch (error) {
                log.error('Error checking for updates:', error);
                return { success: false, error: error.message };
            }
        });

        // Handle update download requests
        ipcMain.on('start-update', () => {
            autoUpdater.downloadUpdate();
        });

        // Handle quit and install requests
        ipcMain.on('quit-and-install', () => {
            autoUpdater.quitAndInstall();
        });
    }

    setupAutoUpdaterEvents() {
        autoUpdater.on('checking-for-update', () => {
            log.info('Checking for update...');
            this.sendToRenderer('checking-for-update');
        });

        autoUpdater.on('update-available', (info) => {
            log.info('Update available.');
            this.sendToRenderer('update-available', info);
            this.showUpdateAvailableDialog(info);
        });

        autoUpdater.on('update-not-available', (info) => {
            log.info('Update not available.');
            this.sendToRenderer('update-not-available', info);
        });

        autoUpdater.on('error', (err) => {
            log.error('Error in auto-updater. ' + err);
            this.sendToRenderer('update-error', err.message);
            this.showUpdateErrorDialog(err);
        });

        autoUpdater.on('download-progress', (progressObj) => {
            let log_message = "Download speed: " + progressObj.bytesPerSecond;
            log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
            log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
            log.info(log_message);
            this.sendToRenderer('download-progress', progressObj);
        });

        autoUpdater.on('update-downloaded', (info) => {
            log.info('Update downloaded');
            this.sendToRenderer('update-downloaded', info);
            this.showUpdateDownloadedDialog(info);
        });
    }

    sendToRenderer(event, data = null) {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(event, data);
        }
    }

    showUpdateAvailableDialog(info) {
        const result = dialog.showMessageBoxSync(null, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${info.version}) is available. Would you like to download it now?`,
            buttons: ['Download Now', 'Later'],
            defaultId: 0
        });
        
        if (result === 0) {
            autoUpdater.downloadUpdate();
        }
    }

    showUpdateDownloadedDialog(info) {
        const result = dialog.showMessageBoxSync(null, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update downloaded successfully. The application will restart to apply the update.',
            buttons: ['Restart Now', 'Later'],
            defaultId: 0
        });
        
        if (result === 0) {
            autoUpdater.quitAndInstall();
        }
    }

    showUpdateErrorDialog(error) {
        dialog.showMessageBox(null, {
            type: 'error',
            title: 'Update Error',
            message: 'There was an error while checking for updates.',
            detail: error.message,
            buttons: ['OK']
        });
    }

    // Manual check for updates
    checkForUpdates() {
        return autoUpdater.checkForUpdates();
    }

    // Get current version
    getCurrentVersion() {
        return autoUpdater.currentVersion;
    }

    // Set update channel (stable, beta, alpha)
    setChannel(channel) {
        autoUpdater.channel = channel;
    }
}

export default AppUpdater;