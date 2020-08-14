<script>
	import Room from '../components/Room.svelte';
	import AnimalChooser from '../components/AnimalChooser.svelte';
	import { onMount } from 'svelte';
	var inRoom = false;
	const channel = 'public'

	onMount(async () => {
		try {
			if (location.hostname !== "localhost" && location.protocol !== 'https:') {
				location.replace(`https:${location.href.substring(location.protocol.length)}`);
			}
		} catch(err) {
			console.log('error setting https');
		}

	});
</script>

<!-- add ! for testing -->
<body>
	{#if inRoom}
		<div>
			<Room {channel} />
		</div>
	{:else}
		<AnimalChooser bind:inRoom={inRoom}/>
	{/if}
</body>

<style>
body {
	background-color: #98e1f4;
}
</style>
