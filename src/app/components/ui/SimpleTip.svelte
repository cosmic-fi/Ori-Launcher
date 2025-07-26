<script>
    export let text = '';
    export let direction = 'top';

    let tooltipEl;
    let targetEl;

    function positionTooltip() {
        if (!targetEl || !tooltipEl) return;

        const rect = targetEl.getBoundingClientRect();
        const tipRect = tooltipEl.getBoundingClientRect();

        let top = 0, left = 0;

        switch (direction) {
        case 'bottom':
            top = rect.bottom + 8;
            left = rect.left + (rect.width - tipRect.width) / 2;
            break;
        case 'left':
            top = rect.top + (rect.height - tipRect.height) / 2;
            left = rect.left - tipRect.width - 8;
            break;
        case 'right':
            top = rect.top + (rect.height - tipRect.height) / 2;
            left = rect.right + 8;
            break;
        case 'top':
        default:
            top = rect.top - tipRect.height - 8;
            left = rect.left + (rect.width - tipRect.width) / 2;
            break;
        }

        // Prevent overflow
        top = Math.max(4, Math.min(window.innerHeight - tipRect.height - 4, top));
        left = Math.max(4, Math.min(window.innerWidth - tipRect.width - 4, left));

        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function show() {
        tooltipEl.style.opacity = 1;
        positionTooltip();
    }

    function hide() {
        tooltipEl.style.opacity = 0;
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<span 
    bind:this={targetEl} 
    on:mouseenter={show} 
    on:mouseleave={hide}
    on:mousemove={positionTooltip}
    style="display: flex;">
    <slot />
</span>

<!-- Global tooltip -->
<div class="simple-tip" bind:this={tooltipEl}>
  {text}
</div>