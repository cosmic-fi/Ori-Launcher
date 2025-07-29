<script lang="js">
// @ts-nocheck

import { createEventDispatcher } from 'svelte';
import { accountsStore, showToast, uiState } from '../../stores/ui';
import SimpleTip from '../ui/SimpleTip.svelte';
import { addAccount, getAccounts, getSelectedAccount, setSelectedAccount } from '../../shared/user';
import { generateHexUUID } from '../../utils/helper';
import { t, currentLocale } from '../../stores/i18n';

const dispatch = createEventDispatcher();

let showOfflineForm = false;
let name = '';
let error = '';
let submitting = false;

function selectType(type) {
    if (type === 'offline') {
        showOfflineForm = true;
    } else {
        uiState.toggleModel.set("invoker");
        window.electron.invoke('add-account', 'hello')
        .then(async auth => {
            const result = JSON.parse(auth);
            const account = result.mc;
            console.log(result);

            if (!result.success) {
                uiState.toggleModel.set('none');
                showToast($t('accountAdder.failedToAddAccount'), 'error');
            } else {
                uiState.toggleModel.set('none');

                let _mAccount = {
                    type: 'online',
                    access_token: account.access_token,
                    client_id: account.client_id,
                    meta: account.meta,
                    name: account.name,
                    user_properties: account.user_properties,
                    uuid: account.uuid
                };

                if ($accountsStore.length <= 0) {
                    setSelectedAccount(_mAccount.uuid);
                }
                // console.log(_mAccount);
                console.log('before adding',$accountsStore.length <= 0, $accountsStore, _mAccount.uuid)
                await addAccount(_mAccount);
                console.log('after adding', $accountsStore.length <= 0, $accountsStore, _mAccount.uuid)
                showToast($t('accountAdder.accountAdded'), 'info');
            }
        })
    }
}

function close() {
    uiState.toggleModel.set('none');
}

function submitOffline(e) {
    e.preventDefault();
    let uuid = generateHexUUID();

    error = '';
    if (!name.trim()) {
        error = $t('accountAdder.offlineAccountForm.usernameRequired');
        return;
    }
    submitting = true;

    const _oAccount = {
        type: 'offline',
        access_token: 0,
        client_id: 0,
        meta: {},
        name: name,
        user_properties: {},
        uuid: uuid 
    }
    setTimeout(() => {
        if($accountsStore.length <= 0){
            setSelectedAccount(uuid);
        }
        addAccount(_oAccount);
        submitting = false;
        name = '';
        showOfflineForm = false;
        showToast($t('accountAdder.accountAdded'), 'info');
        console.log(_oAccount)
    }, 500);
}
</script>

<div class="account-adder-container">
    <div class="wrapper account-type-option-container">
        <div class="container-header">
            <span class="c-title">{showOfflineForm ? $t('accountAdder.addOfflineAccount') : $t('accountAdder.selectAccountType')}</span>
            <SimpleTip text={$t('accountAdder.close')} direction="bottom">
                <button class="c-close-btn" aria-label={$t('accountAdder.close')} on:click={close}>
                    <i class="fa fa-xmark"></i>
                </button>
            </SimpleTip>
        </div>
        {#if !showOfflineForm}
            <div class="ac-type-container">
                <button class="ac-type-item" on:click={() => selectType('online')}>
                    <span class="ac-type-title"><i class="fa-brands fa-microsoft"></i>&nbsp;{$t('accountAdder.addMinecraftAccount')}</span>
                    <span class="ac-type-description">
                        {$t('accountAdder.addMinecraftAccountDescription')}
                    </span>
                </button>
                <button class="ac-type-item offline" on:click={() => selectType('offline')}>
                    <span class="ac-type-title"><i class="fa fa-link-slash"></i>&nbsp;{$t('accountAdder.addOfflineAccount')}</span>
                    <span class="ac-type-description">
                        {$t('accountAdder.addOfflineAccountDescription')}
                    </span>
                </button>
            </div>
        {:else}
            <div class="offline-account-form">
                <form class="input-form" on:submit={submitOffline}>
                    <div class="description-input-cont">
                        <span class="form-description">
                            {$t('accountAdder.offlineAccountForm.enterUsername')}
                        </span>
                        <input
                            type="text"
                            name="offline-name-input"
                            id="offline-account-name"
                            placeholder={$t('accountAdder.offlineAccountForm.usernamePlaceholder')}
                            bind:value={name}
                        >
                        {#if error}
                            <div class="form-error">{error}</div>
                        {/if}
                    </div>
                    <div class="button-group">
                        <button class="cancel-btn" type="button" on:click={() => { showOfflineForm = false; name = ''; }}>
                            {$t('accountAdder.offlineAccountForm.cancel')}
                        </button>
                        <button type="submit" disabled={submitting || !name.trim()}>
                            {submitting ? $t('accountAdder.offlineAccountForm.saving') : $t('accountAdder.offlineAccountForm.save')}
                        </button>
                    </div>
                </form>
            </div>
        {/if}
    </div>
</div>