<script>
    import { createEventDispatcher } from 'svelte';
    import RadioButton from "./RadioButton.svelte";

    export let options = [];
    export let name = '';
    export let value = '';
    export let title = '';
    export let disabled = false;
    export let required = false;
    export let orientation = 'vertical'; // 'vertical' or 'horizontal'
    
    const dispatch = createEventDispatcher();
    
    // Handle value change
    function handleChange(newValue) {
        if (!disabled) {
            value = newValue;
            dispatch('change', newValue);
        }
    }
    
    // Create a unique name if not provided
    $: groupName = name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="radio-group" class:horizontal={orientation === 'horizontal'} class:vertical={orientation === 'vertical'}>
    {#if title}
        <h3 class="group-title">{title}</h3>
    {/if}
    
    <div class="radio-options" class:horizontal={orientation === 'horizontal'}>
        {#each options as option}
            <RadioButton
                name={groupName}
                value={option.value}
                bind:group={value}
                disabled={disabled || option.disabled}
                label={option.label}
                icon={option.icon}
                description={option.description}
                on:change={() => handleChange(option.value)}
            />
        {/each}
    </div>
    
    {#if required && !value}
        <span class="error-message">Please select an option</span>
    {/if}
</div>

<style>
    .radio-group {
        display: flex;
        flex-direction: column;
        row-gap: .8rem;
        
        &.horizontal {
            .radio-options {
                flex-direction: row;
                column-gap: 1rem;
                row-gap: 0;
                flex-wrap: wrap;
            }
        }
        
        .group-title {
            margin: 0;
            color: var(--text-color);
            font-size: var(--font-size-fluid-lg);
            font-weight: 600;
            line-height: 1.2;
        }
        
        .radio-options {
            display: flex;
            flex-direction: column;
            row-gap: .6rem;
            
            &.horizontal {
                flex-direction: row;
                column-gap: 1rem;
                row-gap: 0;
                flex-wrap: wrap;
            }
        }
        
        .error-message {
            color: var(--error-color, #ef4444);
            font-size: var(--font-size-fluid-sm);
            font-weight: 500;
            margin-top: -.4rem;
        }
    }
</style>