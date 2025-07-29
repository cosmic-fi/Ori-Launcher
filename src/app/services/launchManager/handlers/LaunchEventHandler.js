// @ts-nocheck

/**
 * Handles and processes launch events from main process
 */
export class LaunchEventHandler {
    constructor(launcher) {
        this.launcher = launcher;
        this.progressData = {
            current: 0,
            total: 0,
            speed: 0,
            eta: 0
        };
    }

    handleProgress(data) {
        const { type, progress, total, element, speed, eta } = data;
        
        this.progressData = {
            current: progress || 0,
            total: total || 0,
            speed: speed || 0,
            eta: eta || 0
        };

        // Emit specific progress events
        switch (type) {
            case 'download':
                this.launcher.emit('download-progress', {
                    progress,
                    total,
                    element,
                    speed,
                    eta,
                    percentage: total > 0 ? Math.round((progress / total) * 100) : 0
                });
                break;
                
            case 'extract':
                this.launcher.emit('extract-progress', {
                    progress,
                    total,
                    element,
                    percentage: total > 0 ? Math.round((progress / total) * 100) : 0
                });
                break;
                
            case 'verify':
                this.launcher.emit('verify-progress', {
                    progress,
                    total,
                    element,
                    percentage: total > 0 ? Math.round((progress / total) * 100) : 0
                });
                break;
                
            default:
                this.launcher.emit('progress', data);
        }
    }

    handleStateChange(state) {
        this.launcher.stateManager.setState(state.type, state.data);
        this.launcher.emit('state-change', state);
    }

    handleError(error) {
        this.launcher.stateManager.setState('error');
        this.launcher.emit('error', new Error(error.message || error));
    }

    handleComplete(data) {
        this.launcher.stateManager.setState('completed');
        this.launcher.emit('launch-complete', data);
    }

    getProgressData() {
        return { ...this.progressData };
    }

    destroy() {
        this.progressData = null;
        this.launcher = null;
    }
}