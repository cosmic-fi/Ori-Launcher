<script>
// @ts-nocheck
import { onMount } from 'svelte';
import axios from 'axios';

import SimpleTip from "../ui/SimpleTip.svelte";
import { uiState, userAccountState, selectedAccountUsername, userBurst } from "../../stores/ui";
import Launch from '../ui/Launch.svelte';
import Console from '../ui/Console.svelte';
import AccountManager from '../ui/AccountManager.svelte';
import { fetchPlayerCounts } from "../../services/api";
import { formatNumber } from "../../utils/helper";
import { getSelectedAccount, refreshHasAccount } from '../../shared/user';
import { t } from '../../stores/i18n.js';
  import { launchStatus } from '../../stores/launch';
const { activeTab } = uiState;

let totalOnlinePlayers = 0;

const { hasAccount } = userAccountState;

const selectedAccount = getSelectedAccount();

onMount(async () => {
    refreshHasAccount();
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

function toggleConsole() {
    uiState.activeTab.set('console');
}
function toggleAccountManager(){
    uiState.activeTab.set('accountmanager');
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
                    <span class="isntance-minecraft" class:blink={$launchStatus === 'running'} class:idle={$launchStatus !== 'running'} class:running={$launchStatus === 'running'}></span>
                </div>
            </div>
            <div class="container-group">
                <div class="wrapper-group">
                    <SimpleTip text={$t("mainContent.minimize")} direction="bottom">
                        <button class="window-action-btn minimize-app-btn" aria-label={$t("mainContent.minimize")}> <i class="fa fa-minus"></i> </button>
                    </SimpleTip>
                </div>
                <div class="wrapper-group">
                    <SimpleTip text={$t("mainContent.closeApp")} direction="bottom">
                        <button class="window-action-btn exit-app-btn" aria-label={$t("mainContent.closeApp")}> <i class="fa fa-xmark"></i> </button>
                    </SimpleTip>
                </div>
            </div>
        </div>
        <div class="bottom-container">
            <div class="wrapper">
                <div class="left-wrapper">
                    {#if $activeTab === 'launch'}
                        <Launch />
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
                                {#if $userBurst}
                                    <div class="burst-container" style="background: url({$userBurst});"></div>
                                {:else}
                                    <div class="burst-container" style="background: url(https://minotar.net/bust/MHF_Steve/600.png);"></div>
                                {/if}
                                {#if $selectedAccountUsername}
                                    <div class="account-name-holder">{$selectedAccountUsername}</div>
                                {/if}
                            </div>
                            <div class="account-action-btn-container">
                                <button
                                    class="account-action-btn switch-account-btn"
                                    disabled={!$hasAccount}
                                    onclick={toggleAccountManager}
                                    >
                                {$t("mainContent.manageAccounts")}
                                </button>
                                <SimpleTip text={$t("mainContent.addAccount")} direction="bottom">
                                    <button onclick={() => uiState.toggleModel.set('accountadder')} class="account-action-btn add-account-btn" aria-label={$t("mainContent.addAccount")}> <i class="fa fa-plus"></i> </button>
                                </SimpleTip>
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
    .burst-container{
        width: 100% !important;
        background-repeat: no-repeat !important;
        background-position: bottom !important;
        background-size: 70% !important;
    }
    .console-btn-wrapper{
        background-color: orange;
        position: relative;
    }
    .isntance-minecraft{
        width: 8px;
        height: 8px;
        background-color: orange;
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

</style>