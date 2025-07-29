<script>
    import { onMount } from 'svelte';
    import { t } from '../../stores/i18n';
    import { logger } from '../../utils/logger';
    import CustomOptions from './CustomOptions.svelte';

    let currentLevel = 'DEBUG';
    let consoleContainer;
    let previousLogCount = 0;

    const levels = [
        { value: 'DEBUG', label: $t('customOptions.levels.debug') },
        { value: 'INFO', label: $t('customOptions.levels.info') },
        { value: 'WARNING', label: $t('customOptions.levels.warning') },
        { value: 'ERROR', label: $t('customOptions.levels.error')}
    ];

    let logs = [];
    const unsubscribe = logger.subscribe(l => logs = l);

    // Initialize logger on mount
    onMount(async () => {
        await logger.init();
        previousLogCount = logs.length;
    });

    function handleOptionChange(e) {
        currentLevel = e.detail.value;
        logger.setMinLevel(currentLevel);
        logger.info('Level changed to ' + currentLevel);
    }

    async function clearLogs() {
        await logger.clear();
        previousLogCount = 0;
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
                    <span class="log-message log-{entry.level.toLowerCase()}">{entry.message}</span>
                    {#if entry.data}
                        <span class="log-data">{JSON.stringify(entry.data)}</span>
                    {/if}
                {/each}
            </div>
        </div>

        <div class="console-toolbar">
            <button class="clear-logs-btn" on:click={clearLogs}>{$t('customOptions.clear')}</button>
            <CustomOptions
                options={levels}
                value={currentLevel}
                on:optionchange={handleOptionChange}/>
        </div>
    </div>
</div>

<style>
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
        color: #69f0ae;
        background: rgba(105,240,174,0.08);
    }
    
    .log-data {
        color: #ccc;
        font-style: italic;
    }
</style>