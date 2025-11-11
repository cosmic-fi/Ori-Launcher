<script>
    // @ts-nocheck
    import SimpleTip from "../ui/SimpleTip.svelte";
    import { uiState } from "../../stores/ui";
    import { get } from "svelte/store";
    import {t, currentLocale } from '../../stores/i18n'
    import { hasAnyAccount } from "../../stores/account";

    $: buttons = [
        {
            label: $t('sidebar.buttons.home'),
            isDisabled: false,
            isActive: true,
            icon: '<i class="fa fa-home"></i>',
            tabIndex: 'launch'
        },
        {
            label: $t('sidebar.buttons.instanceManager'),
            isDisabled: false,
            isActive: false,
            icon: '<i class="fa fa-cube"></i>',
            tabIndex: 'instance-manager'
        },
        {
            label: $t('sidebar.buttons.accountManager'),
            isDisabled: !$hasAnyAccount,
            isActive: false,
            icon: '<i class="fa fa-user"></i>',
            tabIndex: 'accountmanager'
        }
    ];

    let activeIndex = 0;
    let inActiveTabs = ['console', 'accountmanager'];

    // Get all sidebar tabIndexes for comparison
    $: sidebarTabIndexes = buttons.map(btn => btn.tabIndex);

    // Subscribe to uiState.activeTab and update activeIndex accordingly
    $: {
        const unsubscribe = uiState.activeTab.subscribe(tab => {
            const idx = buttons.findIndex(btn => btn.tabIndex === tab);
            if (idx !== -1) {
                activeIndex = idx;
            } else {
                activeIndex = -1; // No sidebar button is active
            }
        });
    }

    function handleClick(btn, index){
        uiState.activeTab.set(btn.tabIndex);
        activeIndex = index;
    }
</script>

<div class="side-bar">
    <div class="brand">
        <img class="logo-light-primary" src="./images/logo/logo-primary.svg" alt="Ori Launcher" />
    </div>
    <div class="nav-btn-container">
        <div class="btn-group">
            {#each buttons as btn, index}
                <div class="nav-btn {index === activeIndex ? 'active' : ''}">
                    <div class="active-indicator"></div>
                    <SimpleTip text="{btn.label}" direction="right">
                        <button 
                            onclick={() => handleClick(btn, index)} 
                            class="btn-item" 
                            aria-label="{btn.label}" 
                            disabled={btn.isDisabled}>
                            {@html btn.icon}
                        </button>
                    </SimpleTip>
                </div>
            {/each}
        </div>
        <div class="btn-group">
            <div class="nav-btn" simple-tip="right" tip-text="Settings">
                <div class="active-indicator"></div>
                <SimpleTip text="{$t('sidebar.settings')}" direction="right">
                    <button class="btn-item" aria-label="Settings" onclick={() => uiState.toggleModel.set('settings')}><i class="fa fa-gear"></i></button>
                </SimpleTip>
            </div>
        </div>
    </div>
</div>

<style>
    .side-bar {
        min-width: 5.5;
        width: 5.5rem;
        max-width: 5.5rem;
        background-color: var(--surface-color);
        border-right: 2px solid var(--border-color);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        row-gap: 4vw;

        .brand {
            padding: 1rem;

            img {
                width: 100%;
            }
        }

        .nav-btn-container {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            row-gap: 20vh;
            padding: 4vh 0;
            flex-grow: 1;

            .btn-group {
                display: flex;
                flex-direction: column;
                row-gap: 1rem;

                .nav-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;

                    .active-indicator {
                        position: absolute;
                        left: 0;
                        width: .45rem;
                        display: none;
                        height: 2rem;
                        background-color: var(--accent-color);
                        border-radius: 0 var(--border-radius-10) var(--border-radius-10) 0;
                    }

                    .btn-item {
                        width: 3.5rem;
                        height: 3.5rem;
                        margin-left: .6vw;
                        background-color: var(--base-color);
                        border-radius: var(--border-radius-20);
                        color: var(--text-color-muted);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: var(--font-size-fluid-xl);
                        text-shadow: none;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;

                        &:hover {
                            background-color: var(--accent-color-overlay);
                            color: var(--accent-color);
                            text-shadow: none;
                        }

                        &:active {
                            background-color: var(--base-color);
                        }
                    }
                    [disabled]:hover{
                        color: var(--text-color-25) !important;
                        background-color: var(--base-color) !important;
                    }
                }

                .active {
                    .active-indicator {
                        display: flex;
                    }

                    .btn-item {
                        color: var(--accent-color);
                        font-size: var(--font-size-fluid-xl);
                    }
                }
            }
        }
    }
</style>