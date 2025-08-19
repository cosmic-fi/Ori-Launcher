<script>
// @ts-nocheck
    import SimpleTip from "../components/ui/SimpleTip.svelte";
    import { bootStatus, runBootSequence } from "../utils/bootUpManager";
    import { onMount } from "svelte";
    import { t } from "../stores/i18n";

    let status = { message: $t('splash.loading'), progress: 0 };
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
                <button 
                    onclick={async () => {
                        await window.electron.minimizeApp()
                    }}
                    aria-label="minimize-app" class="win-action-btn splash-minimize-btn"
                    >
                    <i class="fa fa-minus"></i>
                </button>
            </SimpleTip>
            <SimpleTip text="{$t('mainContent.closeApp')}" direction="bottom">
                <button 
                    onclick={async () => {
                        await window.electron.closeApp()
                    }}
                    aria-label="minimize-app" class="win-action-btn splash-close-btn">
                    <i class="fa fa-xmark"></i>
                </button>
            </SimpleTip>
        </div>
    </div>
    <div class="u-wrapper">
        <img src="./images/static/foxy-walking.gif" alt="" class="u-brand">
        <span class="horizontal-seperator"></span>
        <div class="u-progress-bar-cont">
            <div class="progress-bar loading" style="width: {status.progress}%"></div>
        </div>
        <span class="progress-status">{status.message}</span>
    </div>
</div>
<style>
    .splash-screen{
        display: flex;
        position: relative;
        z-index: 999;
        flex-grow: 1;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background-color: var(--base-variant);
        .win-bar{
            display: flex;
            top: 0;
            left: 0;
            flex-direction: row;
            justify-content: space-between;
            padding: 1.5vw;
            -webkit-app-region: drag;

            .win-title{
                color: var(--text-color);
                font-weight: bolder;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .win-action-bar-cont{
                display: flex;
                flex-direction: row;
                -webkit-app-region: no-drag;
                column-gap: 1vw;

                .win-action-btn{
                    cursor: pointer;
                    padding: 10px 15px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition:.3s ease;
                    font-weight: 100 !important;
                    color: var(--text-color-75);
                    border-radius: var(--border-radius-10);
                    border: 2px var(--border-color) solid;

                    &:hover{
                        color: var(--text-color);
                    }
                    &:active > i{
                        transform: scale(.9);
                    }
                }
                .splash-close-btn{
                    &:hover{
                        color: var(--error-color);
                    }
                }
            }
        }
        .u-wrapper{
            display: flex;
            flex-grow: 1;
            row-gap: 10px;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .u-brand{
                width: 150px;
            }
            .u-progress-bar-cont{
                background-color: var(--base-variant-1-40);
                width: 300px;
                padding: 6px 5px;
                border-radius: 50px;
                position: relative;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: start;
                border: 1px var(--border-color) solid;
                backdrop-filter: blur(1px);

                .progress-bar{
                    height: 2px;
                    width: 10%;
                    border-radius: 10px;
                    transition: all .2s ease;
                    background-color: var(--text-color-75);
                }
            }
            .progress-status{
                color: var(--text-color-50);
            }
        }
    }
</style>