// @ts-nocheck
/**
 * @author Cosmic-fi
 * @description Auto-start manager for the Ori Launcher application.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutoStartManager {
    constructor() {
        this.registryKey = 'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';
        this.appName = 'OriLauncher';
        this.exePath = process.execPath;
    }

    /**
     * Enable auto-start for the application
     */
    async enable() {
        try {
            // Escape the executable path for registry
            const escapedPath = this.exePath.replace(/\\/g, '\\\\');
            
            // Add to Windows registry Run key
            const command = `reg add "${this.registryKey}" /v "${this.appName}" /t REG_SZ /d "${escapedPath}" /f`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.warn('Auto-start enable warning:', stderr);
            }
            
            console.log('Auto-start enabled successfully');
            return true;
        } catch (error) {
            console.error('Failed to enable auto-start:', error);
            return false;
        }
    }

    /**
     * Disable auto-start for the application
     */
    async disable() {
        try {
            // Remove from Windows registry Run key
            const command = `reg delete "${this.registryKey}" /v "${this.appName}" /f`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.warn('Auto-start disable warning:', stderr);
            }
            
            console.log('Auto-start disabled successfully');
            return true;
        } catch (error) {
            console.error('Failed to disable auto-start:', error);
            return false;
        }
    }

    /**
     * Check if auto-start is currently enabled
     */
    async isEnabled() {
        try {
            // Query the registry to check if the key exists
            const command = `reg query "${this.registryKey}" /v "${this.appName}"`;
            
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                // If the key doesn't exist, reg query returns error
                return false;
            }
            
            // If we get stdout, the key exists
            return stdout.includes(this.appName);
        } catch (error) {
            // Registry key not found error means auto-start is disabled
            if (error.code === 1) {
                return false;
            }
            console.error('Failed to check auto-start status:', error);
            return false;
        }
    }

    /**
     * Sync auto-start with current settings
     * @param {boolean} shouldBeEnabled - Whether auto-start should be enabled
     */
    async sync(shouldBeEnabled) {
        const currentlyEnabled = await this.isEnabled();
        
        if (shouldBeEnabled && !currentlyEnabled) {
            return await this.enable();
        } else if (!shouldBeEnabled && currentlyEnabled) {
            return await this.disable();
        }
        
        return true; // Already in correct state
    }
}

export default AutoStartManager;