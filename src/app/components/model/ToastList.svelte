<script>
    import { toasts } from '../../stores/ui';
    import Toast from './Toast.svelte';
</script>

{#each $toasts as toast (toast.id)}
    <Toast {...toast} />
{/each}