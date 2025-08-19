<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    import { t } from '../../stores/i18n';
    import { logger } from '../../utils/logger';
    import CustomOptions from './CustomOptions.svelte';

    let currentLevel = 'DEBUG';
    let consoleContainer;
    let previousLogCount = 0;

    let logs = [];
    const unsubscribe = logger.subscribe(l => logs = l);

    function addWelcomeMessages() {
        logger.info(`■ ${$t('console.welcome')}`);
        logger.info(`■  ${$t('console.description')}`);
        logger.success(`■ ${$t('console.ready')}`);
    }

    // Initialize logger on mount
    onMount(async () => {
        // Add welcome messages if console is empty
        if (logs.length === 0) {
            addWelcomeMessages();
        }
        
        previousLogCount = logs.length;
    });

    async function clearLogs() {
        await logger.clear();
        
        // Restore default welcome messages after clearing
        addWelcomeMessages();
        
        previousLogCount = logs.length;
    }
    // Only auto-scroll when new logs are added (not when filtering)
    $: if (consoleContainer && logs.length > previousLogCount) {
        setTimeout(() => {
            if (consoleContainer) {
                consoleContainer.scrollTop = consoleContainer.scrollHeight;
            }
        }, 0);
        previousLogCount = logs.length;
    }

    $: filteredLogs = logs.filter(entry => 
        logger.getCurrentLevel 
            ? logger.logLevels[entry.level].level >= logger.logLevels[currentLevel].level
            : true
    );
</script>

<div class="m-container terminal">
    <div class="wrapper">
        <div class="console-container" id="console-container" bind:this={consoleContainer}>
            <div class="log-entry-cont">
                {#each filteredLogs as entry}
                    <div class="log-entry">
                        {#if entry.isStackable && entry.count > 1}
                            <span class="log-message log-{entry.level.toLowerCase()}">
                                {entry.stackPattern}
                                <span class="log-count">×{entry.count}</span>
                                {#if entry.data}
                                    <span class="log-progress">({entry.data})</span>
                                {/if}
                            </span>
                        {:else}
                            <span class="log-message log-{entry.level.toLowerCase()}">{entry.message}</span>
                            {#if entry.data}
                                <span class="log-data">{JSON.stringify(entry.data)}</span>
                            {/if}
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <div class="console-toolbar">
            <button class="clear-logs-btn" on:click={clearLogs}>{$t('customOptions.clear')}</button>
        </div>
    </div>
</div>

<style>
    .terminal {
        flex-grow: 1;
        background: none !important;
        padding: 1vw !important;
        display: grid;
        overflow: hidden !important;
        flex-direction: column;
        background-color: var(--base-variant) !important;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        /* grid-gap: 10px; */
        .wrapper {
            width: 100%;
            height: 30em;
            display: flex;
            background-color: var(--base-variant);
            border-radius: var(--border-radius-10);
            position: relative;
            overflow: hidden;

            .console-container {
                background-color: var(--base-color);
                flex-grow: 1;
                padding: 1vw;
                font-size: var(--font-size-fluid-sm);
                font-family: 'Courier New', Courier, monospace;
                flex-direction: column;
                overflow: hidden;
                overflow-y: auto;
                color: var(--text-color);
                user-select: text;

                .log-message{
                    width: 100%;
                }
            }

            .console-toolbar {
                position: absolute;
                top: 1vw;
                right: 1vw;
                display: flex;
                opacity: 0;
                flex-direction: row;
                column-gap: 1vw;
                align-items: center !important;
                transition: all .2s ease;
                .clear-logs-btn{
                    background-color: var(--error-color);
                    border: none;
                    color: var(--on-accent-text);
                    padding: .7vw 1vw;
                    border-radius: var(--border-radius-4);
                    font-size: var(--font-size-fluid-base);
                    &:hover {
                        background-color: var(--error-color-dark);
                        color: var(--on-accent-text);
                    }

                    &:active {
                        background-color: var(--error-color);
                        color: var(--error-color);
                    }
                }
            }

            &:hover > .console-toolbar{
                opacity: 1;
            }
        }
    }
    .log-entry-cont{
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex-grow: 1;
        max-width: 60vw;
    }
    .log-entry {
        display: flex;
        gap: 8px;
        margin-bottom: 2px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
    }
    
    .log-timestamp {
        color: #888;
        min-width: 80px;
    }
    
    .log-error {
        color: #ff5252;
        background: rgba(255,82,82,0.08);
    }
    
    .log-warning {
        color: #ffb300;
        background: rgba(255,179,0,0.08);
    }
    
    .log-info {
        color: #4fc3f7;
        background: rgba(79,195,247,0.08);
    }
    
    .log-debug {
        color: #ba68c8;
        background: rgba(186,104,200,0.08);
    }
    
    .log-success {
        color: var(--success-color);
        background: rgba(105,240,174,0.08);
    }
    
    .log-data {
        color: #ccc;
        font-style: italic;
    }
    
    .log-count {
        color: #888;
        font-weight: bold;
        margin-left: 6px;
        font-size: 11px;
        background: rgba(255,255,255,0.1);
        padding: 1px 4px;
        border-radius: 3px;
    }
    
    .log-progress {
        color: #aaa;
        font-size: 11px;
        margin-left: 4px;
    }
</style>