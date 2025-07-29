<script>
// @ts-nocheck

    import { showToast, uiState } from "../../stores/ui";
    import CustomOptions from "../ui/CustomOptions.svelte";
    import FolderPicker from "../ui/FolderPicker.svelte";
    import ToggleButton from "../ui/ToggleButton.svelte";
    import { settings } from "../../stores/settings";
    import { onMount } from "svelte";
    import { getTotalSystemRamGB } from "../../utils/helper";
    import SimpleTip from "../ui/SimpleTip.svelte";
    import { currentLocale, t } from "../../stores/i18n";
    import { appVersion } from "../../utils/version";
    import ThemeCard from "../ui/ThemeCard.svelte";
  import ResolutionPicker from "../ui/ResolutionPicker.svelte";

    let totalRam = null;
    let ramSize;

    onMount(async () => {
        totalRam = await getTotalSystemRamGB();
        ramSize = totalRam
    });

    let activeTab = 'General';
    let currentTheme = 'light';
    $: themesOptions = [
        { value: 'light', label: $t('settings.appearance.theme.themes.light'), colors: ['#f5f6fa', '#5865f2', '#23272a'] },
        { value: 'dark', label: $t('settings.appearance.theme.themes.dark'), colors: ['#111011', '#1F5ADA', '#FFFFFF'] },
        { value: 'minimal', label: $t('settings.appearance.theme.themes.minimal'), colors: ['#ffffff', '#007aff', '#222222'] },
        { value: 'after-glow', label: $t('settings.appearance.theme.themes.after-glow'), colors: ['#232136', '#eb6f92', '#e0def4'] },
        { value: 'retro-80s', label: $t('settings.appearance.theme.themes.retro-80s'), colors: ['#1a1a2e', '#e94560', '#f5f6fa'] },
        { value: 'oceanic', label: $t('settings.appearance.theme.themes.oceanic'), colors: ['#1b2b34', '#6699cc', '#d8dee9'] },
        { value: 'pastel', label: $t('settings.appearance.theme.themes.pastel'), colors: ['#fdf6f0', '#ffb4a2', '#6d6875'] },
    ]
    function setTab(tab) {
        activeTab = tab;
    }
    function handleThemeChange(e){
        settings.updatePath('general.appearance.theme', e.detail.value)
        document.body.setAttribute('data-theme', e.detail.value);
    }
    let currentLang = 'english';
    
    let langOptions = [
        { value: 'en', label: 'English' },
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'tr', label: 'Türkçe' },
        { value: 'fr', label: 'Français' },
        { value: 'ru', label: 'Русский' },
        { value: 'es', label: 'Español' },
        { value: 'jp', label: '日本語' },
        { value: 'ar', label: 'العربية' },
    ]
    function handleLangChange(e){
        const newLang = e.detail.value;
        currentLocale.set(newLang);
        settings.updatePath('general.appearance.language', e.detail.value)
    }
    function handleReset(){
        settings.reset();
    }
    function handleResolutionPick(e) {
        if (e.detail.width === 'fullscreen') {
            settings.updatePath('game.resolution.fullscreen', true);
        } else {
            settings.updatePath('game.resolution.fullscreen', false);
            settings.updatePath('game.resolution.width', e.detail.width);
            settings.updatePath('game.resolution.height', e.detail.height);
        }
    }
    let ramPercent = 0; // 0-100
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
    $: if (ramSize && $settings.game.performance.ramAllocation.max.value) {
        // Clamp to min/max
        const selectedRam = Math.max(1, Math.min($settings.game.performance.ramAllocation.max.value, ramSize));
        // Inverse of your slider formula:
        ramPercent = Math.round(((selectedRam - 1) / (ramSize - 1)) * 99);
    }

    let contributors = [];

    onMount(async () => {
        try {
            const res = await fetch('https://api.github.com/repos/cosmic-fi/Ori-Launcher/contributors');
            if (res.ok) {
                contributors = await res.json();
            }
        } catch (e) {
            contributors = [];
        }
    });

    let bannerClickCount = 0;
    const REQUIRED_CLICKS = 9;
    const WARNING_THRESHOLD = 4;

    function handleBannerClick() {
        // Check if user is already a developer
        if ($settings.developer.isDeveloper.value) {
            showToast('You are already a developer! 😹', 'info', 1000);
            return;
        }
        bannerClickCount++;
        
        const remainingClicks = REQUIRED_CLICKS - bannerClickCount;
        
        if (remainingClicks === WARNING_THRESHOLD) {
            showToast(`Hmm what was that for!`, 'info', 500);
        } else if (remainingClicks === 0) {
            // Activate developer mode
            settings.updatePath('developer.isDeveloper', true);
            showToast('Developer mode activated! 😹', 'info', 4000);
            bannerClickCount = 0; // Reset counter
        } else if (remainingClicks > 0 && remainingClicks < WARNING_THRESHOLD) {
            showToast(`${remainingClicks} clicks left to activate developer mode!`, 'info', 500);
        }
        
        // Reset counter if user stops clicking for too long
        setTimeout(() => {
            if (bannerClickCount < REQUIRED_CLICKS) {
                bannerClickCount = 0;
            }
        }, 10000); // Reset after 10 seconds of inactivity
    }
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
                    <button class="cf-btn {activeTab === 'Game' ? 'active-tab' : ''}" onclick={() => setTab('Game')}>{$t('settings.tabs.game')}</button>
                    <button class="cf-btn {activeTab === 'Launcher' ? 'active-tab' : ''}" onclick={() => setTab('Launcher')}>{$t('settings.tabs.launcher')}</button>
                    <button class="cf-btn {activeTab === 'Storage' ? 'active-tab' : ''}" onclick={() => setTab('Storage')}>{$t('settings.tabs.storage')}</button>
                    {#if $settings.developer.isDeveloper.value}
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
                        <span class="group-sub-label">{$t('settings.appearance.label')}</span>
                        <div class="sub-item-group px-0">
                            <div class="toggle-label-group">
                            <span class="toggle-label">{$t('settings.appearance.theme.label')}</span>
                            <span class="group-description">{$t('settings.appearance.theme.description')}</span>
                            <div class="theme-cards-container">
                                {#each themesOptions as theme(theme.label)}
                                    <ThemeCard 
                                        value={theme.value}
                                        displayName={theme.label}
                                        selected={$settings.general.appearance.theme.value === theme.value}
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
                            <span class="toggle-label">{$t('settings.appearance.language.label')}</span>
                            <span class="group-description">{$t('settings.appearance.language.description')}</span>
                            </div>
                            <CustomOptions
                                options={langOptions}
                                id="langauge"
                                value={$settings.general.appearance.language.value}
                                on:optionchange={handleLangChange}
                            />
                        </div>
                    </div>
                    <hr class="setting-seperator">
                    <div class="setting-item-group">
                        <span class="group-sub-label">{$t('settings.startup.label')}</span>

                        <div class="sub-item-group">
                            <div class="toggle-label-group">
                            <span class="toggle-label">{$t('settings.startup.autoStart')}</span>
                            <span class="group-description">{$t('settings.startup.autoStartDescription')}</span>
                            </div>
                            <ToggleButton
                                checked={$settings.general.startup.autoStart.value}
                                on:change={(e) => settings.updatePath('general.startup.autoStart', e.detail.checked)}
                            />
                        </div>                      
                        <div class="sub-item-group">
                            <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.startup.minimizeToTray')}</span>
                                <span class="group-description">{$t('settings.startup.minimizeToTrayDescription')}</span>
                            </div>
                            <ToggleButton
                                checked={$settings.general.startup.minimizeToTray.value}
                                on:change={(e) => settings.updatePath('general.startup.minimizeToTray', e.detail.checked)}
                            />
                        </div>                      
                    </div>
                    </div>
                {/if}
                {#if activeTab === 'Game'}
                    <div class="setting-group game-settings">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.game.versions')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.game.showSnapshots')}</span>
                                <span class="group-description">{$t('settings.game.showSnapshotsDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.game.versions.allowSnapshotVersions.value}
                                    on:change={e => settings.updatePath('game.versions.allowSnapshotVersions', e.detail.checked)}
                                />
                            </div>                      
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.performance.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.performance.ramAllocation')}</span>

                                <span class="group-description">{$t('settings.performance.ramAllocationDescription')}</span>
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
                                                left: calc(
                                                    {
                                                        Math.round(
                                                            (ramPercent / 99) * (Math.min(ramSize, 16) - 1)
                                                        ) / (Math.min(ramSize, 16) - 1) * 100
                                                    }% - 18px
                                                );
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
                                            {$settings.game.performance.ramAllocation.max.value}GB
                                        </div>
                                    </div>
                                </div>
                                <span class="max-ram rsize">100%</span>
                            </div>
                            <br/> 
                        </div>
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.game.display.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.game.display.resolution')}</span>
                                <span class="group-description">{$t('settings.game.display.resolutionDescription')}</span>
                                </div>
                               <ResolutionPicker 
                                    width={$settings.game.resolution.width.value}
                                    height={$settings.game.resolution.height.value || 1080}
                                    fullscreen={$settings.game.resolution.fullscreen.value || false}
                                    on:resolutionchange={handleResolutionPick}
                                />
                            </div>                      
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.runtime.label')}</span>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.runtime.javaPath')}</span>

                                <span class="group-description">{$t('settings.runtime.javaPathDescription')}</span>
                                </div>
                                <FolderPicker
                                    value={$settings.game.runtime.javaPath.value}
                                    on:change={e => settings.updatePath('game.runtime.javaPath', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div> 
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.runtime.gameArgs')}</span>
                                    <span class="group-description">{$t('settings.runtime.gameArgsDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    class="s-input"
                                    value={$settings.game.runtime.gameArgs.value}
                                    placeholder="e.g. java -Xmx4G -jar minecraft.jar"
                                    oninput={e => settings.updatePath('game.runtime.gameArgs', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.runtime.jvmArguments')}</span>
                                    <span class="group-description">{$t('settings.runtime.jvmArgumentsDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    class="s-input"
                                    value="{$settings.game.runtime.JVMArgs.value}"
                                    placeholder="e.g. -Xmx4G -XX:+UseG1GC"
                                    oninput={e => settings.updatePath('game.runtime.JVMArgs', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.runtime.environmentVariables')}</span>
                                    <span class="group-description">{$t('settings.runtime.environmentVariablesDescription')}</span>
                                </div>
                                <input
                                    type="text"
                                    value="{$settings.game.runtime.environmentVariables.value}"
                                    class="s-input"
                                    placeholder="e.g. JAVA_HOME=/usr/lib/jvm/java-17"
                                    oninput={e => settings.updatePath('game.runtime.environmentVariables', e.target.value)}
                                />
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.runtime.runDetached')}</span>
                                    <span class="group-description">{$t('settings.runtime.runDetached')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.game.runtime.runDetached.value}
                                    on:change={(e) => settings.updatePath('game.runtime.runDetached', e.detail.checked)}
                                />
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.runtime.runAsAdmin')}</span>
                                    <span class="group-description">{$t('settings.runtime.runAsAdminDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.game.runtime.runAsAdmin.value}
                                    on:change={(e) => settings.updatePath('game.runtime.runAsAdmin', e.detail.checked)}
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
                                    checked={$settings.launcher.updates.checkForUpdates.value}
                                    on:change={(e) => settings.updatePath('launcher.updates.checkForUpdates', e.detail.checked)}
                                />
                            </div>                      
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.integration.label')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.integration.discordRPC')}</span>
                                    <span class="group-description">{$t('settings.integration.discordRPCDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher.integration.discordRichPresence.value}
                                    on:change={(e) => settings.updatePath('launcher.integration.discordRichPresence', e.detail.checked)}
                                />
                            </div>
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.notification.label')}</span>

                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.notification.showUpdateNotification')}</span>
                                    <span class="group-description">{$t('settings.notification.showUpdateNotificationDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher.notification.updateNotification.value}
                                    on:change={(e) => settings.updatePath('launcher.notification.updateNotification', e.detail.checked)}
                                />
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.notification.playSound')}</span>
                                    <span class="group-description">{$t('settings.notification.playSoundDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.launcher.notification.playSound.value}
                                    on:change={(e) => settings.updatePath('launcher.notification.playSound', e.detail.checked)}
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
                                    value={$settings.storage.directories.launcherFolder.value}
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
                                    value={$settings.storage.directories.minecraftFolder.value}
                                    on:change={e => settings.updatePath('storage.directories.minecraftFolder', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div>                                           
                        </div>
                        <hr class="setting-seperator">
                        <div class="setting-item-group">
                            <span class="group-sub-label">{$t('settings.backup.backupSaves')}</span>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.backup.backupSaves')}</span>
                                <span class="group-description">{$t('settings.backup.backupSavesDescription')}</span>
                                </div>
                                <ToggleButton
                                    checked={$settings.storage.backup.backupSaves.value}
                                    on:change={(e) => settings.updatePath('storage.backup.backupSaves', e.detail.checked)}
                                />
                            </div>
                            <div class="sub-item-group folder-item-group">
                                <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.backup.backupFolder')}</span>
                                <span class="group-description">{$t('settings.backup.backupFolderDescription')}</span>
                                </div>
                                <FolderPicker
                                    value={$settings.storage.backup.backupFolder.value}
                                    on:change={e => settings.updatePath('storage.backup.backupFolder', e.detail.value)}
                                    placeholder="{$t('folderPicker.noFolderSelected')}"
                                />
                            </div> 
                        </div>
                    </div>
                {/if}
                {#if activeTab === 'Developer'}
                    <div class="setting-group developer-settings">
                    <div class="setting-item-group">
                        <span class="group-sub-label">{$t('settings.developer.debug')}</span>
                        <div class="sub-item-group">
                            <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.developer.enableDevTools')}</span>
                                <span class="group-description">{$t('settings.developer.enableDevToolsDescription')}</span>
                            </div>
                            <ToggleButton
                                checked={$settings.developer.debug.enableDevTools.value}
                                on:change={(e) => settings.updatePath('developer.debug.enableDevTools', e.detail.checked)}
                            />
                        </div>
                    </div>
                    <hr class="setting-seperator">
                    <div class="setting-item-group">
                        <span class="group-sub-label">{$t('settings.developer.experimental')}</span>
                        <div class="sub-item-group">
                            <div class="toggle-label-group">
                                <span class="toggle-label">{$t('settings.developer.allowBetaFeatures')}</span>

                                <span class="group-description">{$t('settings.developer.allowBetaFeaturesDescription')}</span>
                            </div>
                            <ToggleButton
                                checked={$settings.developer.experimental.allowBetaFeatures.value}
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
                                <button class="check-update-btn">{$t('settings.about.checkForUpdates')}</button>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label">{$t('settings.about.credits')}</span>
                                    <span class="group-description">
                                        {$t('settings.about.developedBy')} <b class="credit-owner-text">Cosmic</b>&nbsp;&&nbsp;<b class="credit-owner-text">Olly</b>.<br>

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
                                                    Svelte
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer">
                                                    Font Awesome
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
                                                <a href="https://wiki.vg/Minecraft_Forge_API" target="_blank" rel="noopener noreferrer">
                                                    Minecraft API
                                                </a>
                                            </li>
                                            <li>
                                                <a href="https://discord.com/developers/docs/rich-presence/how-to" target="_blank" rel="noopener noreferrer">
                                                    Discord Rich Presence
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
                                        {$t('settings.about.donateDescription')} <a href="https://www.buymeacoffee.com/cosmic_fi" target="_blank" rel="noopener noreferrer"><i class="fa fa-heart"></i>&nbsp;{$t('mainContent.supportProject')}</a>
                                    </span>
                                </div>
                            </div>
                            <div class="sub-item-group">
                                <div class="toggle-label-group">
                                    <span class="toggle-label"><i class="fa fa-users"></i>&nbsp;&nbsp;&nbsp;{$t('settings.about.contributors')}</span>

                                    <span class="group-description" style="margin-top: 0.5em;">
                                        <div class="contributors-container">
                                            {#each contributors as contributor}
                                                <SimpleTip text="{contributor.login}" direction="bottom">
                                                    <a href={contributor.html_url} target="_blank" rel="noopener noreferrer">
                                                        <img src={contributor.avatar_url} alt={contributor.login} width="24" height="24" style="border-radius:50%;vertical-align:middle;margin-right:8px;">
                                                    </a>
                                                </SimpleTip>
                                            {/each}
                                        </div>
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
                <button class="setting-save-btn  ss settings-close-btn" onclick={() => uiState.toggleModel.set('none')}>{$t('settings.buttons.close')}</button>
            </div>
        </div>
    </div>
</div>

<style>
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
        background-color: rgba(71, 71, 71, 0.575);
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
    }
    .s-input{
        width: 96%;
    }
    .max-ram{
        right: 0;
        bottom: -20px;
    }
    .banner{
        width: 100%;
        height: 10vw;
        display: flex;
        background: url(../../../../images/static/0.png);
        overflow: hidden;
        background-position: center;
        background-size: cover;
        background-color: var(--base-variant);
        background-repeat: no-repeat;
        border-bottom: 5px var(--accent-color-dark) solid;
    }
    .credit-owner-text{
        opacity: 1 !important;
        color: var(--accent-color) !important;
    }
    .contributors-container{
        display: flex;
        overflow: hidden;
        flex-direction: row;
        flex-wrap: wrap;
        padding: 1vw;
        column-gap: .5vw;
        gap: .5vw;
    }
    .check-update-btn{
        white-space: nowrap;
        background-color: var(--base-variant-1);
        padding: .5vw 1vw;
        border-radius: var(--border-radius-5);
    }
</style>