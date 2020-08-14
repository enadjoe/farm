<script>
    export let messages, messageBoxValue, playerInfo;
    import { createEventDispatcher } from 'svelte';
    import { beforeUpdate, afterUpdate } from 'svelte';

    const dispatch = createEventDispatcher();
    let div;
    let autoscroll;
	beforeUpdate(() => {
		autoscroll = div && (div.offsetHeight + div.scrollTop) > (div.scrollHeight - 20);
	});

	afterUpdate(() => {
		if (autoscroll) div.scrollTo(0, div.scrollHeight);
	});
    

    function sendMessage() {
        dispatch('sendMessage', {
            message: messageBoxValue
        });
    }

    function handleKeyDown(event) {
		if (event.key === 'Enter') {
            sendMessage();
        }
    }
    
</script>
<div class="container" >
    <div class="scrollable" bind:this={div}>
        {#each messages as message, i}
        <div>{playerInfo[message[0]].name}: {message[1]}</div>
    {/each}
    </div>
    <div>
        <input id="name" on:keydown={handleKeyDown} bind:value={messageBoxValue} placeholder="Message...">
        <button type="button" on:click={sendMessage}>send</button>
    </div>
</div>

<style>
    .container {
        display: flex;
		flex-direction: column;
		height: 200px;
		max-width: 320px;
        border: 1px solid white;
        color: white;
		background-color: #17255A;

    }

	.scrollable {
		flex: 1 1 auto;
		margin: 0 0 0.5em 0;
		overflow-y: auto;
	}

</style>