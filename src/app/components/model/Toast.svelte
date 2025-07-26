<script>
  import { t } from "../../stores/i18n";

    export let message = $t('toast.defaultMessage');
    export let duration = 2500; // milliseconds
    export let type = "normal"; // "normal", "error", "info"

    let visible = true;

    // Hide after duration
    setTimeout(() => {
        visible = false;
    }, duration);
</script>

{#if visible}
<div class="popup-container">
    <div class="wrapper {type}-popup">
        <div class="context-container">
            <span class="context">{message}</span>
        </div>
    </div>
</div>
{/if}