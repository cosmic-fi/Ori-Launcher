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
let addingOnlineAccount = false; // New loading state for online accounts

// Add username validation function
function validateUsername(username) {
    // Check if username is empty
    if (!username.trim()) {
        return false;
    }
    
    // Check length (3-16 characters)
    if (username.length < 3 || username.length > 16) {
        return false;
    }
    
    // Check for valid characters (only alphanumeric and underscore)
    const validPattern = /^[a-zA-Z0-9_]+$/;
    return validPattern.test(username);
}

// Add real-time validation
function handleUsernameInput(e) {
    name = e.target.value;
    
    // Set error messages for display
    if (!name.trim()) {
        error = $t('accountAdder.offlineAccountForm.usernameRequired');
    } else if (name.length < 3) {
        error = $t('accountAdder.offlineAccountForm.usernameTooShort');
    } else if (name.length > 16) {
        error = $t('accountAdder.offlineAccountForm.usernameTooLong');
    } else if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        error = $t('accountAdder.offlineAccountForm.usernameInvalidCharacters');
    } else {
        error = ''; // Clear error if valid
    }
}

// Reactive variable for button state
$: isUsernameValid = validateUsername(name);

function selectType(type) {
    if (type === 'offline') {
        showOfflineForm = true;
    } else {
        addingOnlineAccount = true; // Start loading state
        uiState.toggleModel.set("invoker");
        window.electron.invoke('add-account', 'hello')
        .then(async auth => {
            const result = JSON.parse(auth);
            const account = result.mc;
            console.log(result.extra);

            if (!result.success) {
                uiState.toggleModel.set('none');
                addingOnlineAccount = false; // End loading state
                showToast($t('accountAdder.failedToAddAccount'), 'error');
            } else {
                let _mAccount = {
                    type: 'online',
                    uuid: account.uuid,
                    access_token: account.access_token,
                    refresh_token: result.extra.parent.msToken.refresh_token,
                    client_id: account.client_id,
                    meta: account.meta,
                    name: account.name,
                    user_properties: account.user_properties,
                    profile: result.extra.profile
                };

                if ($accountsStore.length <= 0) {
                    setSelectedAccount(_mAccount.uuid);
                }
                
                console.log('before adding',$accountsStore.length <= 0, $accountsStore, _mAccount.uuid)
                
                // This is where the delay happens - downloading skin data
                try {
                    await addAccount(_mAccount);
                    
                    // Always set the newly added account as selected
                    setSelectedAccount(_mAccount.uuid);
                    
                    console.log('after adding', $accountsStore.length <= 0, $accountsStore, _mAccount.uuid)
                    showToast($t('accountAdder.accountAdded'), 'info');
                } catch (error) {
                    console.error('Error adding account:', error);
                    showToast($t('accountAdder.failedToAddAccount'), 'error');
                } finally {
                    uiState.toggleModel.set('none');
                    addingOnlineAccount = false; // End loading state
                }
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            uiState.toggleModel.set('none');
            addingOnlineAccount = false; // End loading state
            showToast($t('accountAdder.failedToAddAccount'), 'error');
        });
    }
}

function close() {
    uiState.toggleModel.set('none');
}

async function submitOffline(e) {
    e.preventDefault();
    
    // Double-check validation before submission
    if (!validateUsername(name)) {
        return;
    }
    
    let uuid = generateHexUUID();
    submitting = true;

    const _oAccount = {
        type: 'offline',
        access_token: 0,
        client_id: 0,
        meta: {},
        name: name.trim(),
        user_properties: {},
        uuid: uuid,
        profile: {}
    }
    
    try {
        // Remove the setTimeout and make it properly async
        await addAccount(_oAccount);
        
        // Always set the newly added account as selected
        setSelectedAccount(uuid);
        
        // Reset form state
        name = '';
        showOfflineForm = false;
        showToast($t('accountAdder.accountAdded'), 'info');
        console.log(_oAccount)
    } catch (error) {
        console.error('Error adding offline account:', error);
        showToast($t('accountAdder.failedToAddAccount'), 'error');
    } finally {
        submitting = false;
    }
}
</script>

<div class="account-adder-container">
    <div class="wrapper account-type-option-container">
        <div class="container-header">
            <span class="c-title">{showOfflineForm ? $t('accountAdder.addOfflineAccount') : $t('accountAdder.selectAccountType')}</span>
            <SimpleTip text={$t('accountAdder.close')} direction="bottom">
                <button class="c-close-btn" aria-label={$t('accountAdder.close')} on:click={close} disabled={submitting || addingOnlineAccount}>
                    <i class="fa fa-xmark"></i>
                </button>
            </SimpleTip>
        </div>
        {#if !showOfflineForm}
            <div class="ac-type-container">
                <button class="ac-type-item" on:click={() => selectType('online')} disabled={addingOnlineAccount}>
                    <span class="ac-type-title">
                        {#if addingOnlineAccount}
                            <i class="fa fa-spinner fa-spin"></i>
                        {:else}
                            <i class="fa-brands fa-microsoft"></i>
                        {/if}
                        &nbsp;{addingOnlineAccount ? $t('accountAdder.addingAccount') : $t('accountAdder.addMinecraftAccount')}
                    </span>
                    <span class="ac-type-description">
                        {addingOnlineAccount ? $t('accountAdder.addingAccountDescription') : $t('accountAdder.addMinecraftAccountDescription')}
                    </span>
                </button>
                <button class="ac-type-item offline" on:click={() => selectType('offline')} disabled={addingOnlineAccount}>
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
                            on:input={handleUsernameInput}
                            maxlength="16"
                            class:error={error}
                            disabled={submitting}
                        >
                        {#if error}
                            <div class="form-error text-danger">{error}</div>
                        {/if}
                    </div>
                    <div class="button-group">
                        <button class="cancel-btn" type="button" on:click={() => { showOfflineForm = false; name = ''; }} disabled={submitting}>
                            {$t('accountAdder.offlineAccountForm.cancel')}
                        </button>
                        <button type="submit" disabled={submitting || !isUsernameValid}>
                            {#if submitting}
                                <i class="fa fa-spinner fa-spin"></i>&nbsp;{$t('accountAdder.offlineAccountForm.saving')}
                            {:else}
                                {$t('accountAdder.offlineAccountForm.save')}
                            {/if}
                        </button>
                    </div>
                </form>
            </div>
        {/if}
    </div>
</div>

<style>
    .account-adder-container {
        width: 100%;
        height: 100%;
        position: absolute !important;
        z-index: 99;
        left: 0px;
        top: 0px;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background-color: var(--shadow-color-30);
        backdrop-filter: blur(2px);

        .wrapper {
            display: flex;
            width: 40vw;
            background-color: var(--base-variant-1);
            border-radius: 10px;
            overflow: hidden;
            border: 2px var(--border-color) solid;
            box-shadow: var(--base-variant-40) 0px 0px 0px 15px;
            flex-direction: column;

            .container-header {
                background-color: var(--base-variant-3);
                padding: .5vw .5vw .5vw 1vw;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;

                .c-title {
                    color: var(--text-color-75);
                    font-size: var(--font-size-fluid-lg);
                }

                .c-close-btn {
                    background-color: var(--base-variant-1-40);
                    padding: 1vw 1.3vw;
                    border: 1px var(--border-color) solid;
                    border-radius: var(--border-radius-5);
                    font-size: var(--font-size-fluid-base);

                    &:hover {
                        background-color: var(--base-variant-1);
                    }

                    &:active {
                        background-color: var(--base-variant-1-40);
                    }
                }
            }

            .ac-type-container {
                background-color: var(--base-variant-1);
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                padding: 1vw;
                row-gap: 1vw;

                .ac-type-item {
                    display: flex;
                    flex-direction: column;
                    border-radius: var(--border-radius-10);
                    padding: 1vw;
                    background: linear-gradient(-135deg, var(--base-variant-40) 0%, var(--base-variant)), url('https://staticg.sportskeeda.com/editor/2022/06/20118-16547953699460-1920.jpg');
                    background-size: 100%;
                    background-position: center left;
                    background-repeat: no-repeat;
                    overflow: hidden;
                    box-shadow: inset 0 0 0 1px var(--base-variant-80);
                    min-height: 5vw !important;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1), color .2s, box-shadow .2s !important;
                    cursor: pointer;
                    row-gap: .5vw;
                    justify-content: start !important;
                    align-items: start !important;

                    .ac-type-title {
                        color: var(--text-color-75);
                        font-size: 1rem;
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        color: var(--text-color);
                        column-gap: .5vw;
                    }

                    .ac-type-description {
                        color: var(--text-color-50);
                        font-size: var(--font-size-fluid-sm);
                        text-align: left;
                    }

                    i{
                        color: var(--text-color-50);
                    }
                    &:hover {
                        background-size: 110%;
                        color: var(--text-color);
                        box-shadow: inset 0 0 0 2px var(--base-variant-3);
                    }

                    &:active {
                        transform: scale(.98);
                    }
                }

                .offline {
                    background: linear-gradient(-135deg, var(--base-variant-40) 0%, var(--base-variant)), url('https://th.bing.com/th/id/OIP.GcDX75l-0106q1AiEm6ezwHaEK?rs=1&pid=ImgDetMain&cb=idpwebp2&o=7&rm=3');
                    background-position: top center;
                    background-size: 100%;
                    background-repeat: no-repeat;
                    justify-content: start !important;
                    align-items: start !important;
                }
            }

            .offline-account-form {
                background-color: var(--base-variant-1);
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                padding: 1vw;
                row-gap: 1vw;

                .input-form {
                    display: flex;
                    margin: 0;
                    flex-direction: column;
                    row-gap: 2vw;

                    .description-input-cont {
                        display: flex;
                        flex-direction: column;
                        row-gap: 1.6vw;
                        padding-top: 2vw;

                        .form-description {
                            color: var(--text-color-50);
                        }

                        input {
                            border: none;
                            background-color: var(--base-variant-2);
                            font-family: inherit;
                            padding: 1.2vw;
                            border-radius: var(--border-radius-5);
                            font-size: var(--font-size-fluid-base);
                            outline: none;
                            color: var(--text-color-75);
                            transition: all .2s ease !important;
                            box-shadow: inset 0 0 0 2px var(--border-color-80);

                            &:focus {
                                box-shadow: 0 0 0 2px var(--accent-color-80);
                            }
                        }
                    }

                    .button-group {
                        border-top: 1px var(--border-color) solid;
                        display: flex;
                        flex-direction: row;
                        padding-top: 1vw;
                        column-gap: 1vw;

                        button {
                            background-color: var(--accent-color);
                            padding: 1.3vw;
                            flex-grow: 1;
                            border-radius: var(--border-radius-5);
                            font-size: var(--font-size-fluid-base);

                            &:hover {
                                background-color: var(--accent-color-dark);
                                color: var(--text-color);
                            }
                        }
                        .cancel-btn{
                            background-color: var(--base-variant);

                            &:hover {
                                background-color: var(--base-variant-3);
                                color: var(--text-color);
                            }
                        }
                    }
                }
            }
        }
    }
    .text-danger{
        color: var(--error-color-light);
    }
    
    .ac-type-item:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .fa-spin {
        animation: fa-spin 2s infinite linear;
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