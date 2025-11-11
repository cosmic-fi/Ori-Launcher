<script>
// @ts-nocheck

    import { versions, selectedMajor, selectedVariant, selectedType, setSelectedVersion } from '../../shared/versionManager';
  import { t } from '../../stores/i18n';
  import { canLaunch, isLaunching, launchActions, launchStatus } from '../../stores/launch';
    import { settings } from '../../stores/settings';
  import { showDialog, showToast, uiState } from '../../stores/ui';
  import { logger } from '../../utils/logger';
  import Dialog from '../model/Dialog.svelte';
    import CustomOptions from './CustomOptions.svelte';
    import RadioButton from './RadioButton.svelte';
    
    $: instanceTypes = [
        {
            id: 'vanilla',
            value: 'vanilla',
            icon: './images/static/vanilla.png',
            label: `<img class="instance-icon" src="./images/static/vanilla.png" /> ${$t('instanceManager.version.versionTypes.vanilla.name')}`,
            description: $t('instanceManager.version.versionTypes.vanilla.description')
        },
        {
            id: 'forge',
            value: 'forge',
            icon: './images/static/forge.png',
        label: `<img class="instance-icon" src="./images/static/forge.png" /> ${$t('instanceManager.version.versionTypes.forge.name')}`,
            description: $t('instanceManager.version.versionTypes.forge.description')
        },
        {
            id: 'fabric',
            value: 'fabric',
            icon: './images/static/fabric.png',
        label: `<img class="instance-icon" src="./images/static/fabric.png" /> ${$t('instanceManager.version.versionTypes.fabric.name')}`,
            description: $t('instanceManager.version.versionTypes.fabric.description')

        }
    ];

    let selectedInstanceType = 'vanilla';
    let currentVersions = [];
    let selectedMajorVersion = '';
    let expandedMajor = null;
    
    // Subscribe to version stores
    $: if ($selectedType) {
        selectedInstanceType = $selectedType === 'release' ? 'vanilla' : $selectedType;
    }
    
    // Filter versions based on instance type
    $: currentVersions = $versions.filter(versionGroup => {
        if (selectedInstanceType === 'fabric') {
            // Fabric only supports 1.15+
            const versionParts = versionGroup.name.split('.');
            const major = parseInt(versionParts[0]);
            const minor = parseInt(versionParts[1]);
            
            // Check if version is 1.15 or higher
            if (major > 1) return true;
            if (major === 1 && minor >= 15) return true;
            return false;
        }
        return true; 
    });

    $: if ($selectedMajor && expandedMajor !== $selectedMajor) {
        expandedMajor = $selectedMajor;
    }
    // Get current instance info
    $: currentInstance = instanceTypes.find(type => type.id === selectedInstanceType) || instanceTypes[0];
    
    $: majorOptions = currentVersions.map(v => ({
        id: v.name,
        value: v.name,
        icon: '',
        label: v.name,
        description: ''
    }));

    $: console.log(majorOptions);
    $: visibleVersions = currentVersions.filter(v => v.name === expandedMajor);

    function handleInstanceTypeChange(event) {
        const typeId = event.detail || event.target?.value || event;
        if(!$canLaunch){
            alertOnInstanceEdit($launchStatus);
            return;
        };
    
        selectedInstanceType = typeId.value;
        
        // Update the version type in the store
        const versionType = typeId.value === 'vanilla' ? 'release' : typeId.value;

        setSelectedVersion($selectedMajor, $selectedVariant, versionType);
    }
    
    function handleMajorVersionClick(event) {
        let selectedValue =
            event?.detail?.value ||
            event?.detail?.id ||
            event?.detail?.option?.value ||
            event?.target?.value ||
            event;

        if (!selectedValue) return;

        if (!$canLaunch) {
            alertOnInstanceEdit($launchStatus);
            return;
        }

        expandedMajor = selectedValue;
        console.log('Expanded major now:', expandedMajor);

        // auto-select the first variant under this major
        const selectedGroup = currentVersions.find(v => v.name === selectedValue);
        if (selectedGroup && selectedGroup.variants.length > 0) {
            const firstVariant = selectedGroup.variants[0];
            const versionType = selectedInstanceType === 'vanilla' ? 'release' : selectedInstanceType;
            setSelectedVersion(selectedValue, firstVariant.id, versionType);
        }
    }


    
    function handleVariantSelect(major, variant) {
        if(!$canLaunch){
            alertOnInstanceEdit($launchStatus);
            return;
        }
        const versionType = selectedInstanceType === 'vanilla' ? 'release' : selectedInstanceType;
        setSelectedVersion(major, variant.id, versionType);
        expandedMajor = null;
    }

    function alertOnInstanceEdit(status){
        const preparingPhases = ['preparing', 'downloading', 'extracting', 'verifying'];
        if (preparingPhases.includes(status)) {
            showDialog({
                title: $t('dialog.titles.gamePreparing'),
                message: $t('dialog.messages.gamePreparingCancelMessage'),
                buttons: [
                    {
                        label: $t('dialog.cancel'),
                        type: 'normal',
                        action: () => {}
                    },
                    {
                        label: $t('dialog.confirm'), 
                        type: 'danger',
                        action: async () => {
                            if($isLaunching){
                                await window.electron.cancelLaunch();
                            }
                            showToast($t('mainContent.launch.launchStatus.cancelled'));
                            launchActions.reset();
                            logger.endSession();
                            isLaunching.set(false);
                        }
                    }
                ]
            });
            return;
        }

        showDialog({
            title: $t('dialog.titles.gameRunning'),
            message: $t('dialog.messages.gameRunningCancelMessage'), 
            buttons: [
                {
                    label: $t('dialog.cancel'),
                    type: 'normal',
                    action: () => {}
                },
                {
                    label: $t('dialog.confirm'),
                    type: 'danger', 
                    action: async () => {
                        if($isLaunching){
                            await window.electron.cancelLaunch();
                        }
                        showToast($t('mainContent.launch.launchStatus.cancelled'));
                        launchActions.reset();
                        logger.endSession();
                        isLaunching.set(false);
                    }
                }
            ]
        });
    }
</script>

<div class="launch-news-container">
    <div class="instance-manager">
        <div class="instance-info-container">
            <div class="instance-type-container hide">
                {#each instanceTypes as instanceType}
                    <button
                        class="instance-item" 
                        class:active-instance={selectedInstanceType === instanceType.id}
                        on:click={() => handleInstanceTypeChange(instanceType.id)}
                    >
                        <img src="{instanceType.icon}" alt="{instanceType.name}">&nbsp;{instanceType.name}
                    </button>
                {/each}
            </div>

            <div class="version-header-container">
                <div class="header-line">
                    <div class="breadcrumb">
                        <button 
                            class="btn btn-normal back-btn"
                            on:click={uiState.activeTab.set('launch')}
                            >
                            <i class="fa fa-home"></i>
                            <h1>{$t('instanceManager.home')}</h1>
                        </button>
                        /
                        <h1 class="breadcrumb-title">{$t('instanceManager.title')}</h1>
                    </div>
                    <CustomOptions
                        options={instanceTypes}
                        id="instance-type"
                        preferredPosition="down"
                        value={selectedInstanceType}
                        on:optionchange={handleInstanceTypeChange}
                    />
                </div>
                <div class="version-header">
                    <h2 class="instance-type-title">{selectedInstanceType === 'vanilla' ? 'Vanilla' : selectedInstanceType.charAt(0).toLocaleUpperCase()+selectedInstanceType.slice(1)}</h2>
                    <h3 class="instance-version">{$selectedType === 'forge' ? 'MC' : $selectedType === 'fabric' ? 'Stable' : 'Release'}&nbsp;{$selectedVariant}</h3>
                </div>
            </div>
            <p class="instance-summery">
                {currentInstance.description}
            </p>
        </div>
        <div class="version-title-container">
            <h2>{$t('instanceManager.version.label')}</h2>
            <span class="hr"></span>
            <CustomOptions
                options={majorOptions}
                id="version-major"
                preferredPosition="down"
                value={expandedMajor}
                on:optionchange={handleMajorVersionClick}
            />
        </div>
        <div class="instance-version-container">
            <div class="version-wrapper">
                {#each visibleVersions as versionGroup}
                    {#each versionGroup.variants as variant}
                        <div 
                            class="version-item-main active-main"
                            class:main-item={$selectedVariant === variant.id && $selectedMajor === versionGroup.name}
                        >
                            <div class="instance-variant-cont expanded">
                                <button 
                                    class="variant-item"
                                    class:selected-instance-version={$selectedVariant === variant.id}
                                    on:click={() => handleVariantSelect(versionGroup.name, variant)}
                                >
                                    {variant.id}
                                </button>
                            </div>
                        </div>
                    {/each}
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    .launch-news-container {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        row-gap: 1vw;
        overflow: hidden;

        .instance-manager{
            background-color: var(--surface-color);
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center auto;
            border-radius: var(--border-radius-20);
            border: 2px solid var(--border-color);
            padding: .5rem 1rem 1rem 1rem;
            display: flex;
            flex-direction: column;
            color: var(--text-color);
            row-gap: 1vw;
            flex-grow: 1;
            justify-content: space-between;
            color: var(--text-color-75);
            background-size: 100%;
            background-position: top;
            
            .instance-info-container{
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                row-gap: .5rem;
                justify-content: start;
                align-items: start;
                position: relative;

                /* .instance-type-container{
                    display: flex;
                    flex-direction: row;
                    column-gap: .5rem;
                    background-color: var(--overlay-color);
                    border: 2px solid var(--border-color);
                    padding: .5rem;
                    border-radius: var(--border-radius-20);
                    
                    .instance-item{
                        padding: .5rem 2rem;
                        border-radius: var(--border-radius-10);
                        font-size: var(--font-size-fluid-lg);
                        color: var(--text-color);
                        font-weight: 600;
                        display: flex;
                        flex-direction: row;
                        background-color: var(--accent-color-10);
                        align-items: center;
                        column-gap: .5rem;

                        img{
                            width: 25px
                        }
                    }
                    .active-instance{
                        background-color: var(--accent-color);
                        color: var(--text-color);
                    }
                } */
                .version-header-container{
                    display: flex;
                    flex-direction: column;
                    /* align-items: start; */
                    row-gap: .5rem;
                    width: 100%;
                    
                    .header-line{
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: .5rem;
                        border-bottom: 1px solid var(--border-color);

                        .breadcrumb{
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            color: var(--text-color-muted);
                            button{
                                display: flex;
                                column-gap: 5px;
                                flex-direction: row;
                                align-items: center;
                                color: var(--accent-color);

                                h1{
                                    color: var(--accent-color);
                                }
                            }
                            .breadcrumb-title{
                                margin-left: 5px;
                            }
                            h1{
                                padding: 0;
                                margin: 0;
                                font-size: var(--font-size-fluid-lg);
                            }
                        }

                    }
                    h1{
                        color: var(--text-color);
                        padding-bottom: .3em;
                    }
                    .version-header{
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        column-gap: 10px;
                        .instance-version{
                            font-size: var(--font-size-fluid-base);
                            font-weight: 500;
                            background-color: var(--overlay-color);
                            box-shadow: inset 0 0 0 1px var(--border-color);
                            padding: 2px 10px !important;
                            border-radius: 5px;
                        }
                        .instance-type-title{
                            color: var(--text-color);
                        }
                        h2, h3{
                            padding: 0 !important;
                            margin: 0 !important;
                            color: var(--text-color-muted);
                        }
                    }
                }
                p{
                    font-size: var(--font-size-fluid-md) !important;
                    margin: 0;
                    padding: 0;
                    bottom: 25px;
                    max-width: 35rem;
                    color: var(--text-color-muted);
                }
            }
            .version-title-container{
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                column-gap: 1em;
                .hr{
                    flex-grow: 1;
                    height: 1px;
                    background-color: var(--border-color);
                }
                h2{
                    font-size: 1.2rem;
                    font-weight: 500;
                    color: var(--text-color);
                }
            }
            .instance-version-container{
                background-color: var(--base-color);
                height: 13rem;
                max-height: 13rem;
                display: flex;
                flex-direction: column;
                padding: .5rem !important;
                border-radius: var(--border-radius-10);
                border: 2px solid var(--border-color);
                
                .version-wrapper{
                    display: flex;
                    flex-direction: row;
                    background-color: var(--surface-color);
                    flex-grow: 1;
                    padding: .7rem;
                    border-radius: var(--border-radius-8);
                    scrollbar-width: 0 !important;
                    flex-wrap: wrap;
                    column-gap: .5rem;
                    gap: .5rem;
                    overflow: hidden;
                    overflow-y: auto;
                    align-content: start;

                    .version-item-main{
                        display: flex;
                        flex-direction: row;
                        column-gap: .4rem;
                        padding: .3rem;
                        border-radius: var(--border-radius-10);
                        background-color: var(--overlay-color);
                        align-items: center;
                        border: 2px solid var(--border-color);

                        .instance-variant-cont{
                            display: none;
                            flex-direction: row;
                            column-gap: .5rem;
                            flex-wrap: wrap;
                            gap: .5rem;
                            align-content: start;
                           
                            button{
                                background-color: var(--base-variant-1);
                                &:hover {
                                    color: var(--text-color);
                                }
                                &:focus {
                                    color: var(--text-color);
                                }
                            }
                            .selected-instance-version {
                                color: var(--text-color);
                            }
                        }

                        button{
                            padding: .7rem 1.3em;
                            font-size: var(--font-size-fluid-base);
                            border-radius: var(--border-radius-5);
                            color: var(--text-color-muted);
                            font-size: var(--font-size-fluid-lg);
                            border-radius: var(--border-radius-5);
                            font-weight: 500;
                        }
                    }

                    .main-item{
                        background-color: var(--accent-color);
                        color: var(--on-accent-text);
                    }

                    .active-main{
             
                        .instance-variant-cont{
                           display: flex !important;
                        }
                    }
                    &::-webkit-scrollbar{
                        display: none
                    }
                }
                
            }
        }
    }
</style>
