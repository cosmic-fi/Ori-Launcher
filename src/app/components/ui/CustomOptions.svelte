<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { openDropdownId } from '../../stores/dropdown.js';

  export let options = [];
  export let value = null;
  export let id = '';
  export let disabled = false;
  export let preferredPosition = '';

  const dispatch = createEventDispatcher();

  let isOpen = false;
  let dropdown, menu, toggle;

  // $: selectedOption = options.find(o => o.value === value) || options[0];
  $: selectedOption = options.find(o => o.value === value) || value;

  $: isOpen = $openDropdownId === id;

  function openDropdown(e) {
    if (disabled) return;
    e.stopPropagation();
    if ($openDropdownId === id) {
      openDropdownId.set(null);
    } else {
      openDropdownId.set(id);
      // positionMenu();
    }
  }

  function selectOption(option) {
    openDropdownId.set(null);
    dispatch('optionchange', {
      value: option.value,
      data_value: option.label,
      other: option.other
    });
  }

  function handleClickOutside(event) {
    if (!dropdown.contains(event.target)) {
      openDropdownId.set(null);
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="options" {id} bind:this={dropdown}>
  <div class="dropdown {isOpen ? 'open' : ''}">
    <button
      class="option-btn dropdown-toggle"
      bind:this={toggle}
      on:click={openDropdown}
      disabled={disabled}
      type="button"
    >
      {@html selectedOption.label || 'Select'}
      <i class="fa fa-caret-down"></i>
    </button>
      <div 
        class="dropdown-menu" bind:this={menu}
        class:open-left={preferredPosition === 'left'}
        class:open-right={preferredPosition === 'right'}
        class:open-up={preferredPosition === 'up'}
        class:open-down={preferredPosition === 'down'}
      >
        <div class="menu-wrapper">
          {#each options as opt}
            <button
              class="dropdown-item {opt.value === (selectedOption && selectedOption.value) ? 'active' : ''}"
              on:click={() => selectOption(opt)}
              value={opt.value}
              data-value={opt.label}
              type="button"
            >
              {@html opt.label}
            </button>
          {/each}
        </div>
      </div>
  </div>
</div>

<style>
.options {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  border-radius: 5px;
}

.options .option-btn,
.options .dropdown-item {
  background: var(--overlay-color-1);
  color: var(--text-color);
  border: 1px var(--border-color) solid;
  padding: 10px 16px;
  border-radius: var(--border-radius-5);
  font-size: var(--font-size-fluid-base);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  column-gap: 10px;
  align-items: center;
  justify-content: space-between;
  gap: 1vw;
  white-space: nowrap;
}
.options .option-btn:hover,
.options .dropdown-item:hover {
  background: var(--overlay-color);
  color: var(--text-color-muted);
}

.options .dropdown {
  position: relative;
  display: inline-block;
}

.options .dropdown-toggle:after {
    display: none;
}

.options .dropdown-menu {
  display: none;
  position: absolute;
  background: var(--overlay-color-1);
  border: 1px var(--border-color) solid;
  border-radius: 6px;
  box-shadow: 0 2px 8px var(--shadow-color-15);
  max-height: 200px;
  min-width: 120px;
  overflow: hidden;
  overflow-y: auto;
  padding: 4px;
  z-index: 10;
  font-weight: 100;
  flex-direction: column;
}

.options .dropdown.open .dropdown-menu {
  display: flex;
}

.options .dropdown-item {
  background: none;
  border: none;
  color: var(--text-color);
  padding: 8px 16px;
  text-align: left;
  width: 100%;
  font-weight: 400;
  font-size: var(--font-size-base);
  cursor: pointer;
  border-radius: 5px;
  transition: background 0.2s;
  min-width: auto;
  gap: 10px;
  align-items: start;
  justify-content: start;
}

/* Positioning classes for adaptive dropdown */
.open-up {
  bottom: calc(100% + 5px) !important;
  right: 0 !important;
}

.open-down {
  top: calc(100% + 5px) !important;
  right: 0 !important;
  left: auto !important;
}

.open-left {
  right: calc(100% + 5px) !important;
  top: 0 !important;
  bottom: auto !important;
  left: auto !important;
}

.open-right {
  top: 0 !important;
  left: calc(100% + 5px) !important;
  bottom: auto !important;
  right: auto !important;
}
</style>