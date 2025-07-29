<script>
    // @ts-nocheck
    import { selectedAccountUsername, uiState, userAccountState, selectedAccount } from "../../stores/ui";
    import { getAppFolder, limitText, parseDate, rssURL, scrollHorizontal } from "../../utils/helper";
    import SimpleTip from "./SimpleTip.svelte";
    import { versions, selectedMajor, selectedVariant, selectedType, setSelectedVersion } from '../../shared/versionManager';
    import { onMount, onDestroy } from "svelte";
    import { fetchNews } from '../../services/api.js';
    import { flip } from "svelte/animate";
    import { t } from "../../stores/i18n";
    import { getSelectedAccount } from "../../shared/user";
    import { selectedVersionInfo } from "../../stores/version";
    import { settings } from "../../stores/settings";
    import { 
        isLaunching, 
        launchStatus, 
        launchProgress, 
        launchError,
        canLaunch,
        launchButtonText,
        launchActions 
    } from "../../stores/launch";
    import { logger } from "../../utils/logger";
    import { playtimeActions } from "../../stores/playtime"; // Add this import

    let rssFeed = [];
    let { hasAccount } = userAccountState;
    let cleanupFunctions = [];

    onMount(async () => {
        let feed = await fetchNews();
        rssFeed = (await fetchNews()).sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(rssFeed);
        setupLaunchListeners();
    });
    
    onDestroy(() => {
        // Clean up event listeners
        cleanupFunctions.forEach(cleanup => cleanup());
        window.electron.removeAllLaunchListeners?.();
    });

    function getRssClass(tags) {
        const lowerTags = tags?.map(tag => tag.toLowerCase()) || [];
        if (lowerTags.includes('update')) return 'btn-rss-update';
        if (lowerTags.includes('feature')) return 'btn-rss-announcement';
        return 'btn-rss-news';
    }

    async function handleLaunchGame(params) {
        if ($isLaunching) {
            console.log('Launch already in progress, ignoring click');
            return;
        }
        
        if (!$selectedAccountUsername) {
            if ($hasAccount) {
                uiState.activeTab.set('accountmanager');
            } else {
                uiState.toggleModel.set('accountadder');
            }
            return;
        }

        try {
            // Start new log session for this launch
            await logger.startSession();
            
            launchActions.setLaunching(true);
            launchActions.setStatus('preparing');

            let launchOptions = {
                url: null,
                authenticator: getSelectedAccount(),
                timeout: 10000,
                path: $settings.storage.directories.minecraftFolder.value,
                version: $selectedVariant,
                detached: $settings.game.runtime.runDetached.value || false,
                downloadFileMultiple: 10,
                intelEnabledMac: $settings.game.runtime.intelEnabledMac.value || false,
                loader: {
                    enable: false,
                    type: '',
                    version: '',
                },
                verify: $settings.game.runtime.verifyGameFiles.value,
                ignored: $settings.game.runtime.ignored.value,
                javaPath: $settings.game.runtime.javaPath.value === '' ? null : $settings.game.runtime.javaPath.value,
                JVM_ARGS: $settings.game.runtime.JVMArgs.value.split(' ') || [],
                GAME_ARGS: $settings.game.runtime.gameArgs.value.split(' ') || [],
                screen: {
                    fullscreen: $settings.game.resolution.fullscreen.value || false,
                    width: $settings.game.resolution.width.value,
                    height: $settings.game.resolution.height.value
                },
                memory: {
                    min: `${$settings.game.performance.ramAllocation.min.value}G`,
                    max: `${$settings.game.performance.ramAllocation.max.value}G`
                }
            };

            const result = await window.electron.launchGame(launchOptions);
            if (!result.success) {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Launch failed:', error);
            launchActions.setError(error.message || 'Launch failed');
            // End session on launch failure
            await logger.endSession();
        }
    }

    function setupLaunchListeners() {
        // Listen for launch progress
        window.electron.onLaunchProgress?.((progress) => {
            console.log('Launch progress:', progress);
            launchActions.setStatus('downloading');
            launchActions.setLaunching(true);
            launchActions.setProgress(progress);
        });
        
        // Listen for launch data
        window.electron.onLaunchData?.((data) => {
            launchActions.setStatus('running');
            console.log('Launch data:', data);
        });
        
        // Listen for launch complete
        window.electron.onLaunchComplete?.((data) => {
            logger.info('=============================\nLaunch completed:===========================\n', data);
            launchActions.setStatus('running');
            launchActions.setLaunching(true);
            playtimeActions.startSession();
        });
        
        // Listen for launch errors
        window.electron.onLaunchError?.(async (error) => {
            console.error('Launch error:', error);
            // launchActions.setError(error);
            await window.electron.cancelLaunch();
        });
        
        // Listen for extract events
        window.electron.onLaunchExtract?.((data) => {
            console.log('Extracting:', data);
            launchActions.setStatus('extracting');
        });
        
        // Listen for check events
        window.electron.onLaunchCheck?.((data) => {
            console.log('Verifying:', data);
            launchActions.setStatus('verifying');
        });

        // Listen for game close
        window.electron.onLaunchClose?.((code) => {
            console.log('Game closed with code:', code);
            launchActions.reset();
            // End log session when game closes
            logger.endSession();
            playtimeActions.endSession();
        });

        // Listen for launch cancelled
        window.electron.onLaunchCancelled?.((message) => {
            console.log(message);
            launchActions.reset();
            // End session on cancellation
            logger.endSession();
            playtimeActions.stopSession();
        });
    }
</script>

<div class="launch-news-container">
    <div class="launch-container">
        <h2>Minecraft {$selectedMajor}</h2>
        <div class="version-tag">
            {$selectedVariant}&nbsp;{$selectedType.charAt(0).toUpperCase() + $selectedType.slice(1)}
        </div>
        <div class="version-summery">&nbsp;</div>
        <div class="launch-btn-container" class:busy-btn={$isLaunching}>
            <button 
                on:click={handleLaunchGame}
                class="launch-btn"
                class:launching={$isLaunching}
                class:error={$launchStatus === 'error'}
                disabled={!$canLaunch}
            >
                <span class="version-label">
                    {#if $isLaunching}
                        {$launchStatus === 'running' ? $launchStatus : 'Launching'}
                    {:else}
                        {$t('launch.launch')} {$selectedVariant}
                    {/if}
                </span>
                <span class="launch-status" class:blink={$isLaunching}>
                    {#if $launchStatus === 'ready'}
                        Game Ready
                    {:else}
                        {$launchButtonText}
                    {/if}
                </span>
                
                <!-- Progress bar for download progress -->
                {#if $launchProgress && $launchProgress.progress !== undefined}
                    <div class="progress-bar">
                        <div 
                            class="progress-fill" 
                            style="width: {$launchProgress.progress}%"
                        ></div>
                    </div>
                {/if}
            </button>
            {#if $isLaunching}
                <SimpleTip text="{$launchStatus === 'running' ? $t('launch.closeGame') : $t('launch.cancel')}" direction="right">
                    <button 
                        class="version-change-btn launch-cancel-btn" 
                        aria-label="Change version"
                        on:click={async () => {
                            await window.electron.cancelLaunch();
                    
                        }}
                    >
                        <i class="fa fa-stop"></i>
                    </button>
                </SimpleTip>
            {:else}
                <SimpleTip text="{$t('launch.changeVersion')}" direction="right">
                    <button 
                        on:click={() => {uiState.toggleModel.set('versionselector')}}
                        class="version-change-btn" 
                        aria-label="Change version"
                        disabled={$isLaunching}
                    >
                        <i class="fa fa-right-left"></i>
                    </button>
                </SimpleTip>
            {/if}
            
        </div>
    </div>
    <div class="bottom-group">
        <div class="rss-wrapper">
            <div class="wrapper">
            <div class="-rx" use:scrollHorizontal>
                <div class="scroll-container">
                    {console.log(rssFeed)}
                    {#each rssFeed.slice(0, 3) as rss, index}
                        <div class="rss-card-container ">
                            <div class="thumbnail" style="background-image: url({rss.thumbnail});"></div>
                            <div class="rss-title-container">
                                <span use:limitText={{size: 40}}>{rss.title}</span>
                                <a
                                    href="{rssURL}/post?id={rss.id}"
                                    class="redirect-btn {getRssClass(rss.tags)}"
                                    aria-label="rss-btn"
                                >
                                    <i class="fa fa-arrow-up-right-from-square"></i>
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            </div>
        </div>
    </div>
</div>
<style>
    .launch-btn {
        transition: all 0.3s ease;
    }
    
    .launch-btn.launching {
        opacity: 0.9;
        cursor: not-allowed;
    }
    
    .launch-cancel-btn{
        font-size: 1.4rem;
        opacity: 1 !important;
    }
    .launch-btn.error {
        background-color: #dc3545;
        border-color: #dc3545;
    }
    
    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 0 0 4px 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background-color: #28a745;
        transition: width 0.3s ease;
    }
    
    .version-change-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>

