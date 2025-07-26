<script>
// @ts-nocheck

    export let checked = false;
    export let disabled = false;
    export let label = '';
    export let description = '';

    // Forward the change event
    function toggle() {
        if (!disabled) {
            checked = !checked;
            // Emit a change event with the new value
            dispatch('change', { checked });
        }
    }

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="toggle-btn {checked ? 'active-toggle' : ''} {disabled ? 'disabled' : ''}" on:click={toggle} tabindex="0" aria-checked={checked} role="switch">
    <div class="toggle-slider"></div>
</div>
{#if label}
    <span class="toggle-label">{label}</span>
{/if}
{#if description}
    <span class="toggle-description">{description}</span>
{/if}