// @ts-nocheck

/**
 * Manages launch state and transitions
 */
export class LaunchStateManager {
    constructor(launcher) {
        this.launcher = launcher;
        this.currentState = 'idle';
        this.stateHistory = [];
        this.stateData = {};
    }

    setState(state, data = null) {
        const previousState = this.currentState;
        
        // Validate state transition
        if (!this._isValidTransition(previousState, state)) {
            console.warn(`Invalid state transition: ${previousState} -> ${state}`);
            return false;
        }

        // Update state
        this.stateHistory.push({
            from: previousState,
            to: state,
            timestamp: Date.now(),
            data
        });
        
        this.currentState = state;
        this.stateData = data || {};
        
        // Emit state change
        this.launcher.emit('state', state, data);
        
        return true;
    }

    getState() {
        return {
            current: this.currentState,
            data: this.stateData,
            history: [...this.stateHistory]
        };
    }

    isState(state) {
        return this.currentState === state;
    }

    canTransitionTo(state) {
        return this._isValidTransition(this.currentState, state);
    }

    _isValidTransition(from, to) {
        const validTransitions = {
            'idle': ['preparing', 'error'],
            'preparing': ['launching', 'error', 'cancelled'],
            'launching': ['downloading', 'extracting', 'verifying', 'starting', 'completed', 'error', 'cancelled'],
            'downloading': ['extracting', 'verifying', 'starting', 'completed', 'error', 'cancelled'],
            'extracting': ['verifying', 'starting', 'completed', 'error', 'cancelled'],
            'verifying': ['starting', 'completed', 'error', 'cancelled'],
            'starting': ['completed', 'error', 'cancelled'],
            'completed': ['idle'],
            'error': ['idle'],
            'cancelled': ['idle']
        };

        return validTransitions[from]?.includes(to) || false;
    }

    destroy() {
        this.stateHistory = [];
        this.stateData = {};
        this.launcher = null;
    }
}