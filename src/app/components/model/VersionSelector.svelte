<script>
    import { createEventDispatcher } from 'svelte';
    import { uiState } from '../../stores/ui';
    import { versions, selectedMajor, selectedVariant, selectedType, setSelectedVersion } from '../../shared/versionManager';
    import { t } from '../../stores/i18n';

    const dispatch = createEventDispatcher();

    // When a major version is selected
    function selectVersion(version) {
        const variant = version.variants.find(v => v.id === version.name) || version.variants[0];
        setSelectedVersion(version.name, variant.id, variant.type);
    }

    // When a variant is selected
    function selectVariant(variantId) {
        const variantObj = $versions.find(v => v.name === $selectedMajor)?.variants.find(v => v.id === variantId);
        setSelectedVersion($selectedMajor, variantId, variantObj?.type || '');
        dispatch('change', { version: $selectedMajor, variant: variantId });
    }
</script>

<div class="version-selector">
    <div class="wrapper">
        <div class="version-overview-container">
            <div class="version-info-container">
                <span class="version-name">Minecraft {$selectedMajor}</span>
                <span class="version-tag">
                    {#if $versions.length}
                        {#each $versions.find(v => v.name === $selectedMajor)?.variants as variant}
                            {#if variant.id === $selectedVariant}
                                {variant.id} - {variant.type.charAt(0).toUpperCase() + variant.type.slice(1)}
                            {/if}
                        {/each}
                    {/if}
                </span>
                <span class="version-summary">{$t('versionSelector.versionSummary')}</span>
            </div>
            <button class="version-selector-save-btn" aria-label="Close Button" on:click={() => {uiState.toggleModel.set('none')}}>
                <i class="fa fa-xmark"></i>
            </button>
        </div>
        <div class="version-wrapper-container">
            <div class="release-wrapper">
                <div class="release-item-list-container">
                    <div class="item-list-wrapper">
                        {#each $versions as version}
                            <button
                                class="release-item {version.name === $selectedMajor ? 'selected' : ''}"
                                on:click={() => selectVersion(version)}
                            >
                                {version.name}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
            <div class="release-variant-wrapper">
                <div class="release-variant-item-list">
                    <div class="rvil-wrapper">
                        {#each $versions.find(v => v.name === $selectedMajor)?.variants as variant}
                            <button
                                class="release-variant-item {variant.id === $selectedVariant ? 'selected' : ''}"
                                on:click={() => selectVariant(variant.id)}
                            >
                                {variant.id}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>