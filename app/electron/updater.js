// @ts-nocheck
const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

class AppUpdater {
  constructor() {
    // Configure auto-updater
    autoUpdater.checkForUpdatesAndNotify();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // When update is available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      this.showUpdateAvailableDialog(info);
    });

    // When update is not available
    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available:', info);
    });

    // When update is downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.showUpdateDownloadedDialog(info);
    });

    // When there's an error
    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      this.showUpdateErrorDialog(error);
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      let logMessage = `Download speed: ${progressObj.bytesPerSecond}`;
      logMessage += ` - Downloaded ${progressObj.percent}%`;
      logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
      log.info(logMessage);
      
      // Send progress to renderer if needed
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('download-progress', progressObj);
      }
    });
  }

  showUpdateAvailableDialog(info) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available!`,
      detail: 'The update will be downloaded in the background. You will be notified when it is ready to install.',
      buttons: ['OK']
    });
  }

  showUpdateDownloadedDialog(info) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    const response = dialog.showMessageBoxSync(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Update ${info.version} has been downloaded and is ready to install.`,
      detail: 'The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  }

  showUpdateErrorDialog(error) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Update Error',
      message: 'There was an error while checking for updates.',
      detail: error.message,
      buttons: ['OK']
    });
  }

  // Manual check for updates
  checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
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

module.exports = AppUpdater;