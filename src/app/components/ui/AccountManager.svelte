<script>
// @ts-nocheck

    import SimpleTip from '../ui/SimpleTip.svelte';
    import SkinViewer from './SkinViewer.svelte';
    import { getAccounts, removeAccount, setSelectedAccount, getSelectedAccount, getSkinUrl, updateAccount } from '../../shared/user.js';
    import { limitText, slideX } from '../../utils/helper';
    import { showDialog, showToast, uiState } from '../../stores/ui';
    import { accountsStore, userAccountState } from '../../stores/account';
    import { t } from '../../stores/i18n';
    
    let accounts = $accountsStore;
    let { selectedAccountUuid } = userAccountState;
    let refreshingAccounts = new Set(); 

    const selectedAccount = getSelectedAccount();
    if (selectedAccount) {
        // Source of truth is the selectedAccount writable behind setSelectedAccount
        setSelectedAccount(selectedAccount.uuid);
    }

    // Remove handler
    function handleDelete(account) {
        showDialog({
            title: $t('accountManager.deleteAccountTitle'),
            message: $t('accountManager.deleteAccountMessage'),
            buttons: [
            { label: $t('accountManager.cancel'), type: "normal", action: () => {} },
            { label: $t('accountManager.delete'), type: "danger", action: () => { 
                removeAccount(account.uuid);
             } }
            ]
        });
    }

    // Select handler
    function handleSelect(account) {
        setSelectedAccount(account.uuid);
    }

    // Refresh account handler
    async function handleRefreshAccount(account) {
        const accountId = account.uuid || account.name;
        
        // Prevent multiple refresh attempts on the same account
        if (refreshingAccounts.has(accountId)) {
            return;
        }
        
        refreshingAccounts.add(accountId);
        refreshingAccounts = refreshingAccounts; // Trigger reactivity
        
        try {
            if (account.type === 'online') {
                // Refresh online account token
                const result = await window.electron.invoke('refresh-account', account);
                if (result.success) {
                    const updatedAccount = {
                        ...account,
                        access_token: result.mc.access_token,
                        refresh_token: result.extra.msToken.refresh_token,
                        client_id: result.mc.client_id,
                        user_properties: result.mc.user_properties,
                        profile: result.extra.profile
                    };
                    updateAccount(accountId, updatedAccount);
                    showToast($t('accountManager.accountRefreshedSuccessfully'), 'info');
                } else {
                    showToast($t('accountManager.accountRefreshFailed'), 'error');
                    console.error('Failed to refresh online account:', result.error);
                }
            };
            return;
        } catch (error) {
            console.error('Error refreshing account:', error);
        } finally {
            refreshingAccounts.delete(accountId);
            refreshingAccounts = refreshingAccounts; // Trigger reactivity
        }
    }
    
    $: accounts = $accountsStore;
    $: if(accounts.length === 0){
        uiState.activeTab.set('launch')
    }
</script>

<div class="m-container user-account-manager-container">
    <div class="container-header">
        <span class="title">{$t('accountManager.title')}</span>
        <div class="container-info-action">
            <span class="conntainer-description">
                {$t('accountManager.description')}
            </span>
        </div>
    </div>
    <div class="container-content">
        <div class="o-wrapper">
            <div class="account-list-container">
                <div class="i-wrapper">
                    {#each accounts as account, index}
                        <div
                            class="sliding-account-card account-card {$selectedAccountUuid === account.uuid ? 'active-card' : ''}">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="account-avatar-name-cont"
                                use:slideX={{ snapX: account.type === 'online' ? -130 : -65, threshold: -30 }}
                                style="z-index:1;"
                                on:click={(e) => {
                                    if (!e.currentTarget.wasDragged) handleSelect(account);
                                }}
                            >
                                <span class="account-avatar" style="background: url({getSkinUrl(account, 'pixel').face});background-size: contain"></span>
                                <div class="account-name-spec">
                                    <span class="account-name">
                                        {#if account.name.length >= 20}
                                            <SimpleTip text={account.name} direction="top">
                                                <span  use:limitText={{size: 20}}>{account.name}</span>
                                            </SimpleTip>
                                        {:else}
                                            <span>{account.name}</span>
                                        {/if}
                                        <span class="account-type">{account.type === 'online' ? $t('accountManager.minecraft') : $t('accountManager.cracked')}</span>

                                    </span>
                                </div>
                                <span class="check-mark"><i class="fa fa-circle-check"></i></span>
                            </div>
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="account-action-btn-cont hide" on:click|stopPropagation>
                                <SimpleTip text="{$t('accountManager.removeAccount')}" direction="bottom">
                                    <button 
                                        class="remove-btn"
                                        aria-label="{$t('accountManager.removeAccountAriaLabel')}" 
                                        on:click={() => {handleDelete(account)}}
                                        >
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </SimpleTip>
                                {#if account.type === 'online'}
                                    <span class="line"></span>
                                    <SimpleTip text="{$t('accountManager.refreshAccount')}" direction="bottom">
                                        <button
                                            class="refresh-btn {refreshingAccounts.has(account.uuid || account.name) ? 'refreshing' : ''}" 
                                            aria-label="{$t('accountManager.refreshAccount')}" 
                                            on:click={() => {handleRefreshAccount(account)}}
                                            disabled={refreshingAccounts.has(account.uuid || account.name)}
                                        >
                                            <i class="fa fa-rotate {refreshingAccounts.has(account.uuid || account.name) ? 'fa-spin' : ''}"></i>
                                        </button>
                                    </SimpleTip>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
        <div class="account-skin-view-container">
            <div class="skin-viewer">
                <SkinViewer />
            </div>
        </div>
    </div>
</div>
<style>
    .user-account-manager-container {
        overflow: hidden !important;
        flex-grow: 1;
        .container-content {
            display: flex;
            flex-direction: row;
            flex-grow: 1;
            display: flex;
            height: 10vh;
            padding: 1vw 0 .2vw 0;
            column-gap: 1vw;

            .o-wrapper {
                background-color: var(--overlay-color);
                display: flex;
                overflow: hidden !important;
                padding: 1vw .5vw;
                border-radius: var(--border-radius-10);
                border: 2px var(--border-color) solid;

                .account-list-container {
                    overflow: hidden !important;
                    border-radius: var(--border-radius-10);
                    padding-inline: .5vw;
                    overflow-y: auto !important;

                    .i-wrapper {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        row-gap: .5vw;

                        .account-card {
                            background-color: var(--overlay-color);
                            border-radius: var(--border-radius-5);
                            display: flex;
                            flex-direction: row;
                            justify-content: space-between;
                            position: relative;
                            overflow: hidden;
                            border: 1px solid var(--border-color);

                            .account-avatar-name-cont {
                                display: flex;
                                flex-direction: row;
                                align-items: center;
                                column-gap: 1vw;
                                background-color: var(--overlay-color-1);
                                padding: 1vw;
                                width: 29vw;
                                z-index: 1;
                                border-radius: var(--border-radius-4);
                                cursor: pointer;
                                transition: all .2s ease !important;
                                position: relative;

                                .account-avatar {
                                    width: 3rem;
                                    height: 3rem;
                                    background-color: var(--overlay-color-2);
                                    border-radius: var(--border-radius-4);
                                    background-size: cover;
                                    background-position: center;
                                    background-repeat: no-repeat;
                                }

                                .account-name-spec {
                                    display: flex;
                                    flex-direction: column;
                                    row-gap: .5vw;

                                    .account-name {
                                        color: var(--text-color);
                                        font-size: var(--font-size-fluid-base);
                                        display: flex;
                                        flex-direction: column;
                                        align-items: start;
                                        justify-content: start;
                                        column-gap: .5vw;

                                        .account-type {
                                            font-size: var(--font-size-fluid-sm);
                                            background-color: var(--overlay-color-3);
                                            padding-inline: .5vw;
                                            color: var(--text-color);
                                            border-radius: var(--border-radius-4);
                                        }
                                    }
                                }

                                .check-mark {
                                    position: absolute;
                                    display: none;
                                    right: 1.5vw;
                                    font-size: 1.3rem;
                                    color: var(--accent-color-light);
                                }

                                &:hover {
                                    background-color: var(--overlay-color-2);
                                }

                                &:active {
                                    background-color: var(--overlay-color-2);
                                }
                            }

                            .account-action-btn-cont {
                                background-color: var(--base-variant-2);
                                height: 100%;
                                position: absolute;
                                border-radius: var(--border-radius-5);
                                right: 0;
                                width: 300px;
                                display: flex;
                                top: 0;
                                flex-direction: row;
                                column-gap: 10px;
                                justify-content: end;
                                align-items: center;
                                color: var(--on-accent-text);
                                padding-right: 14px;

                                .line{
                                    width: 1px;
                                    height: 40%;
                                    background-color: var(--border-color);
                                }
                                .refresh-btn{
                                    background-color: var(--accent-color);
                                    color: var(--text-color);
                                    padding: 10px 12px;
                                    font-size: 1rem;
                                    text-shadow: 2px 2px 4px #0000002f;
                                    border-radius: var(--border-radius-5);
                                    transition: opacity 0.2s ease;

                                    &:hover:not(:disabled) {
                                        opacity: .8;
                                    }

                                    &:active:not(:disabled) {
                                        opacity: 1;
                                    }

                                    &:disabled {
                                        opacity: 0.5;
                                        cursor: not-allowed;
                                    }

                                    &.refreshing {
                                        pointer-events: none;
                                    }
                                }
                                .remove-btn {
                                    padding: 10px 12px;
                                    font-size: 1rem;
                                    border-radius: var(--border-radius-5);
                                    text-shadow: 2px 2px 4px #0000002f;
                                    background-color: var(--error-color);

                                    &:hover {
                                        opacity: .8;
                                    }

                                    &:active {
                                        opacity: 1;
                                    }
                                }
                            }

                        }

                        .active-card {
                            .account-avatar-name-cont {
                                background-color: var(--base-variant-3);
                                box-shadow: inset 0 0 0 3px var(--accent-color-light), inset 0 0 0 100px var(--accent-color-overlay);

                                .account-name {
                                    color: var(--text-color) !important;
                                    font-size: var(--font-size-fluid-base);
                                }

                                .check-mark {
                                    display: flex;
                                }
                            }
                            .account-type {
                                background-color: var(--accent-color) !important;
                                color: var(--on-accent-text);
                            }
                        }
                    }
                }
            }

            .account-skin-view-container {
                background-color: var(--overlay-color);
                flex-grow: 1;
                border-radius: var(--border-radius-10);
                display: flex;
                overflow: hidden !important;
                position: relative;
                align-items: center;
                justify-content: center;
                border: 2px var(--border-color) solid;
            }
        }
    }

    /* Spinning animation for refresh button */
    .fa-spin {
        animation: fa-spin 1s infinite linear;
    }

    @keyframes fa-spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>