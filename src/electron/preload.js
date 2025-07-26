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
  launchGame: async (options) => ipcRenderer.invoke('launch-game', options),
  onLaunchProgress: (callback) => ipcRenderer.on('launch-progress', (event, data) => callback(data)),
  getAppFolder: () => ipcRenderer.invoke('get-app-path'),
  getMinecraftFolder: () => ipcRenderer.invoke('get-minecraft-path'),
  getBackupFolder: () => ipcRenderer.invoke('get-backup-folder')
});