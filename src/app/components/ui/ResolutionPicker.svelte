<script>
  import { createEventDispatcher } from 'svelte';
  import CustomOptions from './CustomOptions.svelte';
  import { t } from '../../stores/i18n';
  
  const dispatch = createEventDispatcher();
  
  export let width = 1920;
  export let height = 1080;
  export let fullscreen = false;
  
  // Common screen resolutions for the dropdown
  const resolutionOptions = [
    { value: 'fullscreen', label: $t('settings.game.display.fullscreen') },
    { value: '1920x1080', label: '1920x1080 (Full HD)' },
    { value: '2560x1440', label: '2560x1440 (2K)' },
    { value: '3840x2160', label: '3840x2160 (4K)' },
    { value: '1366x768', label: '1366x768 (HD)' },
    { value: '1280x720', label: '1280x720 (HD)' },
    { value: '1600x900', label: '1600x900 (HD+)' },
    { value: '1440x900', label: '1440x900 (WXGA+)' },
    { value: '1024x768', label: '1024×x768 (XGA)' }
  ];
  
  // Determine selected value based on fullscreen or resolution
  $: selectedValue = fullscreen ? $t('settings.game.display.fullscreen') : `${width}x${height}`;
  
  function handleResolutionPick(event) {
    const value = event.detail.value;
    
    if (value === 'fullscreen') {
      dispatch('resolutionchange', {
        width: 'fullscreen',
        height: 'fullscreen'
      });
      return;
    }
    
    const [w, h] = value.split('x').map(Number);
    
    dispatch('resolutionchange', {
      width: w,
      height: h
    });
  }
</script>

<div class="resolution-picker">
  <CustomOptions
    options={resolutionOptions}
    value={selectedValue}
    id="resolution"
    on:optionchange={handleResolutionPick}
  />
</div>

<style>
  .resolution-picker {
    display: flex;
    flex-direction: column;
  }
</style>