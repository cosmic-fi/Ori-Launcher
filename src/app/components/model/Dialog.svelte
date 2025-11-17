<script>
  import { t } from '../../stores/i18n';

  export let title = $t('dialog.defaultTitle');
  export let message = $t('dialog.defaultMessage');
  export let buttons = [
    { label: $t('dialog.ok'), action: () => {}, type: "normal" }
  ];
  export let open = false;
  export let onClose = () => {};

  function getButtonClass(type) {
    switch (type) {
      case "danger": return "btn-danger";
      case "confirm": return "btn-accent";
      default: return "btn-primary";
    }
  }
</script>

{#if open}
  <div class="dialog-container">
    <div class="d-wrapper scale-in-center">
      <div class="d-title-description-container">
        <span class="d-title">{title}</span>
        <p class="d-description">
          {@html message}
        </p>
      </div>
      <div class="d-btn-container">
        {#each buttons as btn}
          <button
            class="dialog-btn btn d-default-btn {getButtonClass(btn.type)}"
            on:click={() => { btn.action(); onClose(); }}>
            {btn.label}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}
<style>
  .dialog-container{
    position: absolute;
    z-index: 9999;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all .3s ease; 
    background-color: var(--shadow-color);
    backdrop-filter: blur(3px);

    .d-wrapper{
        background-color: var(--surface-color);
        border: 2px var(--border-color) solid;
        border-radius: 10px;
        width: 22rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .d-title-description-container{
            display: flex;
            flex-direction: column;
            padding: 15px 10px;
            color: var(--text-color-muted);
            .d-title{
                color: var(--text-color);
                font-size: 1.2rem;
                font-weight: 600;
            }
        }
        .d-btn-container{
            display: flex;
            flex-direction: row;
            padding: 10px;
            border-top: 1px var(--border-color) solid;
            column-gap: 10px;

            .btn{
              background-color: var(--overlay-color);
              padding: 8px 20px;
              flex-grow: 1;
              border-radius: 5px;
              color: var(--text-color);
              text-align: center;
              font-family: inherit;
              font-size: 1.02rem;
              box-shadow: 2px 2px 5px var(--box-shadow);

              &:hover{
                  background-color: var(--overlay-color-1);
              }
            }
        }
    }
}
</style>