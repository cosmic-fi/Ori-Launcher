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

<style>
    .popup-container{
        position: absolute;
        z-index: 9999;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all .3s ease; 
        top: 0;
        left: 0;
        padding-block: 2vw;

        .wrapper{
            background-color: var(--accent-color-dark);
            padding: 1vw 2vw;
            border-radius: var(--border-radius-10);
            border: 2px var(--accent-color-60) solid;   
            color: var(--text-color);
            text-shadow: 2px 2px 5px #0000004d;
            box-shadow: 2px 2px 10px var(--accent-color-50);
        }
        .error-popup{
            background-color: var(--error-color-dark) !important;
            box-shadow: 2px 2px 10px var(--error-color-50);
            border-color: var(--error-color-50);
        }
        .info-popup{
            background-color: var(--info-color) !important;
            box-shadow: 2px 2px 10px var(--info-color-25);
            border-color: var(--info-color);
        }
        .normal-popup{
            background-color: var(--base-variant-3) !important;
            box-shadow: 2px 2px 10px var(--base-variant-1);
            border-color: var(--base-variant-2);
        }
    }
</style>