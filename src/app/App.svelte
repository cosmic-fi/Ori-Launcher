<script>
  // @ts-nocheck
  import ToastList from './components/model/ToastList.svelte';
  import Home from './pages/Home.svelte';
  import Splash from './pages/Splash.svelte';
  import { showToast, uiState } from './stores/ui';
  import Dialog from './components/model/Dialog.svelte';
  import { dialogStore, closeDialog } from './stores/ui.js';
  import { applySystemSettings } from './utils/applySettings';
  import { startConnectionDaemon } from './utils/connectionDaemon';
  import { t } from './stores/i18n';

  const { isBootReady } = uiState;
  applySystemSettings();    
  
  startConnectionDaemon(
    () => showToast($t('connection.connectionLost', 'error')),
    () => showToast($t('connection.connectionRestored', 'success'))
  );
  uiState.isBootReady.set(false);
</script> 

{#if $isBootReady}
  <Home />
{:else}
  <Splash />
{/if}

<ToastList />
<Dialog
  open={$dialogStore.open}
  title={$dialogStore.title}
  message={$dialogStore.message}
  buttons={$dialogStore.buttons}
  onClose={closeDialog}
/>