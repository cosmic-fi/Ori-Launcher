import { writable } from 'svelte/store';

const logLevels = {
  DEBUG: { color: '#ba68c8', level: 0 },
  INFO: { color: '#4fc3f7', level: 1 },
  SUCCESS: { color: '#69f0ae', level: 1 },
  WARNING: { color: '#fff176', level: 2 },
  ERROR: { color: '#ff5252', level: 3 }
};

function createLogger() {
  const { subscribe, update, set } = writable([]);

  let minLevel = 'INFO';
  let showTimestamps = true;
  let maxEntries = 1000;

  function log(level, message, data = {}, isSystemMessage = false) {
    if (!isSystemMessage && logLevels[level].level < logLevels[minLevel].level) return;

    const timestamp = new Date();
    const entry = {
      timestamp,
      level,
      message,
      data: Object.keys(data).length ? data : null,
      isSystemMessage
    };

    update(logs => {
      const newLogs = [...logs, entry];
      if (newLogs.length > maxEntries) newLogs.shift();
      return newLogs;
    });

    // Also log to browser console
    const timeStr = showTimestamps ? `[${timestamp.toLocaleTimeString()}] ` : '';
    if (Object.keys(data).length) {
      console.log(`%c${timeStr}[${level}] ${message}`, `color: ${logLevels[level].color};`, data);
    } else {
      console.log(`%c${timeStr}[${level}] ${message}`, `color: ${logLevels[level].color};`);
    }
  }

  return {
    subscribe,
    log,
    info: (msg, data) => log('INFO', msg, data),
    success: (msg, data) => log('SUCCESS', msg, data),
    warn: (msg, data) => log('WARNING', msg, data),
    error: (msg, data) => log('ERROR', msg, data),
    debug: (msg, data) => log('DEBUG', msg, data),
    systemLog: (msg, data) => log('INFO', msg, data, true),
    clear: () => set([]),
    setMinLevel: (level) => { if (logLevels[level]) minLevel = level; },
    getCurrentLevel: () => minLevel,
    setShowTimestamps: (show) => { showTimestamps = !!show; },
    setMaxEntries: (max) => { maxEntries = max; },
    getAvailableLevels: () => Object.keys(logLevels),
    getLevelDescription: (level) => {
      const descriptions = {
        DEBUG: 'All messages',
        INFO: 'Standard logging',
        SUCCESS: 'Success messages',
        WARNING: 'Warnings and errors',
        ERROR: 'Errors only'
      };
      return descriptions[level] || 'Unknown level';
    }
  };
}

export const logger = {
  ...createLogger(),
  logLevels
};