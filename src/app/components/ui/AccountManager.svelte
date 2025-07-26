<script>
    import SimpleTip from '../ui/SimpleTip.svelte';
    import SkinViewer from './SkinViewer.svelte';
    import { getAccounts, removeAccount, setSelectedAccount, getSelectedAccount } from '../../shared/user.js';
    import { limitText, slideX } from '../../utils/helper';
    import { showDialog, uiState } from '../../stores/ui';
    import { accountsStore, userAccountState } from '../../stores/ui';
  import { t } from '../../stores/i18n';
    // Load accounts
    let accounts = getAccounts();
    let { selectedAccountUuid } = userAccountState;

    const selectedAccount = getSelectedAccount();
    if(selectedAccount){
        userAccountState.selectedAccountUuid.set(selectedAccount.uuid);
    }
    console.log(selectedAccount, selectedAccountUuid)
    // Remove handler
    function handleDelete(account) {
        showDialog({
            title: $t('accountManager.deleteAccountTitle'),
            message: $t('accountManager.deleteAccountMessage'),
            buttons: [
            { label: $t('accountManager.cancel'), type: "normal", action: () => {} },
            { label: $t('accountManager.delete'), type: "danger", action: () => { 
                removeAccount(account.type === 'online' ? account.uuid : account.username);
             } }
            ]
        });
    }

    // Select handler
    function handleSelect(account) {
        setSelectedAccount(account.uuid);
    }

    // Format playtime helper
    function formatPlaytime(seconds) {
        if (!seconds) return '0min';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h ? `${h}h ${m}min` : `${m}min`;
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
                        <div class="{index == 0 ? 'show-slide-hint' : ''} sliding-account-card account-card {$selectedAccountUuid === account.uuid ? 'active-card' : ''}">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
                                class="account-avatar-name-cont"
                                use:slideX={{ snapX: -60, threshold: -30 }}
                                style="z-index:1;"
                                on:click={(e) => {
                                    if (!e.currentTarget.wasDragged) handleSelect(account);
                                }}
                            >
                                <span class="account-avatar" style="background: url({account.face});background-size: contain"></span>
                                <div class="account-name-spec">
                                    <span class="account-name">
                                        {#if account.username.length >= 20}
                                            <SimpleTip text={account.username} direction="top">
                                                <span  use:limitText={{size: 20}}>{account.username}</span>
                                            </SimpleTip>
                                        {:else}
                                            <span>{account.username}</span>
                                        {/if}
                                        <span class="account-type">{account.type === 'online' ? 'Minecraft' : 'Cracked'}</span>
                                    </span>
                                    <div class="account-spec">
                                        <span class="playtime">{$t('accountManager.playtime')}: <b>{formatPlaytime(account.playtime)}</b></span>
                                    </div>
                                </div>
                                <span class="check-mark"><i class="fa fa-circle-check"></i></span>
                            </div>
                            <div class="account-action-btn-cont hide">
                                <SimpleTip text="Remove account" direction="bottom">
                                    <button 
                                        class="remove-btn" 
                                        aria-label="Remove account" 
                                        on:click={() => {handleDelete(account)}}
                                        >
                                        <i class="fa fa-trash"></i>
                                    </button>
                                </SimpleTip>
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