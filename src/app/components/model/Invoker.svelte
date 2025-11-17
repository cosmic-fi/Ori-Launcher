<script>
  import { t } from "../../stores/i18n";


</script>
<div class="invoker fade-in">
    <span class="blink">{$t('invoker.loading')}</span>
    <p class="description">
        {$t('invoker.description')}
        <br>*<span>{$t('invoker.closeNote')}</span>
    </p>
</div>

<style>
    .invoker{
        position: absolute;
        z-index: 99999;
        background-color: var(--shadow-color);
        backdrop-filter: blur(2px);
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-color)
    }
    span{
        font-size: 1.4rem;
        font-weight: 600;
    }
    .description{
        text-align: center;
    }
    .description span{
        font-size: 1rem;
        font-weight: normal;
        color: var(--text-color-muted);
    }
</style>