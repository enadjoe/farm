<!-- src/routes/[channel].svelte -->

<script>
	import Room from '../components/Room.svelte';
    import {
		onMount
	} from 'svelte';
    var inRoom = false;
    let channel = ''


	onMount(async () => {
		if (location.hostname !== "localhost" && location.protocol !== 'https:') {
			location.replace(`https:${location.href.substring(location.protocol.length)}`);
		}
	});

    try {
        channel = window.location.pathname.substr(1)
        if(channel == "skip" || channel == "kar") {
            inRoom = true; //USE /skip to skip signup
        }
    } catch {
        //console.log('[!] Window not loaded')
    }
    
</script>

<body>
    <div>
        <Room {channel}/>
    </div>
</body>

<style>
	body {
		background-color: #17255A;
	}
</style>
