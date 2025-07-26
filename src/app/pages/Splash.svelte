<script>
    import SimpleTip from "../components/ui/SimpleTip.svelte";
    import { bootStatus, runBootSequence } from "../utils/bootUpManager";
    import { onMount } from "svelte";
    import { t } from "../stores/i18n";

    let status = { message: "Loading...", progress: 0 };
    const unsubscribe = bootStatus.subscribe(val => status = val);

    onMount(() => {
        runBootSequence();
        return unsubscribe;
    });
</script>
<div class="updater splash-screen">
    <div class="win-bar">
        <div class="win-title">
        </div>
        <div class="drag-bar"></div>
        <div class="win-action-bar-cont">
            <SimpleTip text="{$t('mainContent.minimize')}" direction="bottom">
                <button aria-label="minimize-app" class="win-action-btn splash-minimize-btn">
                    <i class="fa fa-minus"></i>
                </button>
            </SimpleTip>
            <SimpleTip text="{$t('mainContent.closeApp')}" direction="bottom">
                <button aria-label="minimize-app" class="win-action-btn splash-close-btn">
                    <i class="fa fa-xmark"></i>
                </button>
            </SimpleTip>
        </div>
    </div>
    <div class="u-wrapper">
        <img src="../../../images/static/foxy-walking.gif" alt="" class="u-brand">
        <span class="horizontal-seperator"></span>
        <div class="u-progress-bar-cont">
            <div class="progress-bar loading" style="width: {status.progress}%"></div>
        </div>
        <span class="progress-status">{status.message}</span>
    </div>
</div>