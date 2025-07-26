<script>
// @ts-nocheck

  export let themeName;
  export let displayName;
  export let colors = []; // Array of color strings, e.g. ['#fff', '#222', '#4af']
  export let selected = false;
  export let onSelect = () => {};
</script>

<button
  class="theme-card {selected ? 'selected' : ''}"
  on:click={() => onSelect(themeName)}
  title={displayName}
>
  <div class="theme-preview">
    {#each colors as color}
      <span class="color-dot" style="background: {color}"></span>
    {/each}
  </div>
  <div class="theme-label">{displayName}</div>
</button>

<style>
    .theme-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 12px 10px 8px 10px;
        margin: 8px;
        cursor: pointer;
        transition: border 0.2s, box-shadow 0.2s;
        background: var(--card-bg, #222);
        min-width: 80px;
        min-height: 80px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .theme-card.selected {
        border: 2px solid #4af;
        box-shadow: 0 4px 16px rgba(68,170,255,0.15);
    }
    .theme-preview {
        display: flex;
        gap: 4px;
        margin-bottom: 8px;
    }
    .color-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid #ccc;
        display: inline-block;
    }
    .theme-label {
        font-size: 0.95em;
        color: #eee;
        margin-top: 2px;
        text-align: center;
    }
</style>