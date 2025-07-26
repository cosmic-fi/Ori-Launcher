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
    span{
        font-size: 1.1rem;
        font-weight: 600;
    }
    .description{
        text-align: center;
    }
    .description span{
        font-size: .8rem;
        opacity: .7;
        font-weight: normal;
    }
</style>