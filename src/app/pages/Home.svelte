<script>
    import MainContent from "../components/layouts/MainContent.svelte";
    import Sidebar from "../components/layouts/Sidebar.svelte";
    import AccountAdder from "../components/model/AccountAdder.svelte";
    import Invoker from "../components/model/Invoker.svelte";
    import Settings from "../components/model/Settings.svelte";
    import { uiState } from "../stores/ui";
    
    const { toggleModel } = uiState;
</script>

<div class="main">
    <Sidebar />
    <MainContent />
</div>

{#if $toggleModel === 'accountadder'}
    <AccountAdder />
{:else if $toggleModel === 'settings'}
    <Settings />
{:else if $toggleModel === 'invoker'}
    <Invoker />
{/if}