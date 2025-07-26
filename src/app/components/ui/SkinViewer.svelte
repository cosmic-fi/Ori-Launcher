<script>
    import { onDestroy } from 'svelte';
    import { selectedAccount, accountsStore } from '../../stores/ui.js';
    import * as skin3d from 'skin3d';

    let canvas;
    let viewer;

    // Use Svelte's auto-subscription for reactivity
    $: selected = $selectedAccount;
    $: accounts = $accountsStore;
    $: account = accounts.find(a => a.uuid === selected || a.username === selected);

    // Get skin URL (offline: .skin, online: profile info, fallback)
    $: skinUrl = account?.skin
        || account?.profile?.skins?.[0]?.url
        || `https://minotar.net/skin/${account?.username || 'MHF_Steve'}.png`;

    // Re-render viewer when skinUrl changes
    $: if (canvas && skinUrl) {
        if (viewer) viewer.dispose();
        viewer = new skin3d.View({
            canvas,
            width: 300,
            height: 350,
            skin: skinUrl,
            cape: account?.type == 'online'
            ? account?.profile?.capes?.find(c => c.state === 'ACTIVE')?.url
            : undefined
        });
        viewer.controls.enableZoom = false;
        viewer.controls.enableRotate = true;
        viewer.animation = new skin3d.WalkingAnimation();
        viewer.animation.speed = .7;
    }

    onDestroy(() => {
        if (viewer) viewer.dispose();
    });
</script>

<div class="skin-viewer-container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
.skin-viewer-container {
    width: 300px;
    height: 380px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all .2s ease
}
canvas {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 10px;
}
</style>