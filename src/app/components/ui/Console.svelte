<script>
  import { t } from '../../stores/i18n';
    import { logger } from '../../utils/logger';
    import CustomOptions from './CustomOptions.svelte';

    let currentLevel = 'DEBUG';

    const levels = [
        { value: 'DEBUG', label: $t('customOptions.levels.debug') },
        { value: 'INFO', label: $t('customOptions.levels.info') },
        { value: 'WARNING', label:  $t('customOptions.levels.warning') },
        { value: 'ERROR', label: $t('customOptions.levels.error')}

    ];

    let logs = [];
    const unsubscribe = logger.subscribe(l => logs = l);

    // TEST: Add a log entry on mount
    logger.info('Logger test message');
    logger.error('Something went wrong', { code: 123 });
    
    function handleOptionChange(e) {
        console.log(e)
        currentLevel = e.detail.value;
        logger.setMinLevel(currentLevel);
        logger.info('Level changed to '+currentLevel);
    }

    function clearLogs() {
        logger.clear();
    }

    $: filteredLogs = logs.filter(entry => 
        logger.getCurrentLevel 
            ? logger.logLevels[entry.level].level >= logger.logLevels[currentLevel].level
            : true
    );
</script>

<div class="m-container terminal">
    <div class="wrapper">
        <div class="console-container" id="console-container">
            {#each filteredLogs as entry}
                <div class="log-entry log-{entry.level.toLowerCase()}">
                    <span class="log-timestamp">{entry.timestamp.toLocaleTimeString()}</span>
                    [<span class="log-level">{entry.level}</span>]
                    <span class="log-message">{entry.message}</span>
                    {#if entry.data}
                        <span class="log-data">{JSON.stringify(entry.data)}</span>
                    {/if}
                </div>
            {/each}
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
    .log-entry.log-error {
      color: #ff5252;
      background: rgba(255,82,82,0.08);
    }
    
    .log-entry.log-warning {
      color: #ffb300;
      background: rgba(255,179,0,0.08);
    }
    
    .log-entry.log-info {
      color: #4fc3f7;
      background: rgba(79,195,247,0.08);
    }
    
    .log-entry.log-debug {
      color: #ba68c8;
      background: rgba(186,104,200,0.08);
    }
    
    .log-entry.log-success {
      color: #69f0ae;
      background: rgba(105,240,174,0.08);
    }
</style>