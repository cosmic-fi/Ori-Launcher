<script>
  import { t } from '../../stores/i18n';

  export let title = $t('dialog.defaultTitle');
  export let message = $t('dialog.defaultMessage');
  export let buttons = [
    { label: $t('dialog.ok'), action: () => {}, type: "normal" }
  ];
  export let open = false;
  export let onClose = () => {};

  function getButtonClass(type) {
    switch (type) {
      case "danger": return "btn-danger";
      case "confirm": return "btn-accent";
      default: return "btn-primary";
    }
  }

  function handleBackgroundClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if open}
  <div class="dialog-container">
    <div class="d-wrapper scale-in-center">
      <div class="d-title-description-container">
        <span class="d-title">{title}</span>
        <p class="d-description">{message}</p>
      </div>
      <div class="d-btn-container">
        {#each buttons as btn}
          <button
            class="dialog-btn btn d-default-btn {getButtonClass(btn.type)}"
            on:click={() => { btn.action(); onClose(); }}>
            {btn.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}