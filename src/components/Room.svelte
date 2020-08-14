<!--<svelte:window on:keydown={handleKeydown} />-->

<main>
	<Farm on:playerMove={handlePlayerMove} {playerInfo} {playerLocations} {clientInfo}></Farm>
	<div id="local-stream"></div>
	<div id="remote-streams"></div>
</main>



<style>

	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-gap: 20px;
	}
	
	main {
		width: 100%;
		height: 100vh;
	}

	#header {
		height: 12vh;
		position: relative;
	}

	#content {
		height: 80vh;
		color: #E9F1F7;
		position: relative;
	}

	#title {
		color: #E9F1F7;
		font-size: 2em;
		text-transform: uppercase;
		font-weight: 100;
		margin: 0;
		position: absolute;
		top: 80%;
		left: 50%;
		padding: 10px;
		-ms-transform: translate(-50%, -50%);
		transform: translate(-50%, -50%);
		transition-property: color;
		transition-duration: 200ms;
		transition-timing-function: linear;
	}

	#title:hover {
		color: #ed9390;
		cursor: copy;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>


<script>
	import Chat from './Chat.svelte';
	import Farm from './Farm.svelte';
	import Debug from './Debug.svelte';
	import socketIOClient from "socket.io-client";
	import { name, photo, animal } from './stores.js';



	// import nipplejs from 'nipplejs';

	import { onMount } from 'svelte';

	export let channel;

	function genRand(num) {
		return Math.floor((Math.random() * num) + 1)
	}

	function distance(loc1, loc2) {
		return Math.sqrt(Math.pow(loc2[1] - loc1[1], 2) + Math.pow(loc2[0] - loc1[0], 2))
	}

	/* START STATE */
	let AgoraRTC; // Placeholder for dynamic import in onMount()
	var socket;
	var location = {position: {x: 0, y:0, z:0}, rotation: {_x: 0, _y: 0, _z: 0}}
	var playerInfo = {}
	var playerLocations = {} // {'foo': {position: {x: 0, y:0, z:12}, rotation: {_x: 0, _y: 0, _z: 0, _order: 'XYZ'}}}
	var playerStreams = {}
	var playerSpeak = {}
	var playerScores = {};
	var previousTalkingStatus = false;
	var previousPlayerDistance = {};
	var distanceMap = {};
	var playerChat = [];
	const DECAY_FACTOR = 1.7
	const MIN_VOLUME = 3
	var volumeSteps = [95, 50, 30, 10]
	var showDebug = false;
	var clientInfo = {
		stream: '',
		socket: '',
		name: $name || 'No Name Nancy',
		photo: $photo,
		room: channel,
		animal: $animal
	}
	var refreshAudioVolumesTimer = null
	var refreshAudioVolumesTime = 100
	var sendPlayerMovementTimer = null
	var sendPlayerMovementTime = 25
	const DEBUG = false;
	/* END STATE */


	// rtc object
	var rtc = {
		client: null,
		joined: false,
		published: false,
		localStream: null,
		remoteStreams: [],
		params: {}
	};

	// Options for joining a channel
	var option = {
		appID: "7875658d74304ace86dba1dac992cb4e",
		channel: 'ajlsdfjas;ldfals',
		uid: null,
		token: null
	}

	if (DEBUG) {
		setInterval(function() {
				const debugMap = {
					gridSize, grid, playerInfo, playerLocations, playerSpeak, previousTalkingStatus,
					clientInfo, rtc 
				}
				console.log(debugMap)
			}, 300)
	}

	function initGame() {
		socket.emit('start game', numGamePieces);
	}

	function endGame() {
		socket.emit('end game');
	}


	export function handleFail(err) {
		console.log("[!] Error -", err)
	}


    function handleSendMessage(event) {
		socket.emit("player message", [clientInfo.socket, event.detail.message], function (error, message) {});
	}

	function handlePlayerScore(event) {
		socket.emit("player score", event.detail.piece);
	}

	function handlePlayerMove(event) {
		if (!refreshAudioVolumesTimer) {
			// start the audio refresh timer which triggers 500ms after the player has moved
			refreshAudioVolumesTimer = window.setTimeout(refreshAudioVolumesHandler, refreshAudioVolumesTime)
		}	
		if (!sendPlayerMovementTimer) {
			// start the audio refresh timer which triggers 500ms after the player has moved
			sendPlayerMovementTimer = window.setTimeout(() => {
				//calc distance from each peer and update distanceMap
				/*
				for (var key in playerLocations) {
					let loc = playerLocations[key];
					//calc distance from each peer and update distanceMap
					if (key != clientInfo.socket.id) {
						let dist = distance(location, loc)
						distanceMap[key] = [dist, getVolumeLevel(dist)]
					}
				}
				*/
				
				socket.emit("player move", {position: event.detail.position, rotation: event.detail.rotation}, function (error, message) {});
				sendPlayerMovementTimer = null;
				}, sendPlayerMovementTime)
		}	
	}
	
	/**
	 * @name refreshAudioVolumesHandler
	 * @description sets the volume levels of players streams based on their distance (spatial audio!)
	 *  this function is called after the refreshAudioVolumesTimer timeout hits, meaning it has been <refreshAudioVolumesTime> ms
	 *  since a player has moved or from the last time this function ran. A timeout is used to avoid re-running this function
	 *  too often if players are moving a lot.
	 */
	function refreshAudioVolumesHandler() {
		/*
		refreshAudioVolumesTimer = null
		Object.keys(playerLocations).forEach((playerId)=> {
			var d = distance(playerLocations[playerId], location);
			var streamId = playerInfo[playerId].stream
			var streamHandle = playerStreams[streamId]
			var volume = getVolumeLevel(d);
			console.log('got distance', playerId, d, volume);

			// var volume = Math.floor(distanceMap[playerId][1])
			//streamHandle.setAudioVolume(volume)
		})
		// Update stream audio levels based on distances
		// Only update when there are other players connected

		console.log("got distance map", distanceMap);
		if (Object.keys(playerStreams).length > 0) {
			Object.keys(playerLocations).forEach((playerId) => {
				// Checking current distance against old distance, if it didn't change don't update audio
				if (playerId != socket.id && previousPlayerDistance[playerId][0] != distanceMap[playerId][0])
				{
					try{
						var streamId = playerInfo[playerId].stream
						var streamHandle = playerStreams[streamId]
						var volume = Math.floor(distanceMap[playerId][1])
						streamHandle.setAudioVolume(volume)
					}catch(err) {
						console.log('[!] Error setting stream volume level -', err);
					}
					
				}
			})
		
		}
			*/
		// Update stream audio levels based on distances
		// Only update when there are other players connected
		/*
		if (Object.keys(playerStreams).length > 0) {
			Object.entries(playerLocations).forEach(([playerId, loc]) => {
				const distance = grid[loc[0]][loc[1]].distance
				const volumeLevel = getVolumeLevel(distance)
				if (playerId != socket.id)
				{
					try{
						var streamId = playerInfo[playerId].stream
						var streamHandle = playerStreams[streamId]
						streamHandle.setAudioVolume(volumeLevel)
					}catch(err) {
						console.log('[!] Error setting stream volume level -', err);
					}
					
				}
			})
		}
		*/
	}

	function getVolumeLevel(dist) {
		if (dist == 0) { return 100 }
		else if (dist <= volumeSteps.length) {
			return volumeSteps[dist - 1]
		}
		else { return MIN_VOLUME }
	}


	function handleKeydown(event) {
		if (event.key == 'd') {
			showDebug = !showDebug;
		}
	}

	function copyText() {
		/* Get the text field */
		var text = document.getElementById("text");
		const selection = window.getSelection();
		const range = document.createRange();
		range.selectNodeContents(text);
		selection.removeAllRanges();
		selection.addRange(range);

		try {
			document.execCommand('copy');
			selection.removeAllRanges();

			const original = text.textContent;
			text.textContent = 'Copied!';
			text.classList.add('success');

			setTimeout(() => {
				text.textContent = original;
				text.classList.remove('success');
			}, 1200);
		} catch(e) {
			console.err(e)
		}
	}


		/**
	 * @name initalize
	 * @description Initalizes agora and socket connections,
	 * 				sets up all callbacks and listeners for both
	 */
	async function initalize() {

		/* START AGORA-RTC CODE */

		const a = await import('agora-rtc-sdk');
		AgoraRTC = a.default

		/* Dropping verbosity on the logs, set as you wish... */
		AgoraRTC.Logger.setLogLevel(AgoraRTC.Logger.ERROR);

		// Create and intialize agora client w/ app ID
		rtc.client = AgoraRTC.createClient({
			mode: 'rtc',
			codec: 'h264'
		});
		rtc.client.init("7875658d74304ace86dba1dac992cb4e", () => console.log("[*] Client Initalized"), handleFail); // TO-DO remove AppID from here

		// Connect to agora channel

		rtc.client.join(option.token ? option.token : null, option.channel, option.uid ? +option.uid : null, (uid) => {
			console.log("[*] join channel: " + option.channel + " success, uid: " + uid);
			rtc.params.uid = uid;
			rtc.localStream = AgoraRTC.createStream({
				streamId: rtc.params.uid,
				audio: true,
				video: false,
				screen: false
			});


			// Associate stream to client
			rtc.localStream.init(function () {
				console.log('[*] init local stream success');

				// Publish stream to the channel
				rtc.client.publish(rtc.localStream, handleFail);

				// Play local stream
				rtc.localStream.play("local-stream")

				clientInfo.stream = rtc.localStream.getId();

				// When a stream is added to the channel subscribe to it
				rtc.client.on('stream-added', function (evt) {
					let remoteStream = evt.stream;
					let id = remoteStream.getId();
					if (id !== rtc.params.uid) {
						rtc.client.subscribe(remoteStream, function (err) {
							console.log("[!] Stream subscribe failed", err);
						})
					}
					console.log('[*] stream-added remote-uid:', id);
				});

				// When you subscribe to a stream add it to the dom and play
				rtc.client.on('stream-subscribed', function (evt) {
					let remoteStream = evt.stream;
					let id = remoteStream.getId()

					// Generate and append DIV to hold stream
					let streamDiv = document.createElement('div')
					streamDiv.id = `remote-stream-${id}`
					//streamDiv.style = "height: 100px; width: 100px; border: 1px solid black;"
					document.getElementById('remote-streams').appendChild(streamDiv)
					remoteStream.play(`remote-stream-${id}`);

					playerStreams[id] = remoteStream
					console.log('[*] stream-subscribed remote-uid:', id)
				});

				// When a person is removed from a channel
				rtc.client.on('stream-removed', function (evt) {
					let remoteStream = evt.stream;
					let id = remoteStream.getId();
					// Stop playing remote stream
					remoteStream.stop(`remote-stream-${id}`);
					// Remove view of remote stream.
					document.removeElement(`remote-stream-${id}`)
					delete playerStreams[id];
					console.log('stream-removed remote-uid: ', id);

				});
				rtc.client.on('peer-leave', function(evt) {
					let stream = evt.stream;
					stream.stop()
					let remDiv = document.getElementById(`remote-stream-${stream.getId()}`);
					remDiv.remove()
					delete playerStreams[stream.getId()]
					console.log("Remote stream is removed", stream.getId());
				});

			}, handleFail)
		})


		/* END AGORA-RTC CODE */

		/* START SOCKET CODE */
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		socket = socketIOClient(`${protocol}//${window.location.host}`);

		socket.on('connect', function () {
			clientInfo.socket = socket.id
		});

		socket.on('player move', function (msg) {
			previousPlayerDistance = {...distanceMap};
			
			if (msg[0] != clientInfo.socket) {

				playerLocations[msg[0]] = msg[1];
				if (!refreshAudioVolumesTimer) {
					// start the audio refresh timer which triggers 500ms after the player has moved
					refreshAudioVolumesTimer = window.setTimeout(refreshAudioVolumesHandler, refreshAudioVolumesTime)
				}	
			}
		});

		socket.on('start game', function(msg) {
			gamePieces = msg.pieces;
			playerScores = msg.scores;
		})

		socket.on('end game', function(scores) {
			console.log('got endgame');
			gamePieces = {}
			playerScores = scores
		})

		socket.on('player score', function(data) {
			playerScores = {...playerScores, ...data.scores}
			gamePieces = {...gamePieces, ...data.pieces}
		})

		socket.on('player message', function(message) {
			console.log('[*] got player message:', message)
			playerChat = [...playerChat, message]
		})

		socket.on('player speak', function(msg) {
			if (msg[0] != clientInfo.socket) {
				playerSpeak[msg[0]] = msg[1]
				var playerCircle = document.getElementById(msg[0]);
				if (msg[1] == true) {
					// playerCircle.style = 'border: 4px solid green;border-radius: 100%';
				} else {
					// playerCircle.style = 'border: 4px solid transparent;border-radius: 100%';
				}
			}
		})

		socket.on('new player', function (msg) {
			console.log('[*] Got new player -', msg)
			playerInfo = {...playerInfo, ...msg.info}
			playerLocations = {...playerLocations, ...msg.locations}
			playerScores = {...playerScores, ...msg.scores}
			let src = './join-alert.mp3';
			let audio = new Audio(src);
			audio.play();
		})

		socket.on('player disconnected', function (msg) {
			console.log('[*] Player disconnected -', msg);
			delete playerInfo[msg.socket];
			delete playerLocations[msg.socket];
			delete playerScores[msg.socket];
			let src = './leave-alert.mp3';
			let audio = new Audio(src);
			audio.play();
		})
		/* END SOCKET CODE */


	}

	onMount(async () => {

		initalize().catch(handleFail);

		/* Setting up promise to check when the initalization function
		   has set the clients stream and socket IDs */
		const initPromise = new Promise((resolve, reject) => {
			const initInterval = setInterval(() => {
				if (clientInfo.stream && clientInfo.socket) {
					resolve()
					window.clearInterval(initInterval);
				}
			}, 500)
		});

		/* Once promise resolves (meaning stream and socket are set in clientInfo)
			then we will emit the initalization signal to the socket server. */

		initPromise.then(() => {
			console.log('[*] Initalization promise resolved')
			socket.emit("initalize", {info: clientInfo, location}, function (error, message) {});
		
		/*
			Function to check if currently talking and emit status to room
		*/
		setInterval(function() {
			var audioLevel = rtc.localStream.getAudioLevel();
			var isTalking = false;
			const TALKING_THRESHOLD = 0.02;
			if (audioLevel > TALKING_THRESHOLD) {
				isTalking = true;
			}
			if (isTalking != previousTalkingStatus) {
				socket.emit('player speak', [clientInfo.socket, isTalking])
				if (isTalking) {
					// document.getElementById(clientInfo.socket).style = 'border: 4px solid green;border-radius: 100%';
				} else {
					// document.getElementById(clientInfo.socket).style = 'border: 4px solid transparent;border-radius: 100%';
				}
			}
			playerSpeak[clientInfo.socket] = isTalking;
			previousTalkingStatus = isTalking;
		}, 300)
		
		})
	});

</script>