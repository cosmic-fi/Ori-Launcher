<script>
// @ts-nocheck

    import { showToast, uiState } from "../../stores/ui";
    import CustomOptions from "../ui/CustomOptions.svelte";
    import FolderPicker from "../ui/FolderPicker.svelte";
    import ToggleButton from "../ui/ToggleButton.svelte";
    import { settings } from "../../stores/settings";
    import { onMount, tick } from "svelte";
    import { getTotalSystemRamGB } from "../../utils/helper";
    import SimpleTip from "../ui/SimpleTip.svelte";
    import { currentLocale, t } from "../../stores/i18n";
    import { appVersion } from "../../utils/version";
    import ThemeCard from "../ui/ThemeCard.svelte";
    import { discordRPCManager } from '../../utils/discordRPCManager.js';
    import { notificationService } from "../../services/notificationService";
    import { checkForUpdate, showUpdateNotification } from "../../utils/updateChecker.js";
    import BetaTag from "../ui/BetaTag.svelte";

    let totalRam = null;
    let ramSize;

    onMount(async () => {
        totalRam = await getTotalSystemRamGB();
        ramSize = totalRam
    });

    let activeTab = 'General';
    let currentTheme = 'light';
    let currentLang = 'english';

    let bannerClickCount = 0;
    const REQUIRED_CLICKS = 9;
    const WARNING_THRESHOLD = 4;
    
    // Update check variables
    let checkingForUpdates = false;
    let updateCheckResult = null;

    $: currentLauncherStyle = $settings?.general?.appearance?.launcherStyle?.value;
    $: themesOptions = [
        // Classic themes
        { value: 'light', label: $t('settings.general.appearance.theme.themes.light'), colors: ['#ffffff', '#307E3D', '#23272a'] },
        { value: 'dark', label: $t('settings.general.appearance.theme.themes.dark'), colors: ['#181818', '#307E3D', '#FFFFFF'] },

        // Custom themes
        { value: 'peach-sherbet', label: $t('settings.general.appearance.theme.themes.peach-sherbet'), colors: ['#fff6f0', '#FF8C69', '#332020'] },
        { value: 'under-the-sea', label: $t('settings.general.appearance.theme.themes.under-the-sea'), colors: ['#08171f', '#18C4C4', '#E8F9F9'] },
        { value: 'dusk-fall', label: $t('settings.general.appearance.theme.themes.dusk-fall'), colors: ['#1e1627', '#D77B48', '#F7EAF2'] },
        { value: 'pretty-in-pink', label: $t('settings.general.appearance.theme.themes.pretty-in-pink'), colors: ['#fff2f5', '#FF4F8B', '#3a202c'] },
        { value: 'retro-revival', label: $t('settings.general.appearance.theme.themes.retro-revival'), colors: ['#141024', '#B44CFF', '#E7E4FF'] },
        { value: 'l.olly.pop', label: $t('settings.general.appearance.theme.themes.lollypop'), colors: ['#fdfaff', '#FF74C6', '#2b2233'] },
        { value: 'candy-cane', label: $t('settings.general.appearance.theme.themes.candy-cane'), colors: ['#fffafa', '#E63946', '#231314'] },
    ];


    $: langOptions = [
        { value: 'en', label: 'English' },
        { value: 'tr', label: 'Türkçe' },
        { value: 'fr', label: 'Français' },
        { value: 'es', label: 'Español' }
    ];
    $: {
        if ($settings?.launcher?.integration?.discordRichPresence?.value !== undefined) {
            const isEnabled = $settings.launcher?.integration?.discordRichPresence?.value;
            discordRPCManager.updateSettings(isEnabled).then(() => {
                if (isEnabled) {
                    discordRPCManager.refreshActivity();
                }
            }).catch(error => {
                console.error('Failed to update Discord RPC settings:', error);
            });
        }
    };

    function setTab(tab) {
        activeTab = tab;
    }

    function handleThemeChange(e){
        settings.updatePath('general.appearance.theme', e.detail.value)
        document.body.setAttribute('data-theme', e.detail.value);
    }

    function handleLangChange(e){
        const newLang = e.detail.value;
        currentLocale.set(newLang);
        settings.updatePath('general.appearance.language', e.detail.value)
    }

    function handleReset(){
        settings.reset();
    }

    let ramPercent = 0;
    let dragging = false;

    function handlePointerDown(e) {
        dragging = true;
        updateRamPercent(e);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }

    function handlePointerMove(e) {
        if (dragging) updateRamPercent(e);
    }

    function handlePointerUp() {
        dragging = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    }

    function updateRamPercent(e) {
        const slider = document.getElementById('ram-slider-track');
        const rect = slider.getBoundingClientRect();
        let x = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = ((x - rect.left) / rect.width) * 99;
        percent = Math.max(0, Math.min(99, percent));
        ramPercent = Math.round(percent);

        // Calculate selected RAM in GB
        const selectedRam = Math.max(1, Math.round((ramPercent / 99) * (ramSize - 1) + 1));

        // Save to settings (if you want to persist it)
        settings.updatePath('game.performance.ramAllocation.max', selectedRam);

        // Optional: log for debugging
        console.log('Selected RAM:', selectedRam, 'GB');
    }

    // This will run whenever ramSize or the saved value changes
    $: if (ramSize && $settings.game?.performance?.ramAllocation?.max?.value) {
        // Clamp to min/max
        const selectedRam = Math.max(1, Math.min($settings.game?.performance?.ramAllocation?.max?.value, ramSize));
        // Inverse of your slider formula:
        ramPercent = Math.round(((selectedRam - 1) / (ramSize - 1)) * 99);
    }

    function handleBannerClick() {
        if ($settings.developer?.isDeveloper?.value) {
            showToast(`${$t('settings.about.alreadyADevMessage')}`, 'info', 1000);
            return;
        }
        bannerClickCount++;
        
        const remainingClicks = REQUIRED_CLICKS - bannerClickCount;
       
        if(remainingClicks === 0){
            settings.updatePath('developer.isDeveloper', true);
            showToast($t('settings.about.devUnlockedMessage'), 'info', 4000);
            bannerClickCount = 0;
        }
        
        // Reset counter if user stops clicking for too long
        setTimeout(() => {
            if (bannerClickCount < REQUIRED_CLICKS) {
                bannerClickCount = 0;
            }
        }, 10000); // Reset after 10 seconds of inactivity
    }
    
    // Manual update check function
    async function handleCheckForUpdates() {
        if (checkingForUpdates) return;
        
        checkingForUpdates = true;
        updateCheckResult = null;
        
        try {
            // Use our shared manual version check
            const updateInfo = await checkForUpdate();
            
            if (updateInfo?.available) {
                // Update available
                updateCheckResult = { 
                    type: 'success', 
                    message: 'Update available!', 
                    updateInfo: updateInfo 
                };
                
                // Show the update dialog
                await showUpdateNotification(updateInfo);
            } else if (updateInfo) {
                // No update available
                updateCheckResult = { 
                    type: 'info', 
                    message: 'Your launcher is up to date!' 
                };
                showToast('Your launcher is up to date!', 'info', 3000);
            } else {
                // Error checking for updates
                updateCheckResult = { 
                    type: 'error', 
                    message: 'Failed to check for updates (GitHub API unavailable)' 
                };
                showToast('Failed to check for updates', 'error', 3000);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
            updateCheckResult = { 
                type: 'error', 
                message: error.message || 'An unexpected error occurred' 
            };
            showToast('Error checking for updates', 'error', 3000);
        } finally {
            checkingForUpdates = false;
        }
    }

    // derived value for label position (as percent)
	$: labelPos = Math.round(
		(ramPercent / 99) * (Math.min(ramSize, 16) - 1)
	) / (Math.min(ramSize, 16) - 1) * 100;

	// clamp the label so it never goes out of bounds
	$: clampedLabelPos = Math.min(Math.max(labelPos, 0), 100);

	// optional pixel shift for left/right edge adjustments
	$: offset = 
		clampedLabelPos <= 2 ? 0 : 
		clampedLabelPos >= 98 ? -50 : 
		-18;
</script>

<div class="settings">
    <div class="s-wrapper">
        <div class="sidebar">
            <div class="sb-header">
                <span class="header-title">
                    <i class="fa fa-gear"></i>
                    {$t('settings.title')}
                </span>
            </div>
            <div class="sb-category-container">
                <div class="sb-category-item">
                    <button class="cf-btn {activeTab === 'General' ? 'active-tab' : ''}" onclick={() => setTab('General')}>{$t('settings.tabs.general')}</button>
                    <button class="cf-btn {activeTab === 'Launcher' ? 'active-tab' : ''}" onclick={() => setTab('Launcher')}>{$t('settings.tabs.launcher')}</button>
                    <button class="cf-btn {activeTab === 'Game' ? 'active-tab' : ''}" onclick={() => setTab('Game')}>{$t('settings.tabs.game')}</button>
                    <button class="cf-btn {activeTab === 'Storage' ? 'active-tab' : ''}" onclick={() => setTab('Storage')}>{$t('settings.tabs.storage')}</button>
                    {#if $settings.developer?.isDeveloper?.value}
                        <button class="cf-btn {activeTab === 'Developer' ? 'active-tab' : ''}" onclick={() => setTab('Developer')}>{$t('settings.tabs.developer')}</button>
                    {/if}
                    <button class="cf-btn {activeTab === 'About' ? 'active-tab' : ''}" onclick={() => setTab('About')}>{$t('settings.tabs.about')}</button>
                </div>
            </div>
        </div>
        <div class="right-content">
            <div class="top-content-container setting-content-container">
                {#if activeTab === 'General'}
                    <div class="setting-group general-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.general.appearance.label')}</span>
                            <div class="sub-item-group px-0">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.general.appearance.theme.label')}</span>
                                    <span class="group-description">{$t('settings.general.appearance.theme.description')}</span>
                                    <div class="theme-cards-container">
                                        {#each themesOptions as theme(theme.label)}
                                            <ThemeCard 
                                                value={theme.value}
                                                displayName={theme.label}
                                                selected={$settings.general?.appearance?.theme?.value === theme.value}
                                                colors={theme.colors}
                                                on:selecttheme={handleThemeChange}
                                            />
                                        {/each}
                                    </div>
                                </div>
                            </div>

                            <hr class="setting-seperator">
                            <div class="sub-item-group px-0">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.general.appearance.language.label')}</span>
                                <span class="group-description">{$t('settings.general.appearance.language.description')}</span>
                                </div>
                                <CustomOptions
                                    options={langOptions}
                                    id="langauge"
                                    preferredPosition="up"
                                    value={$settings.general?.appearance?.language?.value}
                                    on:optionchange={handleLangChange}
                                />
                            </div>
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'Game'}
                    <div class="setting-group game-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.game.performance.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.game.performance.ramAllocation')}</span>
                                <span class="group-description">{$t('settings.game.performance.ramAllocationDescription')}</span>
                                </div>
                            </div>
                            <br/>
                            <div class="ram-slider-container">
                                <span class="min-ram rsize">1%</span>
                                <div class="slider-container">
                                    <!-- RAM usage bars -->
                                    {#each Array(ramSize) as _, i}
                                        <div
                                            class="usage"
                                            style="
                                                width: {100 / ramSize}%;
                                                background-color: 
                                                    {i < ramSize * 0.1
                                                        ? 'red'
                                                        : i < ramSize * 0.7
                                                            ? 'green'
                                                            : 'yellow'};
                                            "
                                        ></div>
                                    {/each}

                                    <!-- Ticks: show at most 16 evenly spaced ticks -->
                                    {#each Array(Math.min(ramSize, 16)) as _, i}
                                        <div
                                            class="slider-tick"
                                            style="
                                                position: absolute;
                                                left: calc({(i / (Math.min(ramSize, 16) - 1)) * 100}% - 1px);
                                                width: 2px;
                                                height: 23%;
                                                background: #ffffff8d;
                                                pointer-events: none;
                                            "
                                        ></div>
                                    {/each}

                                    <!-- Labels: show at most 8 evenly spaced labels -->
                                    {#each Array(Math.min(ramSize, 8)) as _, i}
                                        <div
                                            class="slider-label"
                                            style="
                                                position: absolute;
                                                left: calc({(i / (Math.min(ramSize, 8) - 1)) * 100}% - 12px);
                                                top: 40px;
                                                font-size: 0.8em;
                                                color: #fff1d;
                                                font-weight: 100 !important;
                                                opacity: 0.8;
                                                width: 24px;
                                                text-align: center;
                                                pointer-events: none;
                                            "
                                        >{Math.round((i / (Math.min(ramSize, 8) - 1)) * ramSize)}GB</div>
                                    {/each}

                                    <!-- Draggable RAM slider, snapped to ticks -->
                                    <div
                                        id="ram-slider-track"
                                        style="
                                            background-color: #3233334d;
                                            position: absolute; left: 0%; top: 50%; width: 100%; height: 24px; transform: translateY(-50%); cursor: pointer; z-index: 2;"
                                        onpointerdown={handlePointerDown}
                                    >
                                        <div
                                            class="ram-slider-thumb"
                                            style="
                                                position: absolute;
                                                left: calc(
                                                    {
                                                        // Snap thumb to nearest tick
                                                        Math.round(
                                                            (ramPercent / 99) * (Math.min(ramSize, 16) - 1)
                                                        ) / (Math.min(ramSize, 16) - 1) * 100
                                                    }% - 4px
                                                );
                                                top: 0;
                                                width: 4px;
                                                height: 15%;
                                                background: black;
                                                border: 2px solid #fff;
                                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                                                cursor: grab;
                                                transition: background 0.2s;
                                                z-index: 3;
                                            "
                                        ></div>
                                        <!-- Show current RAM value above the thumb -->
                                        <div
                                            class="ram-slider-value"
                                            style="
                                                position: absolute;
                                                left: calc({clampedLabelPos}% + {offset}px);
                                                top: -28px;
                                                background: #222b;
                                                color: #fff;
                                                padding: 2px 8px;
                                                border-radius: 6px;
                                                font-size: 0.9em;
                                                font-weight: 500;
                                                pointer-events: none;
                                                z-index: 10;
                                                min-width: 32px;
                                                text-align: center;
                                            "
                                        >
                                            {$settings.game?.performance?.ramAllocation?.max?.value}GB
                                        </div>
                                    </div>
                                </div>
                                <span class="max-ram rsize">100%</span>
                            </div>
                            <br/> 
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.game.runtime.label')}</span>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.game.runtime.javaPath')}</span>
                                <span class="group-description">{$t('settings.game.runtime.javaPathDescription')}</span>    
                                </div>
                                <FolderPicker
                                    actionType='pick'
                                    value={$settings.game?.runtime?.javaPath?.value}
                                    on:change={e => settings.updatePath('game.runtime.javaPath', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div> 
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.game.runtime.gameArgs')}</span>
                                    <span class="group-description">{$t('settings.game.runtime.gameArgsDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    class="s-input"
                                    value={$settings.game?.runtime?.gameArgs?.value}
                                    placeholder="e.g. java -Xmx4G -jar minecraft.jar"
                                    oninput={e => settings.updatePath('game.runtime.gameArgs', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.game.runtime.jvmArguments')}</span>
                                    <span class="group-description">{$t('settings.game.runtime.jvmArgumentsDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    class="s-input"
                                    value="{$settings.game?.runtime?.JVMArgs?.value}"
                                    placeholder="e.g. -Xmx4G -XX:+UseG1GC"
                                    oninput={e => settings.updatePath('game.runtime.JVMArgs', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.game.runtime.environmentVariables')}</span>
                                    <span class="group-description">{$t('settings.game.runtime.environmentVariablesDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    value="{$settings.game?.runtime?.environmentVariables?.value}"
                                    class="s-input"
                                    placeholder="e.g. JAVA_HOME=/usr/lib/jvm/java-17"
                                    oninput={e => settings.updatePath('game.runtime.environmentVariables', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.game.runtime.runDetached')}</span>
                                    <span class="group-description">{$t('settings.game.runtime.runDetachedDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.game?.runtime?.runDetached?.value}
                                    on:change={(e) => settings.updatePath('game.runtime.runDetached', e.detail.checked)}
                                />
                            </div>
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'Launcher'}
                    <div class="setting-group network-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.launcher.updates')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.launcher.checkForUpdates')}</span>
                                <span class="group-description">{$t('settings.launcher.checkForUpdatesDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher?.updates?.checkForUpdates?.value}
                                    on:change={(e) => settings.updatePath('launcher.updates.checkForUpdates', e.detail.checked)}
                                />
                            </div>                      
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.launcher.integration.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">
                                        {$t('settings.launcher.integration.discordRPC')}
                                        <BetaTag />
                                    </span>
                                    <span class="group-description">{$t('settings.launcher.integration.discordRPCDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher?.integration?.discordRichPresence?.value}
                                    on:change={(e) => settings.updatePath('launcher.integration.discordRichPresence', e.detail.checked)}
                                />
                            </div>
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.launcher.notification.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.launcher.notification.systemNotifications')}</span>
                                    <span class="group-description">{$t('settings.launcher.notification.systemNotificationsDescription')}</span>    
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher?.notification?.systemNotifications?.value}
                                    on:change={(e) => settings.updatePath('launcher.notification.systemNotifications', e.detail.checked)}
                                />
                            </div>
                            
                            <!-- Update Notifications -->
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.launcher.notification.showUpdateNotification')}</span>
                                    <span class="group-description">{$t('settings.launcher.notification.showUpdateNotificationDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher?.notification?.updateNotification?.value}
                                    on:change={(e) => settings.updatePath('launcher.notification.updateNotification', e.detail.checked)}
                                />
                            </div>
                            
                            <!-- Sound Settings -->
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.launcher.notification.playSound')}</span>
                                    <span class="group-description">{$t('settings.launcher.notification.playSoundDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher?.notification?.playSound?.value}
                                    on:change={(e) => {
                                        settings.updatePath('launcher.notification.playSound', e.detail.checked);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'Storage'}
                    <div class="setting-group storage-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.storage.folders')}</span>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.storage.launcherFolder')}</span>
                                    <span class="group-description">{$t('settings.storage.launcherFolderDescription')}</span>
                                </div>
                                <FolderPicker
                                    actionType="open"
                                    inputReadOnly={true}
                                    value={$settings.storage?.directories?.launcherFolder?.value}
                                    on:change={e => settings.updatePath('storage.directories.launcherFolder', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div>                                           
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.storage.minecraftFolder')}</span>
                                    <span class="group-description">{$t('settings.storage.minecraftFolderDescription')}</span>
                                </div>
                                <FolderPicker
                                    actionType='open'
                                    inputReadOnly={true}
                                    value={$settings.storage?.directories?.minecraftFolder?.value}
                                    on:change={e => settings.updatePath('storage.directories.minecraftFolder', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div>                                           
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.storage.modFolder')}</span>
                                    <span class="group-description">{$t('settings.storage.modFolderDescription')}</span>
                                </div>
                                <FolderPicker
                                    actionType='open'
                                    inputReadOnly={true}
                                    value={$settings.storage?.directories?.minecraftFolder?.value+'/mods'}
                                    on:change={e => settings.updatePath('storage.directories.minecraftFolder', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div>                                           
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'Developer'}
                    <div class="setting-group developer-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.developer.experimental')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.developer.allowBetaFeatures')}</span>

                                    <span class="group-description">{$t('settings.developer.allowBetaFeaturesDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.developer?.experimental?.allowBetaFeatures?.value}
                                    on:change={(e) => settings.updatePath('developer.experimental.allowBetaFeatures', e.detail.checked)}
                                />
                            </div>
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'About'}
                    <div class="setting-group about-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="banner" onclick={handleBannerClick}></div>
                            </span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.version')}</span>
                                    <span class="group-description">v{$appVersion}</span>
                                </div>
                                <button 
                                    class="check-update-btn {checkingForUpdates ? 'loading' : ''}"
                                    onclick={handleCheckForUpdates}
                                    disabled={checkingForUpdates}
                                >
                                    {#if checkingForUpdates}
                                        <i class="fa fa-spinner fa-spin"></i> Checking...
                                    {:else}
                                        {$t('settings.about.checkForUpdates')}
                                    {/if}
                                </button>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.credits')}</span>
                                    <span class="group-description">
                                        {@html $t('settings.about.developedBy')}.<br>

                                        {$t('settings.about.specialThanks')}
                                    </span>
                                </div>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.openSourceLibraries')}</span>
                                    <span class="group-description">
                                        <ul>
                                            <li>
                                                <a href="https://svelte.dev/" target="_blank" rel="noopener noreferrer">
                                                    Svelte - Reactive UI Framework
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">
                                                    Font Awesome - Icon Library
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://skin3d.vercel.app/" target="_blank" rel="noopener noreferrer">
                                                    Skin3d - 3d skin rendering
                                                </a>
                                            </li>
                                            <li>
                                                {$t('settings.about.extraOpenSourceLibrariesDescription')}
                                            </li>
                                        </ul>
                                    </span>
                                </div>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.apisUsed')}</span>
                                    <span class="group-description">
                                        <ul>
                                            <li>
                                                <a href="https://github.com/cosmic-fi/ori-mcc" target="_blank" rel="noopener noreferrer">
                                                    Ori MCC - Game launching & version management
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://www.npmjs.com/package/msmc" target="_blank" rel="noopener noreferrer">
                                                    MSMC - Authentication & Account refreshing
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://lunareclipse.studio/creations/starlight-skinapi" target="_blank" rel="noopener noreferrer">
                                                    Starlight Skins - Skin API
                                                </a>
                                            </li>
                                        </ul>
                                    </span>
                                </div>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.sourceCode')}</span>

                                    <span class="group-description">
                                        <a href="https://github.com/cosmic-fi/ori-launcher" target="_blank">Github Repository</a>
                                    </span>
                                </div>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label"><i class="fa fa-heart"></i>&nbsp;&nbsp;&nbsp;{$t('settings.about.donate')}</span>

                                    <span class="group-description" style="margin-top: 0.5em;">
                                        {$t('settings.about.donateDescription')} <a href="https://www.buymeacoffee.com/cosmic_fi" target="_blank" rel="noopener noreferrer"><i class="fa fa-heart"></i>&nbsp;{$t('settings.about.donateButton')}</a>
                                    </span>
                                </div>
                            </div>
                            <hr class="setting-seperator">
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.disclaimer')}</span>
                                    <span class="group-description">
                                        {$t('settings.about.disclaimerDescription')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            <div class="save-btn-container">
                <button 
                    class="setting-reset-btn settings-rest-btn"
                    onclick={handleReset}
                    >{$t('settings.buttons.resetToDefault')}</button>
                <button class="setting-save-btn btn-accent  ss settings-close-btn" onclick={() => uiState.toggleModel.set('none')}>{$t('settings.buttons.close')}</button>
            </div>
        </div>
    </div>
</div>

<style>
    .settings {
        position: absolute;
        z-index: 9999;
        background-color: var(--shadow-color);
        width: 100%;
        height: 100%;
        display: flex;
        top: 0;
        left: 0;
        justify-content: center;
        align-items: center;
        transition: all .3s ease;
        backdrop-filter: blur(3px);
        overflow: hidden;

        .s-wrapper {
            border: 2px var(--border-color) solid;
            border-radius: 12px;
            display: flex;
            flex-direction: row;
            overflow: hidden;

            .sidebar {
                background-color: var(--overlay-color-1);
                width: 14vw;
                display: flex;
                flex-direction: column;
                border-right: 1px var(--border-color) solid;

                .sb-header {
                    border-bottom: 1px var(--border-color) solid;
                    padding: 1vw;
                    display: flex;

                    .header-title {
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        font-size: var(--font-size-fluid-lg);
                        column-gap: 8px;
                        color: var(--text-color);
                        justify-content: start;
                        flex-grow: 1;
                    }
                }

                .sb-category-container {
                    display: flex;
                    flex-direction: column;
                    row-gap: 1vw;
                    padding-top: 2vw;

                    .sb-category-item {
                        display: flex;
                        flex-direction: column;
                        font-size: var(--font-size-fluid-base);

                        button {
                            padding: .7vw 1.3vw;
                            color: var(--text-color-muted);
                            font-size: .98rem;
                            text-align: start;

                            &:hover {
                                background-color: var(--accent-color-overlay);
                                color: var(--text-color);
                            }

                            &:active {
                                background-color: var(--accent-color);
                                transform: none !important;
                                color: var(--text-color)
                            }

                            &:focus {
                                background-color: var(--accent-color);
                                color: var(--text-color);
                            }
                        }

                        .active-tab {
                            background-color: var(--accent-color);
                            border-right: 4px var(--accent-color-light) solid;
                            color: var(--text-color)
                        }
                    }
                }
            }

            .right-content {
                width: 50vw;
                display: flex;
                flex-direction: column;
                background-color: var(--surface-color);

                .top-content-container {
                    height: 60vh;
                    margin: .5vw .3vw;
                    overflow: hidden;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;

                    .setting-group {
                        display: flex;
                        flex-direction: column;
                        padding: 15px 10px 5px 10px;

                        .setting-item-group {
                            display: flex;
                            flex-direction: column;
                            row-gap: 1vw;

                            .group-sub-label {
                                opacity: .8;
                                font-size: 1rem;
                                color: var(--text-color-muted);
                            }

                            .group-description {
                                font-size: var(--font-size-fluid-sm);
                                color: var(--text-color-muted)
                            }

                            .sub-item-group {
                                display: flex;
                                flex-direction: row;
                                color: var(--text-color);
                                justify-content: space-between;
                                align-items: center;
                                padding-left: 10px;
                                column-gap: 20px;

                                .toggle-label-group {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: start;
                                    width: 80%;
                                }
                                .toggle-label{
                                    position: relative;
                                }

                                .s-input {
                                    background-color: var(--overlay-color);
                                    padding: 1vw;
                                    border-radius: var(--border-radius-5);
                                    margin-top: .5vw;
                                    color: var(--text-color-muted);
                                    border: 1px var(--border-color) solid;
                                    &:focus {
                                        box-shadow: 0 0 0 2px var(--accent-color-light);
                                    }
                                }
                            }
                            .folder-item-group {
                                flex-direction: column !important;
                                justify-content: start;
                                align-items: start;
                            }
                        }

                        .setting-seperator {
                            width: 100%;
                            background-color: transparent;
                            border: none;
                            border-top: 1px var(--border-color) solid;
                            opacity: .5;
                        }
                    }
                }

                .save-btn-container {
                    flex-grow: 1;
                    border-top: 1px var(--border-color) solid;
                    padding: 1vw;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    background-color: var(--base-variant);

                    button {
                        padding: .5vw 2vw;
                        border-radius: var(--border-radius-5);
                        color: var(--text-color);
                        border: 1px var(--border-color) solid;
                        font-size: var(--font-size-fluid-base);

                        &:hover {
                            background-color: var(--accent-color-dark);
                        }

                        &:active {
                            background-color: var(--accent-color);
                        }
                    }

                    .setting-reset-btn {
                        background-color: var(--overlay-color);
                        color: var(--text-color) !important;

                        &:hover {
                            background-color: var(--overlay-color-1);
                        }

                        &:active {
                            background-color: transparent;
                        }
                    }
                }
            }
        }
    }

    .theme-cards-container{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 10px;
        width: 30rem;
        margin-top: 10px;
    }
    .ram-slider-container {
        margin-top: .5vw;
        margin-bottom: 1rem;
        display: flex;
        width: 45vw;
        justify-content: center;
        column-gap: .5vw;
        align-items: center;
        flex-direction: row;
        position: relative;
    }
    .slider-container{
        background-color: var(--overlay-color-1);
        width: 45vw;
        position: relative;
        display: flex;
        flex-direction: row;
        padding: .8vw 0;
        align-items: center;
    }
    .usage{
        width: 1%;
        content: '';
        height: 3vw;
        opacity: .4;
    }
    .slider-label{
        font-weight: 100;
        display: none;
    }
    .rsize{
        font-size: .8rem;
        position: absolute;
    }
    .min-ram{
        left: 0;
        bottom: -20px;
        color: var(--text-color-muted);
    }
    .s-input{
        width: 96%;
    }
    .max-ram{
        right: 0;
        bottom: -20px;
        color: var(--text-color-muted);
    }
    .banner{
        width: 100%;
        height: 10vw;
        display: flex;
        background: url('/images/static/0.png');
        overflow: hidden;
        background-position: center;
        background-size: cover;
        background-color: var(--overlay-color);
        background-repeat: no-repeat;
        border-bottom: 5px var(--accent-color-light) solid;
    }
    :global(.credit-owner-text){
        opacity: 1 !important;
        color: var(--accent-color) !important;
    }
    .check-update-btn{
        white-space: nowrap;
        background-color: var(--overlay-color-1);
        padding: .7vw 1vw;
        border-radius: var(--border-radius-5);
    }
</style>
