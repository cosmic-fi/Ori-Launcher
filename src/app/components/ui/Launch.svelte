<script>
    // @ts-nocheck
    import { selectedAccountUsername, userAccountState, selectedAccount } from "../../stores/account";
    import { uiState, showToast } from "../../stores/ui";
    import { getAppFolder, limitText, parseDate, rssURL, scrollHorizontal } from "../../utils/helper";
    import SimpleTip from "./SimpleTip.svelte";
    import { versions, selectedMajor, selectedVariant, selectedType, setSelectedVersion, getLoaderConfig } from '../../shared/versionManager';
    import { onMount, onDestroy } from "svelte";
    import { fetchNews } from '../../services/api';
    import { flip } from "svelte/animate";
    import { t } from "../../stores/i18n";
    import { getSelectedAccount } from "../../shared/user";
    import { selectedVersionInfo } from "../../stores/version";
    import { settings } from "../../stores/settings";
    import { 
        isLaunching, 
        launchStatus, 
        launchError,
        canLaunch,
        launchButtonText,
        launchActions 
    } from "../../stores/launch";
    import { logger } from "../../utils/logger";
    import { discordRPCManager } from '../../utils/discordRPCManager.js';

    let rssFeed = [];
    let { hasAccount } = userAccountState;
    $: instanceType = [
        {
            id: 'vanilla',
            description: $t('instanceManager.version.versionTypes.vanilla.description')
        },
        {
            id: 'forge',
            description: $t('instanceManager.version.versionTypes.forge.description')
        },
        {
            id: 'fabric',
            description: $t('instanceManager.version.versionTypes.fabric.description')
        }
    ]
    $: currentType = $selectedType === 'release' ? 'vanilla': $selectedType;
    $: currentInstance = instanceType.find(type => type.id === currentType) || instanceType[0]
    onMount(async () => {
        let feed = await fetchNews();
        rssFeed = (await fetchNews()).sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(rssFeed);
    });

    function getRssClass(tags) {
        const lowerTags = tags?.map(tag => tag.toLowerCase()) || [];
        if (lowerTags.includes('update')) return 'btn-rss-update';
        if (lowerTags.includes('feature')) return 'btn-rss-announcement';
        return 'btn-rss-news';
    }

    // Update the handleLaunchGame function
    async function handleLaunchGame() {
        if ($isLaunching) {
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
            await logger.startSession();
            logger.success(`--------------------------------------------------------------------`)
            logger.success(`■ \n${new Date().toLocaleString()} : ${$t('mainContent.launch.launchStatus.preparing')} [ Minecraft - ${$selectedType} - ${$selectedVariant} ]\n`)
            logger.success(`--------------------------------------------------------------------`)
            launchActions.setLaunching(true);
            launchActions.setStatus('preparing');
            
            // Get loader configuration based on selected type
            const loaderConfig = getLoaderConfig($selectedType);
            
            let launchOptions = {
                url: null,
                authenticator: getSelectedAccount(),
                timeout: 10000,
                path: $settings.storage.directories.minecraftFolder.value,
                version: $selectedVariant,
                detached: $settings.game.runtime.runDetached.value,
                downloadFileMultiple: 10,
                intelEnabledMac: $settings.game.runtime.intelEnabledMac.value,
                loader: loaderConfig || { enable: false },
                verify: $settings.game.runtime.verifyGameFiles.value,
                ignored: $settings.game.runtime.ignored.value,
                javaPath: $settings.game.runtime.javaPath.value === '' ? null : $settings.game.runtime.javaPath.value,
                JVM_ARGS: $settings.game.runtime.JVMArgs.value.split(' ') || [],
                GAME_ARGS: $settings.game.runtime.gameArgs.value.split(' ') || [],
                screen: {
                    fullscreen: $settings.game.resolution.fullscreen.value,
                    width: $settings.game.resolution.width.value,
                    height: $settings.game.resolution.height.value
                },
                memory: {
                    min: `${$settings.game.performance.ramAllocation.min.value}G`,
                    max: `${$settings.game.performance.ramAllocation.max.value}G`
                }
            };
            await window.electron.launchGame(launchOptions);
        } catch (error) {
            launchActions.setError(error.message || 'Launch failed');
            showToast('Something went wrong while launching the game. Please try again later.', 'error');
            launchActions.reset();
        }
        
        // Reset Discord RPC to idle on error
        await discordRPCManager.setIdleActivity();
    }
    
</script>

<div class="launch-news-container">
    <div class="launch-container">
        <div class="version-major">
            <h2>Minecraft {$selectedType === 'forge' ? 'Forge' : $selectedType === 'fabric' ? 'Fabric' : 'Vanilla'}&nbsp;{$selectedMajor}</h2>
        </div>
        <div class="version-tag">
            {$selectedType === 'forge' ? 'MC' : $selectedType === 'fabric' ? 'Stable' : 'Release'}&nbsp;{$selectedVariant}
        </div>
        <div class="version-summery">
            {currentInstance.description}
        </div>
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
                        {$launchStatus === 'running' ? $launchStatus : $t('mainContent.launch.launching')}
                    {:else}
                        {$t('mainContent.launch.label')} {$selectedVariant}
                    {/if}
                </span>
                <span class="launch-status" class:blink={$isLaunching}>
                    {#if $launchStatus === 'ready'}
                        {$t('mainContent.launch.launchStatus.ready')}
                    {:else}
                        {$launchButtonText}
                    {/if}
                </span>
            </button>
            {#if $isLaunching}
                <SimpleTip text="{$launchStatus === 'running' ? $t('mainContent.launch.closeGame') : $t('mainContent.launch.cancel')}" direction="right">
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
            {/if}
        </div>
    </div>
    <div class="bottom-group">
        <div class="rss-wrapper">
            <div class="wrapper">
            <div class="-rx" use:scrollHorizontal>
                <div class="scroll-container">
                    {#if rssFeed.length === 0}
                        {#each Array(3) as _, i}
                            <div class="rss-card-container skeleton">
                                <div class="thumbnail skeleton-bg"></div>
                                <div class="rss-title-container">
                                    <span class="skeleton-text"></span>
                                    <div class="redirect-btn skeleton-btn"></div>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        {#each rssFeed.slice(0, 3) as rss, index}
                            <div class="rss-card-container">
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
                    {/if}
                </div>
            </div>
            </div>
        </div>
    </div>
</div>
<style>
    .launch-news-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        row-gap: 1vw;
        overflow: hidden;

        .launch-container {
            background-color: var(--base-variant);
            background: 
            linear-gradient(
                to right, 
                color-mix(in srgb, var(--base-variant-1), transparent 60%), 
                var(--base-color)
            );
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center auto;
            border-radius: var(--border-radius-20);
            border: 2px solid var(--border-color);
            padding: 2vw 2vw;
            display: flex;
            flex-direction: column;
            color: var(--text-color);
            row-gap: 1vw;
            align-items: start;
            flex-grow: 1;
            justify-content: space-between;
            color: var(--text-color-75);

            .version-major{
                display: flex;
                flex-direction: row;
                align-items: center;
                column-gap: 10px;
            }
            h2 {
                font-size: 2rem;
                color: var(--text-color);
            }

            .version-summery {
                font-size: var(--font-size-fluid-base);
                color: var(--text-color);
                height: 80px;
            }

            .version-tag {
                background-color: var(--base-color);
                padding: .2vw 1vw;
                color: var(--text-color);
                border-radius: var(--border-radius-5);
                font-size: var(--font-size-fluid-sm);
            }

            .launch-btn-container {
                display: flex;
                flex-direction: row;
                margin-top: 1vw;
                box-shadow: inset 0 0 0 3px #ffffff48;
                overflow: hidden;
                border-radius: var(--border-radius-10);
                background-color: var(--accent-color);
                transition: all .2s ease-in-out;

                button {
                    color: var(--on-accent-text);
                    display: flex;
                    flex-direction: column;
                    font-size: var(--font-size-fluid-lg);
                    font-weight: 500;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 10px transparent;
                    transition: all 0.2s ease-in-out;
                }

                .launch-btn {
                    padding: 1vw 4vw;
                    width: 15rem !important;
                    transition: all .2s ease !important;
                    text-shadow: 1px 1px 3px var(--base-variant-1-30);

                    .version-label {
                        font-weight: 800;
                        font-size: 1.3rem;
                        text-transform: uppercase;
                    }

                    .launch-status {
                        font-size: .99rem !important;
                        color: var(--on-accent-secondary);
                        font-weight: 500;
                        display: flex;
                        flex-direction: row !important;
                        text-transform: none !important;
                        text-align: center !important;
                        align-items: center !important;
                        column-gap: .4vw;
                    }
                }

                .version-change-btn {
                    padding: 1.2vw 1.5vw !important;
                    background-color: #0000002d;
                    box-shadow: none;
                    color: var(--on-accent-text);
                    font-size: 1.23rem;
                    flex-grow: 1;
                    font-weight: 600;

                    &:hover {
                        background-color: #0000003d;
                    }
                }

                &:hover{
                    background-color: var(--accent-color-dark);
                }
            }
            .busy-btn{
                background: linear-gradient(to bottom, #DB4437 50%, #fd4343);
            }
        }
        .bottom-group {
            flex-grow: 1;
            display: flex;
            overflow: hidden;
            max-height: 15rem !important;
            position: relative;
            border-radius: var(--border-radius-20);

            .rss-wrapper {
                display: flex;
                flex-direction: row;
                border-radius: var(--border-radius-20);
                border: 2px var(--border-color) solid;
                background-color: var(--base-variant);
                padding: 1vw 1.2vw;
                overflow: hidden;
                flex-grow: 1;
                -ms-overflow-style: none;
                scrollbar-width: none;
                position: relative;

                .wrapper {
                    display: flex;
                    flex-direction: row;
                    overflow: hidden;
                    border-radius: var(--border-radius-10);
                    position: relative;

                    .-rx {
                        display: flex;
                        flex-direction: row;
                        overflow: hidden;
                        overflow-x: auto;
                        scrollbar-width: 0 !important;
                        scroll-snap-type: proximity;

                        .scroll-container {
                            display: flex;
                            flex-direction: row;
                            column-gap: 1vw;

                            .rss-card-container {
                                background-color: var(--base-color);
                                display: flex;
                                flex-direction: column;
                                width: 25vw;
                                border-radius: var(--border-radius-10);
                                overflow: hidden;
                                justify-content: space-between;
                                transition: all .3s ease;
                                .thumbnail {
                                    background-size: cover;
                                    background-position: center;
                                    height: auto;
                                    aspect-ratio: 19/6;
                                    flex-grow: 1;
                                }

                                .rss-title-container {
                                    background-color: var(--base-color);
                                    display: flex;
                                    padding: 1vw;
                                    color: var(--text-color-75);
                                    font-size: var(--font-size-fluid-lg);
                                    flex-direction: row;
                                    justify-content: space-between;
                                    column-gap: 1.4vw;
                                    align-items: center !important;
                                    line-height: 1.2rem;

                                    .redirect-btn {
                                        background-color: var(--base-variant);
                                        color: var(--text-color-50);
                                        font-size: var(--font-size-fluid-base);
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        padding: 1vw;
                                        width: 2vw;
                                        max-height: 2vw;
                                        min-width: 2vw;
                                        min-height: 2vw;
                                        max-width: 2vw;
                                        height: 2vw;
                                        border-radius: var(--border-radius-5);

                                        &:hover {
                                            opacity: .8;
                                        }

                                        &:active {
                                            opacity: 1;
                                        }
                                    }

                                    .btn-rss-update {
                                        background-color: var(--warning-color-25);
                                        color: var(--warning-color);
                                    }

                                    .btn-rss-announcement {
                                        background-color: var(--accent-color-25);
                                        color: var(--accent-color);
                                    }

                                    .btn-rss-news {
                                        background-color: var(--info-color-25);
                                        color: var(--info-color);
                                    }
                                }

                                &:hover{
                                    transform: scale(1.01);
                                }
                            }
                        }

                        &::-webkit-scrollbar {
                            display: none !important;
                            width: 0px !important;
                        }
                    }
                }
            }
        }
    }
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
    .seperator{
        opacity: .7;
        color: var(--border-color)
    }
</style>

