<script>
    // @ts-nocheck
    import SimpleTip from "../ui/SimpleTip.svelte";
    import { uiState } from "../../stores/ui";
    import { get } from "svelte/store";
    import {t, currentLocale } from '../../stores/i18n'

    $: buttons = [
        {
            label: $t('sidebar.buttons.play'),
            isDisabled: false,
            isActive: true,
            icon: '<i class="fa fa-circle-play"></i>',
            tabIndex: 'launch'
        },
        {
            label: $t('sidebar.buttons.mods'),
            isDisabled: true,
            isActive: false,
            icon: '<i class="fa fa-cube"></i>',
            tabIndex: 'mods'
        },
        {
            label: $t('sidebar.buttons.quickServers'),
            isDisabled: true,
            isActive: false,
            icon: '<i class="fa fa-bolt"></i>',
            tabIndex: 'quick-servers'
        }
    ];

    let activeIndex = 0;
    let inActiveTabs = ['console', 'acount-manager'];

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
        <img class="logo-light" src="images/logo/logo-light.svg" alt="Ori Launcher" />
        <img class="logo-dark" src="./images/logo/logo-dark.svg" alt="Ori Launcher" />
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