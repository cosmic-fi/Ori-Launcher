<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { openDropdownId } from '../../stores/dropdown.js';
  import { get } from 'svelte/store';

  export let options = [];
  export let value = null;
  export let id = '';
  export let disabled = false;

  const dispatch = createEventDispatcher();

  let isOpen = false;
  let dropdown, menu, toggle;

  $: selectedOption = options.find(o => o.value === value) || options[0];

  // Watch openDropdownId to close if another dropdown opens
  $: isOpen = $openDropdownId === id;

  function openDropdown(e) {
    if (disabled) return;
    e.stopPropagation();
    if ($openDropdownId === id) {
      openDropdownId.set(null); // close if same dropdown clicked again
    } else {
      openDropdownId.set(id); // open this one, close others
      positionMenu();
    }
  }

  function selectOption(option) {
    openDropdownId.set(null); // close dropdown
    dispatch('optionchange', {
      value: option.value,
      data_value: option.label
    });
  }

  function positionMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('open-up', 'open-down');
    const toggleRect = toggle.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - toggleRect.bottom;
    const spaceAbove = toggleRect.top;

    if (spaceBelow < menuRect.height && spaceAbove > menuRect.height) {
      menu.classList.add('open-up');
    } else {
      menu.classList.add('open-down');
    }
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
      <span class="btn-text">{selectedOption ? selectedOption.label : 'Select'}</span>
      <i class="fa fa-caret-down"></i>
    </button>
      <div class="dropdown-menu" bind:this={menu}>
        <div class="menu-wrapper">
          {#each options as opt}
            <button
              class="dropdown-item {opt.value === (selectedOption && selectedOption.value) ? 'active' : ''}"
              on:click={() => selectOption(opt)}
              value={opt.value}
              data-value={opt.label}
              type="button"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      </div>
  </div>
</div>

<style>
.options {
  position: relative;
}
.dropdown.open .dropdown-menu {
  display: block;
}
.dropdown-menu {
  background-color: green;
  max-height: 200px;
  overflow: hidden;
  overflow-y: auto;
  padding: 4px !important;
  position: absolute;
  z-index: 10;
  min-width: 100%;
  font-weight: 100 !important;
}
</style>