const { contextBridge, shell, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload loaded');
});

contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => shell.openExternal(url),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  getMemoryInfo: () => process.getSystemMemoryInfo(),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  
  // Game launch methods
  launchGame: async (options) => ipcRenderer.invoke('launch-game', options),
  cancelLaunch: async (event) => ipcRenderer.invoke('cancel-launch', event),
  
  // Launch event listeners
  onLaunchProgress: (callback) => ipcRenderer.on('launch-progress', (event, data) => callback(data)),
  onLaunchExtract: (callback) => ipcRenderer.on('launch-extract', (event, data) => callback(data)),
  onLaunchCheck: (callback) => ipcRenderer.on('launch-check', (event, data) => callback(data)),
  onLaunchData: (callback) => ipcRenderer.on('launch-data', (event,data) => callback(data)),
  onLaunchClose: (callback) => ipcRenderer.on('launch-close', (event, code) => callback(code)),
  onLaunchEstimatedTime: (callback) => ipcRenderer.on('launch-estimated-time', (event, data) => callback(data)),
  onLaunchComplete: (callback) => ipcRenderer.on('launch-complete', (event, data) => callback(data)),
  onLaunchError: (callback) => ipcRenderer.on('launch-error', (event, data) => callback(data)),
  onLaunchCancelled: (callback) => ipcRenderer.on('launch-cancelled', (event, message) => callback(message)),
  
  // Remove event listeners
  removeAllLaunchListeners: () => {
    ipcRenderer.removeAllListeners('launch-progress');
    ipcRenderer.removeAllListeners('launch-extract');
    ipcRenderer.removeAllListeners('launch-check');
    ipcRenderer.removeAllListeners('launch-estimated-time');
    ipcRenderer.removeAllListeners('launch-complete');
    ipcRenderer.removeAllListeners('launch-error');
    ipcRenderer.removeAllListeners('launch-cancelled');
  },
  
  getAppFolder: () => ipcRenderer.invoke('get-app-path'),
  getMinecraftFolder: () => ipcRenderer.invoke('get-minecraft-path'),
  getBackupFolder: () => ipcRenderer.invoke('get-backup-folder'),
  
  // File logging methods
  writeLog: (logEntry) => ipcRenderer.invoke('write-log', logEntry),
  readLogs: (options) => ipcRenderer.invoke('read-logs', options),
  clearLogFiles: () => ipcRenderer.invoke('clear-log-files'),
  
  // Session-based logging methods
  startLogSession: () => ipcRenderer.invoke('start-log-session'),
  endLogSession: () => ipcRenderer.invoke('end-log-session'),
  writeSessionLog: (logEntry) => ipcRenderer.invoke('write-session-log', logEntry),
  readSessionLogs: (options) => ipcRenderer.invoke('read-session-logs', options),
  
  // Playtime tracking methods
  getPlaytime: () => ipcRenderer.invoke('get-playtime'),
  savePlaytime: (totalPlaytime, sessionDuration) => ipcRenderer.invoke('save-playtime', totalPlaytime, sessionDuration),
  resetPlaytime: () => ipcRenderer.invoke('reset-playtime'),
  getSessionHistory: () => ipcRenderer.invoke('get-session-history'),
});