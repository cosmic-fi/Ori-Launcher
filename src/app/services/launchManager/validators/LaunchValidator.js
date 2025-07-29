// @ts-nocheck

/**
 * Validates launch options before sending to main process
 */
export class LaunchValidator {
    async validate(options) {
        const errors = [];

        // Validate account
        if (!options.authenticator) {
            errors.push('No account selected');
        } else if (options.authenticator.type === 'online' && !options.authenticator.access_token) {
            errors.push('Invalid online account credentials');
        }

        // Validate version
        if (!options.version) {
            errors.push('No Minecraft version selected');
        }

        // Validate paths
        if (!options.path) {
            errors.push('Minecraft directory not specified');
        }

        // Validate memory settings
        if (options.memory) {
            const minMem = parseInt(options.memory.min);
            const maxMem = parseInt(options.memory.max);
            
            if (minMem >= maxMem) {
                errors.push('Minimum memory must be less than maximum memory');
            }
            
            if (maxMem > await this._getSystemMemory()) {
                errors.push('Maximum memory exceeds system memory');
            }
        }

        // Validate screen resolution
        if (options.screen && !options.screen.fullscreen) {
            if (options.screen.width < 854 || options.screen.height < 480) {
                errors.push('Screen resolution too small (minimum 854x480)');
            }
        }

        return {
            isValid: errors.length === 0,
            error: errors.join(', '),
            errors
        };
    }

    async _getSystemMemory() {
        try {
            return await window.electron.getSystemMemory();
        } catch (error) {
            console.error('Failed to get system memory:', error);
        }
    }
}