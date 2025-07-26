<script>
    // @ts-nocheck
    import { selectedAccountUsername, uiState, userAccountState, selectedAccount } from "../../stores/ui";
    import { getAppFolder, limitText, parseDate, rssURL, scrollHorizontal } from "../../utils/helper";
    import SimpleTip from "./SimpleTip.svelte";
    import { versions, selectedMajor, selectedVariant, selectedType, setSelectedVersion } from '../../shared/versionManager';
    import { onMount } from "svelte";
    import { fetchNews } from '../../services/api.js';
    import { flip } from "svelte/animate";
    import { t } from "../../stores/i18n";
    import { getSelectedAccount } from "../../shared/user";
    import { selectedVersionInfo } from "../../stores/version";
    import { settings } from "../../stores/settings";

    let rssFeed = [];
    let { hasAccount } = userAccountState;
    
    onMount(async () => {
        let feed = await fetchNews();
        rssFeed = (await fetchNews()).sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(rssFeed)
    });

    function getRssClass(tags) {
        const lowerTags = tags?.map(tag => tag.toLowerCase()) || [];

        if (lowerTags.includes('update')) return 'btn-rss-update';
        if (lowerTags.includes('feature')) return 'btn-rss-announcement';

        return 'btn-rss-news';
    }

    async function handleLaunchGame(params) {
        const launchOptions = {
            test: 'Hello world!'
        };

        if($selectedAccountUsername){
            // let opt = {
            //     url: null,
            //     authenticator: getSelectedAccount(),
            //     timeout: 10000,
            //     path: `${await appdata()}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
            //     instance: options.name,
            //     version: options.loadder.minecraft_version,
            //     detached: configClient.launcher_config.closeLauncher == "close-all" ? false : true,
            //     downloadFileMultiple: configClient.launcher_config.download_multi,
            //     intelEnabledMac: configClient.launcher_config.intelEnabledMac,

            //     loader: {
            //         type: options.loadder.loadder_type,
            //         build: options.loadder.loadder_version,
            //         enable: options.loadder.loadder_type == 'none' ? false : true
            //     },

            //     verify: options.verify,

            //     ignored: [...options.ignored],

            //     java: {
            //         path: configClient.java_config.java_path,
            //     },

            //     JVM_ARGS:  options.jvm_args ? options.jvm_args : [],
            //     GAME_ARGS: options.game_args ? options.game_args : [],

            //     screen: {
            //         width: configClient.game_config.screen_size.width,
            //         height: configClient.game_config.screen_size.height
            //     },

            //     memory: {
            //         min: `${configClient.java_config.java_memory.min * 1024}M`,
            //         max: `${configClient.java_config.java_memory.max * 1024}M`
            //     }
            // }
            const appFolder = await getAppFolder();

            console.log(appFolder);
            window.electron.launchGame(launchOptions);

            // window.electron.onLaunchProgress((progress) => {
            //     console.log(progress);
            // })
            // const configClient = {
            //     account_selected: selectedAccountProfile,
            //     instance_selct: $selectedVariant,
            //     launcher_config: {
            //         download_multi: 5,
            //         intelEnabledMac: false
            //     },
            //     java_config: {
            //         // java_path: $settings.game.javaPath,
            //         java_memory: {
            //             min: parseInt($settings.game.memory.min) || 1,
            //             max: parseInt($settings.game.memory.max) || 2
            //         }
            //     },
            //     game_config: {
            //         screen_size: {
            //             width: $settings.game.screen?.width || 854,
            //             height: $settings.game.screen?.height || 480
            //         }
            //     }
            // };

            // const instance = {
            //     name: $selectedVariant,
            //     url: null, // Use default Mojang servers
            //     loadder: {
            //         minecraft_version: $selectedVariant,
            //         loadder_type: 'none',
            //         loadder_version: $selectedType || 'latest'
            //     },
            //     verify: false,
            //     ignored: [],
            //     jvm_args: $settings.game.runtime.JVMArgs ? $settings.game.runtime.JVMArgs.split(' ') : [],
            //     game_args: $settings.game.gameArgs ? $settings.game.gameArgs.split(' ') : []
            // };

            // const result = await window.electron.launchGame({
            //     configClient,
            //     instance,
            //     authenticator: selectedAccountProfile,
            //     options: instance
            // });
            
            // if (!result.success) {
            //     console.error('Launch failed:', result.error);
            // }
            // console.log(result);
        }else{
            if($hasAccount){
                uiState.activeTab.set('accountmanager')
            }else{
                uiState.toggleModel.set('accountadder')
            }
        }
    }

</script>

<div class="launch-news-container">
    <div class="launch-container">
    <h2>Minecraft {$selectedMajor}</h2>
    <div class="version-tag">
        {$selectedVariant}&nbsp;{$selectedType.charAt(0).toUpperCase() + $selectedType.slice(1) }
    </div>
    <div class="version-summery">&nbsp;</div>
    <div class="launch-btn-container">
        <button 
            on:click={handleLaunchGame}
            class="launch-btn"
        >
            <span class="version-label">{$t('launch.launch')} {$selectedVariant}</span>
            <span class="launch-status">{$t('launch.launchStatus.ready')}</span>
        </button>
        <SimpleTip text="{$t('launch.changeVersion')}" direction="right">
            <button 
                on:click={() => {uiState.toggleModel.set('versionselector')}}
                class="version-change-btn" 
                aria-label="Change version">
                <i class="fa fa-right-left"></i>
            </button>
        </SimpleTip>
    </div>
    </div>
    <div class="bottom-group">
        <div class="rss-wrapper">
            <div class="wrapper">
            <div class="-rx" use:scrollHorizontal>
                <div class="scroll-container">
                    {console.log(rssFeed)}
                    {#each rssFeed.slice(0, 3) as rss, index}
                        <div class="rss-card-container ">
                            <div class="thumbnail" style="background-image: url({rss.thumbnail});"></div>
                            <div class="rss-title-container">
                                <span use:limitText={{size: 40}}>{rss.title}</span>
                                <a
                                    href="{rssURL}/post?id={rss.id}"
                                    class="redirect-btn {getRssClass(rss.tags)}"
                                    aria-label="rss-btn"
                                >
                                    <i class="fa fa-arrow-up-right-from-square"></i>
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
            </div>
        </div>
    </div>
</div>
