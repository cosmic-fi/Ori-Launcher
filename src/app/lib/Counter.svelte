<script>
  let name = '';
  let showInput = false;

  const changeName = () => {
    showInput = true;
  }
  const updateName = (e) => {
    name = e.target.value;
    showInput = false;
  }

</script>

<button onclick={changeName}>Change Name</button>

{#if showInput}
  <input type="text" placeholder="Enter name here good sir..." onchange={updateName}>
{/if}
<p>Your name is: {name}</p> 