// @ts-nocheck
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { Launch } from 'ori-mcc';
import { getSelectedAccount } from '../shared/user';
import { settings } from '../stores/settings';

const launchThread = new Launch();
export class GameLauncher extends EventEmitter {
    constructor() {
        super();
    }

    async launch() {
        try {
            this.emit('state', 'preparing');
            const account = getSelectedAccount();
            const settings = settings;
            let gameAccount = account;

            // if (account.meta.type !== 'cracked') {
            //     gameAccount = await this._refreshAccount(account);
            //     if (!gameAccount) return;
            // }

            // const isRunning = await this._isMinecraftRunning();
            // if (isRunning) {
            //     this.emit('error', new Error('Minecraft is already running.'));
            //     return;
            // }

            // const options = this._buildOptions(gameAccount, settings[0]);
            // this.emit('state', 'launching', options);

            // // Replace this with your actual launch logic
            // launchThread.Launch(options);

            // // Example: Forward launchThread events
            // launchThread.on('extract', e => this.emit('extract', e));
            // launchThread.on('progress', (progress, size, element) => this.emit('progress', progress, size, element));
            // launchThread.on('check', (progress, size, element) => this.emit('check', progress, size, element));
            // launchThread.on('estimated', time => this.emit('estimated', time));
            // launchThread.on('speed', speed => this.emit('speed', speed));
            // launchThread.on('patch', patch => this.emit('patch', patch));
            // launchThread.on('data', e => this.emit('data', e));
            // launchThread.on('close', code => this.emit('close', code));
            // launchThread.on('error', err => this.emit('error', err));
        } catch (err) {
            this.emit('error', err);
        }
    }

    async _refreshAccount(account) {
        const fresh = await refreshAccount(account);
        if (fresh === 0) return null;
        return fresh;
    }

    _buildOptions(account, settings) {
        return {
            url: '',
            authenticator: account,
            timeout: 10000,
            path: this.appPath,
            version: localStorage.getItem('version_id'),
            detached: settings.launcher.launchDetached,
            intelEnabledMac: false,
            fullscreen: settings.minecraft.fullscreen,
            downloadFileMultiple: 10,
            loader: { type: '', build: 'latest', enable: false },
            verify: false,
            ignored: [
                'config', 'essential', 'logs', 'resourcepacks', 'saves', 'screenshots',
                'shaderpacks', 'W-OVERFLOW', 'options.txt', 'optionsof.txt'
            ],
            JVM_ARGS: [],
            GAME_ARGS: [],
            javaPath: null,
            screen: {
                width: settings.minecraft.resolution.width,
                height: settings.minecraft.resolution.height
            },
            memory: {
                min: `${settings.runtime.ram.min}G`,
                max: `${settings.runtime.ram.max}G`
            }
        };
    }

    _isMinecraftRunning() {
        return new Promise((resolve) => {
            exec('tasklist', (err, stdout) => {
                if (err) return resolve(false);
                const running = /javaw\.exe|minecraft\.exe|java\.exe/i.test(stdout);
                resolve(running);
            });
        });
    }
}