<script>
    // @ts-nocheck
    import { onDestroy } from 'svelte';
    import { showToast } from '../../stores/ui.js';
    import { selectedAccount, accountsStore, selectedAccountData } from '../../stores/account.js';
    import * as skin3d from 'skin3d';
    import SimpleTip from './SimpleTip.svelte';
    import CustomOptions from './CustomOptions.svelte';
    import { t } from '../../stores/i18n.js';
    import { getSkinUrl } from '../../shared/user.js';

    let canvas;
    let viewer = null;
    let animations;
    let view2D = true;
    let skinImage = null;
    let currentRenderType = 'default';
    let currentCropType = 'full';
    
    $: animations = [
        { value: 'idle', label: $t('skinViewer.animations.idle') },
        { value: 'walking', label: $t('skinViewer.animations.walking') },
        { value: 'running', label: $t('skinViewer.animations.running') },
        { value: 'crouch', label: $t('skinViewer.animations.crouch') },
        { value: 'waving', label: $t('skinViewer.animations.waving') },
    ];

    let activeAnimationValue;
    $: activeAnimationValue = animations[0]?.value || 'idle';

    // keys must align with animation values
    const availableAnimations = {
        idle: new skin3d.IdleAnimation(),
        walking: new skin3d.WalkingAnimation(),
        running: new skin3d.RunningAnimation(),
        waving: new skin3d.WaveAnimation(),
        crouch: new skin3d.CrouchAnimation(),
    };

    let isPaused = false;

    // derived
    $: activeAnimation = availableAnimations[activeAnimationValue];

    // Use the derived selectedAccountData instead of manual lookup
    $: account = $selectedAccountData;
    // Get current skin URL based on render type and crop
    $: currentSkinUrl = getSkinUrl(account, 'default').full;
    // Use raw skin for 3D viewer
    $: skinUrl = getSkinUrl(account, 'skin').default;

    // Initialize or update viewer when canvas and skinUrl are available
    $: if (canvas && !view2D) {
        console.log(skinUrl);
        if (!viewer) {
            // create viewer once
            viewer = new skin3d.View({
                canvas,
                width: 300,
                height: 350,
                skin: skinUrl,
                cape: account?.type === 'online'
                    ? account?.profile?.capes?.find(c => c.state === 'ACTIVE')?.url
                    : undefined
            });
            viewer.controls.enableRotate = true;
            viewer.controls.enableZoom = false;

            // apply initial animation state
            if (activeAnimation) {
                viewer.animation = activeAnimation;
                viewer.animation.speed = 0.6;
            }
            viewer.animation.paused = isPaused;
        } else {
            // update skin without full re-create
            viewer.loadSkin(skinUrl);
            
            if (account?.type === 'online') {
                const activeCape = account?.profile?.capes?.find(c => c.state === 'ACTIVE');
                if (activeCape) {
                    viewer.loadCape(activeCape.url);
                } else {
                    // Remove cape if online account has no active cape
                    viewer.loadCape(null);
                }
            } else {
                // Remove cape for offline accounts or when no account selected
                viewer.loadCape(null);
            }
        }
    }

    // Handle 2D view mode
    $: if (view2D) {
        // Dispose 3D viewer when switching to 2D
        if (viewer) {
            viewer.dispose();
            viewer = null;
        }
        // Load skin image for 2D view
        skinImage = currentSkinUrl;
    } else {
        // Clear skin image when switching to 3D
        skinImage = null;
    }

    // Apply animation changes (swap) while preserving speed & pause
    $: if (viewer && activeAnimation) {
        const wasPaused = viewer.animation?.paused || false;
        viewer.animation = activeAnimation;
        viewer.animation.speed = 0.6;
        if (wasPaused || isPaused) {
            viewer.animation.paused = true;
        } else {
            viewer.animation.paused = false;
        }
    }

    // Pause/resume control separate
    $: if (viewer && viewer.animation) {
        if (isPaused) {
            viewer.animation.paused = true;
        } else {
            viewer.animation.paused = false;
        }
    }

    onDestroy(() => {
        if (viewer) viewer.dispose();
    });

    function handleAnimationChange(e) {
        activeAnimationValue = e.detail.value;
    }

    function togglePausePlay() {
        isPaused = !isPaused;
    }

    function toggleViewMode() {
        view2D = !view2D;
    }

    async function saveSkin() {
        if (!skinUrl) {
            showToast($t('skinViewer.noSkinAvailable'), 'error');
            return;
        }
        
        try {
            const filename = `${account?.name || 'minecraft'}_skin.png`;
            const result = await window.electron.downloadSkin(skinUrl, filename);
            
            if (result.success) {
                showToast($t('skinViewer.skinSavedSuccessfully'), 'info');
            } else if (!result.canceled) {
                showToast($t('skinViewer.failedToSaveSkin', { error: result.error }), 'error');
            }
        } catch (error) {
            console.error('Error saving skin:', error);
            showToast($t('skinViewer.failedToSaveSkin'), 'error');
        }
    }
</script>

<div class="skin-viewer-container">
    {#if view2D}
        <div class="skin-2d-container fade-in-bck">
            {#if skinImage}
                <img src={skinImage} alt="Minecraft Skin" class="skin-2d-image" />
            {:else}
                <div class="loading-placeholder">Loading skin...</div>
            {/if}
        </div>
    {:else}
        <canvas class="fade-in-bck" bind:this={canvas}></canvas>
    {/if}
    <div class="skin-viewer-button">
        {#if !view2D}
            <SimpleTip text="{$t('skinViewer.viewModes.2d')}" direction="left">
                <button class="view-toggle btn-accent" 
                        aria-label="toggle-view" 
                        on:click={toggleViewMode}>
                        <i class="fa fa-image"></i>
                </button>
            </SimpleTip>
        {:else}
            <SimpleTip text="{$t('skinViewer.viewModes.3d')}" direction="left">
                <button class="view-toggle btn-accent" 
                    aria-label="toggle-view" 
                    on:click={toggleViewMode}>
                    <i class="fa fa-cube"></i>
                </button>
            </SimpleTip>
        {/if}
      
        {#if !view2D}
            <CustomOptions
                options={animations}
                id="skinviewAnimation"
                preferredPosition="down"
                value={activeAnimationValue}
                on:optionchange={handleAnimationChange}
            />
            <SimpleTip text="{$t('skinViewer.playPause')}" direction="left">
                <button class="animation" aria-label="play-animation" on:click={togglePausePlay}>
                    <i class={`fa ${isPaused ? 'fa-play' : 'fa-pause'}`}></i>
                </button>
            </SimpleTip>
        {/if}
        
        <SimpleTip text="{$t('skinViewer.saveSkin')}" direction="left">
            <button class="save-skin" 
                aria-label="save-skin" 
                on:click={saveSkin}>
                <i class={`fa fa-save`}></i>
            </button>
        </SimpleTip>
    </div>
</div>

<style>
.skin-viewer-container {
    width: 300px;
    height: 380px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all .2s ease;
}
.skin-viewer-button {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: end;
    row-gap: 10px;
}
.skin-viewer-button button {
    background-color: var(--base-variant-1);
    padding: 10px 15px;
    border-radius: 5px;
}
canvas {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: 10px;
}

.skin-2d-container {
    width: 300px;
    height: 350px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--base-variant);
    border-radius: 10px;
}

.skin-2d-image {
    /* max-width: 200px; */
    height: 84%;
    /* max-height: 200px; */
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    border-radius: 5px;
}

.loading-placeholder {
    color: var(--text-color-secondary);
    font-style: italic;
}

.view-toggle {
    color: var(--text-color);
    /* font-size: 1em; */
    font-weight: bold;
}
</style>
