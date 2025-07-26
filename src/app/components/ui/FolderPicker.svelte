<script>
// @ts-nocheck

    import { createEventDispatcher } from 'svelte';
    import { openFolderPicker } from '../../utils/helper';
    import SimpleTip from './SimpleTip.svelte';
    import { t } from '../../stores/i18n';

    export let value = '';
    export  let label = '';
    export let placeholder = $t('folderPicker.noFolderSelected');
    export let disabled = false;
    export let readonly = false;

    const dispatch = createEventDispatcher();

    async function pickFolder() {
        const result = await openFolderPicker();
        if (result) {
            value = result;
            dispatch('change', { value: result });
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
        {disabled}
        {readonly}
        on:input={onInput}
    />
    <SimpleTip text="{$t('folderPicker.browse')}" direction="bottom">
        <button type="button" on:click={pickFolder} disabled={disabled || readonly}>📂 {label}</button>
    </SimpleTip>
</div>