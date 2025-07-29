import { writable, derived } from 'svelte/store';
import { getSelectedAccount, updateAccount } from '../shared/user.js';

// Debug mode - set to true for verbose logging
const DEBUG_PLAYTIME = true;

// Current session tracking
export const sessionStartTime = writable(null);
export const currentSessionTime = writable(0);
export const isGameRunning = writable(false);

// Derived store for formatted session time
export const formattedSessionTime = derived(currentSessionTime, ($currentSessionTime) => {
    if ($currentSessionTime === 0) return '0min';
    const hours = Math.floor($currentSessionTime / 3600);
    const minutes = Math.floor(($currentSessionTime % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
});

// Session timer interval
let sessionInterval = null;
let sessionStart = null;

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG_PLAYTIME) {
        console.log(`[PLAYTIME DEBUG] ${message}`, data || '');
    }
}

// Helper function to format playtime
export function formatPlaytime(seconds) {
    if (!seconds || seconds === 0) return '0min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

// Helper function to get account playtime from account_activities
export function getAccountPlaytime(account) {
    debugLog('Getting playtime for account:', account?.name);
    
    if (!account) {
        debugLog('No account provided');
        return 0;
    }

    // Initialize account_activities if it doesn't exist
    if (!account.account_activities) {
        debugLog('Initializing account_activities for account:', account.name);
        const identifier = account.type === 'offline' ? account.name : account.uuid;
        const updatedAccount = {
            ...account,
            account_activities: {
                playtime: {
                    totalSeconds: 0,
                    lastUpdated: new Date().toISOString(),
                    lastSessionDuration: 0,
                    sessionCount: 0
                }
            }
        };
        updateAccount(identifier, updatedAccount);
        return 0;
    }

    // Initialize playtime within account_activities if it doesn't exist
    if (!account.account_activities.playtime) {
        debugLog('Initializing playtime in account_activities for account:', account.name);
        const identifier = account.type === 'offline' ? account.name : account.uuid;
        const updatedActivities = {
            ...account.account_activities,
            playtime: {
                totalSeconds: 0,
                lastUpdated: new Date().toISOString(),
                lastSessionDuration: 0,
                sessionCount: 0
            }
        };
        updateAccount(identifier, { account_activities: updatedActivities });
        return 0;
    }

    const totalSeconds = account.account_activities.playtime.totalSeconds || 0;
    debugLog(`Retrieved playtime: ${formatPlaytime(totalSeconds)} (${totalSeconds}s)`);
    return totalSeconds;
}

// Playtime management functions
export const playtimeActions = {
    // Start a new gaming session
    startSession() {
        debugLog('=== STARTING PLAYTIME SESSION ===');
        
        const account = getSelectedAccount();
        if (!account) {
            debugLog('❌ No account selected, cannot start playtime session');
            console.warn('No account selected, cannot start playtime session');
            return false;
        }

        debugLog('✅ Account found:', {
            name: account.name,
            type: account.type,
            uuid: account.uuid
        });

        // Check if session is already running
        if (sessionStart) {
            debugLog('⚠️ Session already running, stopping previous session first');
            this.stopSession();
        }

        sessionStart = Date.now();
        sessionStartTime.set(sessionStart);
        currentSessionTime.set(0);
        isGameRunning.set(true);

        debugLog('🚀 Session started at:', new Date(sessionStart).toISOString());

        // Start session timer (update every second)
        sessionInterval = setInterval(() => {
            if (sessionStart) {
                const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
                currentSessionTime.set(elapsed);
                
                // Log every 30 seconds for debugging
                if (elapsed % 30 === 0 && elapsed > 0) {
                    debugLog(`⏱️ Session running: ${formatPlaytime(elapsed)}`);
                }
            }
        }, 1000);

        console.log('✅ Playtime session started for account:', account.name);
        return true;
    },

    // End the current gaming session and save playtime
    endSession() {
        debugLog('=== ENDING PLAYTIME SESSION ===');
        
        const account = getSelectedAccount();
        if (!account) {
            debugLog('❌ No account selected, cannot end playtime session');
            console.warn('No account selected, cannot end playtime session');
            return false;
        }

        if (!sessionStart) {
            debugLog('⚠️ No active session to end');
            console.log('No active session to end');
            return false;
        }

        const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000);
        const currentTotal = getAccountPlaytime(account);
        const newTotalPlaytime = currentTotal + sessionDuration;
        
        debugLog('📊 Session statistics:', {
            sessionDuration: `${sessionDuration}s (${formatPlaytime(sessionDuration)})`,
            previousTotal: `${currentTotal}s (${formatPlaytime(currentTotal)})`,
            newTotal: `${newTotalPlaytime}s (${formatPlaytime(newTotalPlaytime)})`
        });
        
        // Update account's playtime data in account_activities
        const identifier = account.type === 'offline' ? account.name : account.uuid;
        const currentActivities = account.account_activities || {};
        const currentPlaytime = currentActivities.playtime || {};
        
        const updatedActivities = {
            ...currentActivities,
            playtime: {
                totalSeconds: newTotalPlaytime,
                lastUpdated: new Date().toISOString(),
                lastSessionDuration: sessionDuration,
                sessionCount: (currentPlaytime.sessionCount || 0) + 1
            }
        };

        const updateResult = updateAccount(identifier, { account_activities: updatedActivities });
        
        if (updateResult) {
            debugLog('✅ Playtime data saved successfully');
            console.log(`✅ Session ended: ${formatPlaytime(sessionDuration)}, Total: ${formatPlaytime(newTotalPlaytime)} for account: ${account.name}`);
        } else {
            debugLog('❌ Failed to save playtime data');
            console.error('Failed to save playtime data');
        }

        // Clean up session
        this.stopSession();
        return updateResult;
    },

    // Stop session without saving (for cancellations)
    stopSession() {
        debugLog('🛑 Stopping session (cleanup)');
        
        sessionStart = null;
        sessionStartTime.set(null);
        currentSessionTime.set(0);
        isGameRunning.set(false);
        
        if (sessionInterval) {
            clearInterval(sessionInterval);
            sessionInterval = null;
            debugLog('⏹️ Session timer cleared');
        }
    },

    // Reset playtime for current account
    resetPlaytime() {
        debugLog('=== RESETTING PLAYTIME ===');
        
        const account = getSelectedAccount();
        if (!account) {
            debugLog('❌ No account selected, cannot reset playtime');
            console.warn('No account selected, cannot reset playtime');
            return false;
        }

        const identifier = account.type === 'offline' ? account.name : account.uuid;
        const currentActivities = account.account_activities || {};
        
        const updatedActivities = {
            ...currentActivities,
            playtime: {
                totalSeconds: 0,
                lastUpdated: new Date().toISOString(),
                lastSessionDuration: 0,
                sessionCount: 0
            }
        };

        const updateResult = updateAccount(identifier, { account_activities: updatedActivities });
        
        if (updateResult) {
            debugLog('✅ Playtime reset successfully');
            console.log('✅ Playtime reset for account:', account.name);
        } else {
            debugLog('❌ Failed to reset playtime');
        }
        
        return updateResult;
    },

    // Debug function to get current session info
    getSessionInfo() {
        const account = getSelectedAccount();
        const sessionInfo = {
            account: account?.name || 'None',
            sessionActive: !!sessionStart,
            sessionStart: sessionStart ? new Date(sessionStart).toISOString() : null,
            currentSessionTime: sessionStart ? Math.floor((Date.now() - sessionStart) / 1000) : 0,
            totalPlaytime: account ? getAccountPlaytime(account) : 0
        };
        
        debugLog('📋 Current session info:', sessionInfo);
        return sessionInfo;
    }
};

// Export debug function for testing
export function enableDebug(enabled = true) {
    DEBUG_PLAYTIME = enabled;
    debugLog(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
}