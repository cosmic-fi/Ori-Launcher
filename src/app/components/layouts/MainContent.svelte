<script>
// @ts-nocheck
import { onMount, onDestroy } from 'svelte';
import axios from 'axios';

import SimpleTip from "../ui/SimpleTip.svelte";
import { uiState, showToast } from "../../stores/ui";
import { selectedAccountUsername, userBurst, userAccountState, hasAnyAccount } from "../../stores/account";
import Launch from '../ui/Launch.svelte';
import Console from '../ui/Console.svelte';
import AccountManager from '../ui/AccountManager.svelte';
import { fetchPlayerCounts } from "../../services/api";
import { formatNumber } from "../../utils/helper";
import { getDefaultSkin } from '../../shared/user';
import { t } from '../../stores/i18n.js';
import { isLaunching, launchActions, launchStatus } from '../../stores/launch';
import { logger } from '../../utils/logger';

import { discordRPCManager } from '../../utils/discordRPCManager.js';
import { notificationService } from '../../services/notificationService';
import InstanceManager from '../ui/InstanceManager.svelte';

const { activeTab } = uiState;
const { hasAccount } = userAccountState;
const defaultSkin = getDefaultSkin().urls.dungeons.bust;

let totalOnlinePlayers = 0;

// Store cleanup functions for event listeners
let cleanupFunctions = [];

// In the onMount function, initialize Discord RPC
onMount(async () => {
    console.log('[MAIN CONTENT] Component mounting');
    setupLaunchListeners();
    
    // Initialize Discord RPC
    await discordRPCManager.initialize();
    
    async function updatePlayers() {
        try {
            const servers = await fetchPlayerCounts();
            totalOnlinePlayers = servers.totalOnlinePlayers || 0;
        } catch (e) {
            console.log($t("mainContent.failedToLoadPlayers"));
        }
    }
    updatePlayers();
    const interval = setInterval(updatePlayers, 7000);

    return () => clearInterval(interval);
});

onDestroy(() => {
    console.log('[MAIN CONTENT] Component destroying - cleaning up listeners');
    console.log(`[MAIN CONTENT] Cleaning up ${cleanupFunctions.length} individual listeners`);
    
    // Clean up individual listeners
    cleanupFunctions.forEach((cleanup, index) => {
        if (typeof cleanup === 'function') {
            console.log(`[MAIN CONTENT] Executing cleanup function ${index + 1}`);
            cleanup();
        }
    });
    cleanupFunctions = [];
    
    // Also remove all launch listeners from preload as backup
    console.log('[MAIN CONTENT] Calling removeAllLaunchListeners as backup');
    window.electron.removeAllLaunchListeners?.();
});

function toggleConsole() {
    uiState.activeTab.set('console');
}

function toggleAccountManager(){
    uiState.activeTab.set('accountmanager');
}

function setupLaunchListeners(){
    console.log(`[MAIN CONTENT] Cleaning up ${cleanupFunctions.length} existing listeners`);
    cleanupFunctions.forEach(cleanup => {
        if (typeof cleanup === 'function') {
            cleanup();
        }
    });
    cleanupFunctions = [];
    
    // Also clear all listeners via preload as backup
    window.electron.removeAllLaunchListeners?.();
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
        console.log(`${$t("logs.debugger.addingEventListeners")}`);
        
        // Set up listeners and store their cleanup functions
        const dataHandler = (data) => {
            launchActions.setStatus('running');
            logger.info(`■ ${data}`);
            console.log(data);
        };
        const dataCleanup = window.electron.onLaunchData?.(dataHandler);
        if (dataCleanup) cleanupFunctions.push(dataCleanup);

        const progressHandler = (progress) => {
            console.log(progress)
            logger.warn(`▽ ${$t("mainContent.launch.launchStatus.downloading")} ${progress.element}.... ${(progress.progress/progress.size * 100).toFixed(2)}%`)
            launchActions.setStatus('downloading');
            launchActions.setLaunching(true);
            discordRPCManager.setDownloadingActivity(progress.percentage || 0);
        };
        const progressCleanup = window.electron.onLaunchProgress?.(progressHandler);
        if (progressCleanup) cleanupFunctions.push(progressCleanup);

        
        // Update the launch event handlers to use notifications
        const completeHandler = (message) => {
            launchActions.setStatus('running');
            launchActions.setLaunching(true);
            
            // Update Discord RPC for playing
            discordRPCManager.setPlayingActivity();
            
            // Show launch success notification
            const version = get(selectedMajor);
            notificationService.showLaunchSuccess(version);
        };
        
        const errorHandler = async (error) => {
            logger.error(`※ ${error.error}`);
            console.log(error);
            if(error.recoverable){
                return;
            }else{
                if($isLaunching){
                    window.electron.cancelLaunch();
                    launchActions.reset();
                    await logger.endSession();
                }
            }
        };
        const errorCleanup = window.electron.onError?.(errorHandler);
        if (errorCleanup) cleanupFunctions.push(errorCleanup);

        const launchErrorHandler = async (error) => {
            console.log(error)
            launchActions.setError(error.message);

            if($isLaunching){
                window.electron.cancelLaunch();
                launchActions.reset();
                await logger.endSession();
            }
        };
        const launchErrorCleanup = window.electron.onLaunchError?.(launchErrorHandler);
        if (launchErrorCleanup) cleanupFunctions.push(launchErrorCleanup);

        const extractHandler = (data) => {
            logger.warn(`※ ${$t("mainContent.launch.launchStatus.extracting")} ... ${data}`);
            launchActions.setStatus('extracting');
        };
        const extractCleanup = window.electron.onLaunchExtract?.(extractHandler);
        if (extractCleanup) cleanupFunctions.push(extractCleanup);

        const checkHandler = (data) => {
            logger.warn(`⁂ ${$t("mainContent.launch.launchStatus.verifying")} ... ${data}`);
            launchActions.setStatus('verifying');
        };
        const checkCleanup = window.electron.onLaunchCheck?.(checkHandler);
        if (checkCleanup) cleanupFunctions.push(checkCleanup);

        const closeHandler = async (code) => {
            launchActions.reset();
            await logger.endSession();
            
            discordRPCManager.setIdleActivity();
        };
        const closeCleanup = window.electron.onLaunchClose?.(closeHandler);
        if (closeCleanup) cleanupFunctions.push(closeCleanup);
        
        const cancelHandler = (data) => {
            logger.info(`ൠ ${data.message}`);
            launchActions.reset();
        };
        const cancelCleanup = window.electron.onLaunchCancelled?.(cancelHandler);
        if (cancelCleanup) cleanupFunctions.push(cancelCleanup);
        console.log(`${$t("logs.debugger.eventSetupComplete")} ${cleanupFunctions.length}`);
    }, 50);
}
</script>

<div class="main-content">
    <div class="drag-bar"></div>
    <div class="wrapper">
        <div class="top-container">
            <div class="container-group">
                <div class="wrapper-group">
                    <div class="wrapper-item-group social-group">
                        <SimpleTip text={$t("mainContent.social.github")} direction="bottom"><a href="https://https://github.com/cosmic-fi/ori-launcher" class="social-item" aria-label={$t("social.github")}> <i class="fa-brands fa-github"></i></a></SimpleTip>
                        <SimpleTip text={$t("mainContent.social.discord")} direction="bottom"><a href="https://" class="social-item" aria-label={$t("social.discord")}> <i class="fa-brands fa-discord"></i></a></SimpleTip>
                        <SimpleTip text={$t("mainContent.social.twitter")} direction="bottom"><a href="https://" class="social-item" aria-label={$t("social.twitter")}> <i class="fa-brands fa-twitter"></i></a></SimpleTip>
                    </div>
                    <div class="wrapper-item-group">
                        <i class="fa fa-earth-asia text-success"></i> {formatNumber(totalOnlinePlayers)} {$t("mainContent.playersOnline")}
                    </div>
                </div>
                <div class="wrapper-group">
                    <a aria-label="patreon" href="https://buymeacoffee.com/cosmic_fi" class="patreon-btn">
                        <i class="fa fa-heart"></i>{$t("mainContent.supportProject")}
                    </a>
                </div>
                <div class="wrapper-group console-btn-wrapper">
                    <SimpleTip text={$t("mainContent.console")} direction="bottom">
                        <button onclick={toggleConsole} aria-label={$t("mainContent.console")}> <i class="fa fa-terminal"></i>
                        </button>
                    </SimpleTip>
                    <span 
                        class="isntance-minecraft" 
                        class:blink={$launchStatus !== 'ready'} class:idle={$launchStatus !== 'running'}
                        class:launching={$launchStatus !== 'running' && $launchStatus !== 'ready'} class:running={$launchStatus === 'running'}></span>
                </div>
            </div>
            <div class="container-group">
                <div class="wrapper-group">
                    <SimpleTip text={$t("mainContent.minimize")} direction="bottom">
                        <button 
                            class="window-action-btn minimize-app-btn" 
                            aria-label={$t("mainContent.minimize")}
                            onclick={async () => {
                                await window.electron.minimizeApp()
                            }}
                            > <i class="fa fa-minus"></i> </button>
                    </SimpleTip>
                </div>
                <div class="wrapper-group">
                    <SimpleTip text={$t("mainContent.closeApp")} direction="bottom">
                        <button 
                            class="window-action-btn exit-app-btn" 
                            aria-label={$t("mainContent.closeApp")}
                            onclick={async() => {
                                await window.electron.closeApp()
                            }}                            
                            > <i class="fa fa-xmark"></i> </button>
                    </SimpleTip>
                </div>
            </div>
        </div>
        <div class="bottom-container">
            <div class="wrapper">
                <div class="left-wrapper">
                    {#if $activeTab === 'launch'}
                        <Launch />
                    {:else if $activeTab === 'instance-manager'}
                        <InstanceManager />
                    {:else if $activeTab === 'console'}
                        <Console />
                    {:else if $activeTab === 'accountmanager'}
                        <AccountManager />
                    {/if}
                </div>
                <div class="right-wrapper">
                    <div class="account-container">
                        <div class="wrapper">
                            <div class="skin-container">
                                <div class="burst-container" style="background: url({$userBurst || defaultSkin});"></div>
                                {#if $selectedAccountUsername}
                                    <div class="account-name-holder">{$selectedAccountUsername}</div>
                                {/if}
                            </div>
                            <div class="account-action-btn-container">
                                <button
                                    class="account-action-btn add-account-btn btn-accent"
                                    onclick={() => uiState.toggleModel.set('accountadder')}
                                    aria-label="Add account"
                                >
                                    <i class="fa fa-plus"></i>
                                    {$t("mainContent.addAccount")}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="m-container ads-box">
                        <div class="wrapper" id="ad-container">
                        </div>
                        <span class="ad-credit"><a href="https://github.com/cosmic-fi/beam-i">{$t('mainContent.adCredit')}</a></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .main-content {
        min-width: calc(100% - 5.5rem);
        width: calc(100% - 5.5rem);
        max-width: calc(100% - 5.5rem);
        display: flex;
        flex-direction: column;
        position: relative;

        .drag-bar {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5rem;
            z-index: 0;
            -webkit-app-region: drag;
        }

        .wrapper {
            z-index: 1;
            flex-grow: 1;
            padding: 1.5vw;
            display: flex;
            row-gap: 1.5vw;
            flex-direction: column;

            .top-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                -webkit-app-region: drag;
                
                .container-group {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    column-gap: .8vw;
                    -webkit-app-region: no-drag;

                    .wrapper-group {
                        background-color: var(--base-variant);
                        border: 2px var(--border-color) solid;
                        border-radius: var(--border-radius-10);
                        display: flex;
                        flex-direction: row;
                        align-items: center;

                        .social-group {
                            column-gap: 2vw !important;
                            padding-inline: 2vw !important;
                            align-items: center;
                            justify-content: center;
                            border-right: 2px solid var(--border-color);
                        }

                        .wrapper-item-group {
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            justify-content: center;
                            padding: .8vw 2vw;
                            column-gap: .5vw;
                            font-size: var(--font-size-fluid-sm);
                            color: var(--text-color);

                            i {
                                font-size: var(--font-size-fluid-base);
                            }

                            .social-item {
                                color: var(--text-color-75);

                                i {
                                    font-size: var(--font-size-fluid-xl) !important;
                                }

                                &:hover {
                                    color: var(--text-color);
                                }

                                &:active {
                                    color: var(--text-color-75);
                                }
                            }

                            a {
                                text-decoration: none;

                                &:hover {
                                    color: var(--text-color) !important;
                                }

                                &:focus {
                                    color: var(--text-color);
                                }
                            }
                        }

                        .patreon-btn {
                            padding: 1vw 2vw;
                            display: flex;
                            flex-direction: row;
                            column-gap: 1.2vw;
                            align-items: center;
                            font-size: var(--font-size-fluid-base);
                            font-family: inherit;
                            color: var(--pink);
                            text-shadow: 0 0 10px var(--pink-25);
                            transition: all 0.2s ease-in-out;

                            &:hover {
                                color: var(--pink-50);
                            }

                            &:active {
                                color: var(--pink);
                            }
                        }

                        .window-action-btn {
                            padding: 1.2vw 1.3vw;
                            font-size: var(--font-size-fluid-base);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            color: var(--text-color);
                            transition: all 0.2s ease-in-out;

                            &:hover {
                                color: var(--text-color-75);
                            }

                            &:active {
                                color: var(--text-color);
                            }
                        }

                        .exit-app-btn {
                            &:hover {
                                color: var(--error-color) !important;
                            }

                            &:active {
                                color: var(--error-color-75) !important;
                            }
                        }

                        button {
                            padding: 1.3vw 1.2vw;
                            color: var(--text-color-75);

                            &:hover {
                                color: var(--text-color);
                            }

                            &:active {
                                color: var(--text-color-75);
                            }
                        }
                    }
                }
            }

            .bottom-container {
                flex-grow: 1;
                display: flex;

                .wrapper {
                    display: flex;
                    flex-direction: row;
                    column-gap: 1vw;
                    padding: 0;
                    flex-grow: 1;
                    overflow: hidden;

                    .left-wrapper {
                        display: flex;
                        flex-grow: 1;
                        overflow: hidden;
                    }

                    .right-wrapper {
                        display: flex;
                        flex-direction: column;
                        row-gap: 1vw;
                        max-width: 23vw;
                        width: 23vw;
                        min-width: 23vw;

                        .account-container {
                            display: flex;

                            .wrapper {
                                display: flex;
                                flex-direction: column;
                                background-color: var(--base-variant);
                                border-radius: var(--border-radius-20);
                                flex-grow: 1;
                                border: 2px var(--border-color) solid;
                                padding: 1.2vw;
                                row-gap: 1.2vw !important;
                                overflow: hidden;

                                .skin-container {
                                    width: 20vw;
                                    height: 18vw;
                                    flex-grow: 1;
                                    border-bottom: 2px var(--border-color) solid;
                                    position: relative;
                                    display: flex;
                                    justify-content: center;

                                    .account-name-holder {
                                        position: absolute;
                                        top: .3vw;
                                        padding: .5vw 3vw;
                                        color: var(--text-color);
                                        font-size: .8rem;
                                        text-shadow: 2px 2px 3px var(--shadow-color-10);
                                        font-family: 'Minecraft';
                                    }
                                }

                                .account-action-btn-container {
                                    display: flex;
                                    flex-direction: row;
                                    column-gap: 1vw;

                                    .account-action-btn {
                                        background-color: var(--accent-color-25);
                                        font-size: var(--font-size-fluid-base);
                                        padding: .8vw;
                                        color: var(--accent-color);
                                        border-radius: var(--border-radius-10);
                                        border: 2px transparent solid;


                                    }

                                    .add-account-btn {
                                        flex-grow: 1;
                                        padding-inline: 1.2vw;
                                        background-color: var(--accent-color);
                                        color: var(--text-color);
                                        display: flex;
                                        flex-direction: row;
                                        align-items: center;
                                        justify-content: center;
                                        column-gap: 1em;
                                        &:hover {
                                            background-color: var(--accent-color-dark) !important;
                                            border: 2px var(--accent-color-light) solid;
                                        }

                                        &:active {
                                            background-color: var(--accent-color-25);
                                            border: 2px transparent solid;
                                        }
                                    }
                                }
                            }
                        }
                        .ads-box {
                            flex-grow: 1;
                            color: var(--text-color-75);
                            overflow: hidden;
                            position: relative;

                            .wrapper{
                                background-color: var(--base-variant-1);
                                border-radius: var(--border-radius-10);
                                overflow: hidden;
                                display: flex;
                                justify-content: center;
                                position: relative;
                                background-image: url('https://i.ibb.co/B5P8DGT5/create-a-minecraft-themed-post.jpg');
                                background-position: center;
                                background-size: 100%;

                                a{
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    overflow: hidden;

                                    img{
                                        height: 100%;
                                        width: 100%;
                                        object-fit: cover;
                                    }
                                }
                            }
                            span{
                                position: absolute;
                                bottom: 1.5vw;
                                right: 1.5vw;
                                z-index: 1;
                                background-color: var(--base-variant-1);
                                border-radius: var(--border-radius-5);
                                color: var(--text-color-75);
                                padding: .4vw 1vw;
                                font-size: var(--font-size-fluid-sm);

                                text-shadow: 1px 2px 5px var(--shadow-color);
                                a{
                                    text-decoration: none;
                                    color: var(--info-color);
                                    cursor: pointer;
                                    font-weight: bold;

                                    &:hover{
                                        text-decoration: underline;
                                    }
                                    &:active{
                                        text-decoration: none;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    .burst-container{
        width: 100% !important;
        background-repeat: no-repeat !important;
        background-position: bottom !important;
        background-size: 70% !important;
    }
    .console-btn-wrapper{
        position: relative;
    }
    .isntance-minecraft{
        width: 8px;
        height: 8px;
        position: absolute;
        bottom: 5px;
        right: 5px;
        border-radius: 10px;
    }

    .isntance-minecraft.idle{
        background-color: gray;
    }
    .isntance-minecraft.running{
        background-color: var(--success-color);
    }
    .isntance-minecraft.launching{
        background-color: var(--warning-color);
    }
</style>