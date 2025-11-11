<script>
// @ts-nocheck

    import { createEventDispatcher } from 'svelte';
    import { openFolderInExplorer, openFolderPicker } from '../../utils/helper';
    import SimpleTip from './SimpleTip.svelte';
    import { t } from '../../stores/i18n';

    export let value = '';
    export  let label = '';
    export let actionType = 'open';
    export let placeholder = $t('folderPicker.noFolderSelected');
    export let disabled = false;
    export let readonly = false;
    export let inputReadOnly = false;

    const dispatch = createEventDispatcher();

    async function folderAction(){
        if(actionType === 'open'){
            await openFolderInExplorer(value);
        }else{
            const result = await openFolderPicker();
            if (result) {
                value = result;
                dispatch('change', { value: result });
            }
        }
    }

    function onInput(e) {
        dispatch('change', { value: e.target.value });
    }
</script>

<div class="folder-picker">
    <input
        type="text"
        bind:value
        placeholder={placeholder}
        readonly={inputReadOnly}
        on:input={onInput}
    />
    <SimpleTip text="{actionType === 'open' ? $t('folderPicker.browse') : $t('folderPicker.pick')}" direction="bottom">
        <button type="button" on:click={folderAction} disabled={disabled || readonly}>📂 {label}</button>
    </SimpleTip>
</div>

<style>
    .folder-picker {
        display: flex;
        align-items: center;
        width: 100%;
        background-color: var(--base-variant);
        border: 1px var(--border-color) solid;
        border-radius: 5px;
        margin-top: 10px;

        input {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 3px;
            background-color: var(--overlay-color);
            outline: none !important;
            color: var(--text-color-muted);
            font-family: inherit;

            &::placeholder{
                color: var(--text-color-muted);
            }
        }

        button {
            padding: 8px;
            border: none;
            background: var(--overlay-color-1);
            color: var(--text-color-75);
            border-radius: 0px;
            cursor: pointer;
            border-left: 1px var(--border-color) solid;
            transition: 0.3s;

            &:hover {
                background: var(--overlay-color-2);
            }
        }
    }
</style>