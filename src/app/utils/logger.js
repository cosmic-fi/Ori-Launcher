// @ts-nocheck
import { writable } from 'svelte/store';

const logLevels = {
    DEBUG: { level: 0, color: '#ba68c8' },
    INFO: { level: 1, color: '#4fc3f7' },
    SUCCESS: { level: 2, color: '#69f0ae' },
    WARNING: { level: 3, color: '#ffb300' },
    ERROR: { level: 4, color: '#ff5252' }
};

function createLogger() {
    const { subscribe, set, update } = writable([]);
    let minLevel = 'DEBUG';
    let showTimestamps = true;
    let maxEntries = 1000;
    let isInitialized = false;
    let sessionActive = false;

    // Initialize by loading previous session logs
    async function initialize() {
        if (isInitialized) return;
        
        try {
            // Load previous session logs for context
            const result = await window.electron?.readSessionLogs?.({ maxSessions: 3, maxLines: maxEntries });
            if (result?.success && result.logs) {
                set(result.logs);
                console.log(`Loaded ${result.logs.length} log entries from previous sessions`);
            }
        } catch (error) {
            console.error('Failed to load session logs:', error);
        }
        
        isInitialized = true;
    }

    // Start a new log session
    async function startSession() {
        if (sessionActive) return;
        
        try {
            const result = await window.electron?.startLogSession?.();
            if (result?.success) {
                sessionActive = true;
                // Clear current logs and start fresh
                set([]);
                await addLog('INFO', 'New log session started');
                console.log('Log session started:', result.sessionFile);
            }
        } catch (error) {
            console.error('Failed to start log session:', error);
        }
    }

    // End the current log session
    async function endSession() {
        if (!sessionActive) return;
        
        try {
            await addLog('INFO', 'Log session ending');
            await window.electron?.endLogSession?.();
            sessionActive = false;
            console.log('Log session ended');
        } catch (error) {
            console.error('Failed to end log session:', error);
        }
    }

    async function addLog(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, level, message, data };
        
        // Add to memory store
        update(logs => {
            const newLogs = [...logs, entry];
            return newLogs.slice(-maxEntries);
        });
        
        // Write to session file if session is active
        if (sessionActive) {
            try {
                await window.electron?.writeSessionLog?.(entry);
            } catch (error) {
                console.error('Failed to write to session log:', error);
            }
        }
        
        // Also log to browser console
        const consoleMethod = level === 'ERROR' ? 'error' :
                             level === 'WARNING' ? 'warn' : 'log';
        console[consoleMethod](`[${level}] ${message}`, data || '');
    }

    return {
        subscribe,
        
        // Initialize the logger
        init: initialize,
        
        // Session management
        startSession,
        endSession,
        
        // Logging methods
        debug: (message, data) => addLog('DEBUG', message, data),
        info: (message, data) => addLog('INFO', message, data),
        success: (message, data) => addLog('SUCCESS', message, data),
        warn: (message, data) => addLog('WARNING', message, data),
        error: (message, data) => addLog('ERROR', message, data),
        
        // Clear current session logs
        clear: () => {
            set([]);
        },
        
        // Reload logs from sessions
        reload: async () => {
            try {
                const result = await window.electron?.readSessionLogs?.({ maxSessions: 3, maxLines: maxEntries });
                if (result?.success && result.logs) {
                    set(result.logs);
                }
            } catch (error) {
                console.error('Failed to reload session logs:', error);
            }
        },
        
        // Configuration methods
        setMinLevel: (level) => { minLevel = level; },
        setShowTimestamps: (show) => { showTimestamps = show; },
        setMaxEntries: (max) => { maxEntries = max; },
        
        // Getters
        logLevels,
        getCurrentLevel: () => minLevel,
        getShowTimestamps: () => showTimestamps,
        getMaxEntries: () => maxEntries,
        isSessionActive: () => sessionActive
    };
}

export const logger = createLogger();