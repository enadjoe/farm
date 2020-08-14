<style>
	.container {
		margin: 0;
		height: 100%;
	}
	#c {
	width: 100%;
	height: 100%;
	display: block;
	}
	#loading {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	font-size: xx-large;
	font-family: sans-serif;
	}
	#loading>div>div {
	padding: 2px;
	}
	.progress {
	width: 50vw;
	border: 1px solid black;
	}
	#progressbar {
	width: 0;
	transition: width ease-out .5s;
	height: 1em;
	background-color: #888;
	background-image: linear-gradient(
		-45deg, 
		rgba(255, 255, 255, .5) 25%, 
		transparent 25%, 
		transparent 50%, 
		rgba(255, 255, 255, .5) 50%, 
		rgba(255, 255, 255, .5) 75%, 
		transparent 75%, 
		transparent
	);
	background-size: 50px 50px;
	animation: progressanim 2s linear infinite;
	}
	
	@keyframes progressanim {
	0% {
		background-position: 50px 50px;
	}
	100% {
		background-position: 0 0;
	}
	}
</style>

<svelte:head>
	<title>Farm</title>
</svelte:head>

<div class="container">
	<canvas id="c"></canvas>
	<!--
	<div id="ui">
		<div id="left"><img src="https://threejsfundamentals.org/threejs/resources/images/left.svg"></div>
		<div style="flex: 0 0 40px;"></div>
		<div id="right"><img src="https://threejsfundamentals.org/threejs/resources/images/right.svg"></div>
	</div>
	-->
	<div id="loading">
		<div>
			<div>...loading...</div>
			<div class="progress"><div id="progressbar"></div></div>
		</div>
  </div>
</div>

<script>
	import * as THREE from 'three';
    import { onMount, createEventDispatcher } from 'svelte';

	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
    import {SkeletonUtils} from 'three/examples/jsm/utils/SkeletonUtils.js';
	import {removeArrayElement, SafeArray, InputManager, 
			GameObjectManager, GameObject, Component,
			getVelocity, getY} from './util.js';
    export let playerInfo, playerLocations, clientInfo;
	const dispatch = createEventDispatcher();
	let isInitalized = false;
	let shouldUpdatePlayerMap = {}
	let previousLocations = playerLocations;


	onMount(async () => {
		main();
    });
    
	function playerMove(position, rotation) {
        dispatch('playerMove', {
            position,
            rotation
        });
    }

	function main() {
		const canvas = document.querySelector('#c');
		const renderer = new THREE.WebGLRenderer({canvas});

		const fov = 45;
		const aspect = 2;  // the canvas default
		const near = 0.1;
		const far = 1000;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.set(0, 40, 80);

		const controls = new OrbitControls(camera, canvas);
		controls.enableKeys = false;
		controls.target.set(0, 5, 0);
		controls.update();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x98e1f4);
		let currentlyRenderedPlayers = [];

		function addLight(...pos) {
			const color = 0xFFFFFF;
			const intensity = 1;
			const light = new THREE.DirectionalLight(color, intensity);
			light.position.set(...pos);
			scene.add(light);
			scene.add(light.target);
		}
		addLight(5, 5, 2);
		addLight(-5, 5, 5);

		var groundGeo = new THREE.PlaneGeometry( 100, 100, 0);
		var material = new THREE.MeshBasicMaterial( {color: 0x7EC850, side: THREE.DoubleSide})
		var ground = new THREE.Mesh( groundGeo, material );
		ground.rotateX(Math.PI/2);
		scene.add(ground);
		/*
		var wallGeo = new THREE.PlaneGeometry( 100, 100, 0);
		var wall = new THREE.Mesh( wallGeo, material );
		wall.position.z = 50;
		scene.add(wall);
		*/
		const manager = new THREE.LoadingManager();
		manager.onLoad = init;

		const progressbarElem = document.querySelector('#progressbar');
		manager.onProgress = (url, itemsLoaded, itemsTotal) => {
			progressbarElem.style.width = `${itemsLoaded / itemsTotal * 100 | 0}%`;
		};

		const models = {
			pig:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Pig.gltf',
						movementAnimation: 'Walk' },
			cow:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Cow.gltf',
						movementAnimation: 'Walk' },
			llama:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Llama.gltf',
						movementAnimation: 'Walk' },
			pug:    { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Pug.gltf',
						movementAnimation: 'Walk' },
			sheep:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Sheep.gltf',
						movementAnimation: 'Walk' },
			zebra:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Zebra.gltf',
						movementAnimation: 'Walk' },
			horse:  { url: 'https://threejsfundamentals.org/threejs/resources/models/animals/Horse.gltf',
						movementAnimation: 'Walk' },
			knight: { url: 'https://threejsfundamentals.org/threejs/resources/models/knight/KnightCharacter.gltf',
						movementAnimation: 'Run' },
		};
		{
			const gltfLoader = new GLTFLoader(manager);
			for (const model of Object.values(models)) {
                gltfLoader.load(model.url, (gltf) => {
                    model.gltf = gltf;
                });
			}
		}

		function prepModelsAndAnimations() {
			Object.values(models).forEach(model => {
			console.log('------->:', model.url);
			const animsByName = {};
			model.gltf.animations.forEach((clip) => {
				animsByName[clip.name] = clip;
				console.log('  ', clip.name);
				// Should really fix this in .blend file
				if (clip.name === 'Walk') {
				    clip.duration /= 2;
				}
			});
			model.animations = animsByName;
			});
		}

		const kForward = new THREE.Vector3(0, 0, 1);
		const kBackward = new THREE.Vector3(0, 0, -1);
		const kUpwards = new THREE.Vector3(0, 1, 0);
		const gravity = 9.8;
		const initialVelocity = 17;
		const globals = {
			time: 0,
			deltaTime: 0,
			moveSpeed: 32,
			camera,
		};
		const gameObjectManager = new GameObjectManager();
		const inputManager = new InputManager();


		class SkinInstance extends Component {
			constructor(gameObject, model) {
				super(gameObject);
				this.model = model;
				console.log('got model in skin', model, this.model.gltf.scene);
				this.animRoot = SkeletonUtils.clone(this.model.gltf.scene);
				this.mixer = new THREE.AnimationMixer(this.animRoot);
				gameObject.transform.add(this.animRoot);
				this.actions = {};
			}
			setAnimation(animName) {
				const clip = this.model.animations[animName];
				// turn off all current actions
				for (const action of Object.values(this.actions)) {
					action.enabled = false;
				}
				// get or create existing action for clip
				const action = this.mixer.clipAction(clip);
				action.enabled = true;
				action.reset();
				action.play();
				this.actions[animName] = action;
			}
			update() {
				this.mixer.update(globals.deltaTime);
			}
		}

		class Player extends Component {
			constructor(gameObject, model) {
				super(gameObject);
				this.model = model
				// const model = model
				this.skinInstance = gameObject.addComponent(SkinInstance, this.model);
				this.skinInstance.setAnimation('Idle');
				this.turnSpeed = globals.moveSpeed / 4;
				this.offScreenTimer = 0;
				this.maxTimeOffScreen = 3;
                this.isRunning = false;
				this.isTurning = false;
				this.isJumping = false;
				this.totalJumpingTime = 0;
				this.prevPos = gameObject.transform.position;
			}

			update() {
				const {deltaTime, moveSpeed, cameraInfo} = globals;
				const {transform} = this.gameObject;
				const delta = (inputManager.keys.left.down || inputManager.keys.a.down  ?  1 : 0) +
							(inputManager.keys.right.down || inputManager.keys.d.down ? -1 : 0);
                transform.rotation.y += this.turnSpeed * delta * deltaTime;
				if (inputManager.keys.up.down || inputManager.keys.w.down) {
					if (!this.isRunning) {
						this.isRunning = true;
						this.skinInstance.setAnimation(this.model.movementAnimation)
					}
					transform.translateOnAxis(kForward, moveSpeed * deltaTime);
				} else if (inputManager.keys.down.down || inputManager.keys.s.down) {
					if (!this.isRunning) {
						this.isRunning = true;
						this.skinInstance.setAnimation(this.model.movementAnimation)
					}
					transform.translateOnAxis(kBackward, moveSpeed * deltaTime);
				} else {
					if (this.isRunning) {
						this.isRunning = false;
						this.skinInstance.setAnimation('Idle')
					}
				}
				if (inputManager.keys.left.down || inputManager.keys.right.down ||
				    inputManager.keys.a.down || inputManager.keys.d.down) {

                    if (!this.isTurning) {
                        this.isTurning = true;
					}
                } else {
                    if (this.isTurning) {
                        this.isTurning = false;
                    }
				}

				if (inputManager.keys.space.down) {
					if (!this.isJumping) {
						this.isJumping = true;
					}
				}

				if (this.isJumping) {
					this.totalJumpingTime = this.totalJumpingTime + deltaTime;
					let newV = getVelocity(25, -9.8, this.totalJumpingTime);
					let newY = getY(0, newV, -9.8, this.totalJumpingTime);
					if (newY < 0) {
						this.isJumping = false;
						this.totalJumpingTime = 0;
					} else {
						transform.position.y = newY
					}

				}

				if (inputManager.keys.shift.down){
					transform.position.set(transform.position.x, transform.position.y-.5, transform.position.z);

				}
                
                if (this.isRunning || this.isTurning || this.isJumping) {
					console.log('got movement');
                    playerMove(transform.position, transform.rotation);
                }
				//

				const {frustum} = cameraInfo;
				if (frustum.containsPoint(transform.position)) {
					this.offscreenTimer = 0;
				} else {
					this.offscreenTimer += deltaTime;
					if (this.offscreenTimer >= this.maxTimeOffScreen) {
						transform.position.set(0, 0, 0);
					}
				}
				this.prevPos = TransformStream.position
			}
        }
        
        class OtherPlayer extends Component {
			constructor(gameObject, model, id) {
				super(gameObject);
				this.id = id;
				const skinInstance = gameObject.addComponent(SkinInstance, model);
				skinInstance.mixer.timeScale = globals.moveSpeed / 4;
				skinInstance.setAnimation('Idle');
			}

		}

		class Animal extends Component {
			constructor(gameObject, model, id) {
				super(gameObject);
				this.model = model;
				this.id = id;
				this.prevPos = gameObject.transform.position;
				this.prevWalking = false;
				this.isWalking = false;
				this.skinInstance = gameObject.addComponent(SkinInstance, model);
				this.skinInstance.mixer.timeScale = globals.moveSpeed / 4;
				this.skinInstance.setAnimation('Idle');
				this.isWalkingThresholdLimit = 50000;
				this.isWalkingThreshold = 0;
			}
			update() {
				console.log('updating animalll')
				if (this.id in playerLocations) {
					console.log('updating animal', playerLocations[this.id])

					let pos = playerLocations[this.id].position
					let rot = playerLocations[this.id].rotation
					if(pos.x != this.prevPos.x || pos.y != this.prevPos.y || pos.z != this.prevPos.z){
						if (this.isWalkingThreshold > this.isWalkingThresholdLimit) {
							this.isWalking = true;
							this.isWalkingThreshold = 0;
						} else {
							console.log('got walking threshold', this.isWalkingThreshold)
							this.isWalkingThreshold += 1;
						}
					};
					// going from not walking to walking - start animation
					if (this.isWalking && !this.prevWalking) {
						this.skinInstance.setAnimation(this.model.movementAnimation)
					} else if (!this.isWalking && this.prevWalking) { // walking to not walking - stop animation
						this.skinInstance.setAnimation('Idle');
					} 

					this.gameObject.transform.position.set(pos.x, pos.y, pos.z)
					this.gameObject.transform.rotation.set(rot['_x'], rot['_y'], rot['_z'])

					this.prevPos = pos
					this.prevWalking = this.walking
				} else {
					console.log('player left removing game object')
					gameObjectManager.removeGameObject(this.gameObject);
				}
			
			}
		}
		/*
		class Surface extends Component {
			constructor(
				gameObject, 
				height=100, 
				width=100, 
				widthSegments=undefined,
				heightSegments=undefined,
				color = 0x989898,
				x=0,
				y=0,
				z=0,
				rotateX=undefined,
				rotateY=undefined,
				rotateZ=undefined)
				{
					super(gameObject);
					this.surfaceGeo = new THREE.PlaneGeometry( height, width, widthSegments || 0, heightSegments || 0)
					this.material = new THREE.MeshBasicMaterial( {color, side: THREE.DoubleSide});
					this.surface = new THREE.Mesh( this.surfaceGeo, this.material );
					if (x != 0) {
						this.surface.position.x = x
					}
					if (y != 0) {
						this.surface.position.y = y
					}
					if (z != 0) {
						this.surface.position.z = z
					}
					if (rotateX) {
						this.surface.rotateX(rotateX)
					}
					if (rotateY) {
						this.surface.rotateY(rotateY)
					}
					if (rotateZ) {
						this.surface.rotateZ(rotateZ)
					}
					this.surfaceInstance = gameObject.addComponent(this.surface, model);

				}
			update() {
				console.log('updating surface');
			}

		// scene.add(ground);
		}
		*/

		class CameraInfo extends Component {
			constructor(gameObject) {
				super(gameObject);
				this.projScreenMatrix = new THREE.Matrix4();
				this.frustum = new THREE.Frustum();
			}
			update() {
				const {camera} = globals;
				this.projScreenMatrix.multiplyMatrices(
					camera.projectionMatrix,
					camera.matrixWorldInverse);
				this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
			}
		}

		function init() {
			console.log('in init() function');
			// hide the loading bar
			const loadingElem = document.querySelector('#loading');
			loadingElem.style.display = 'none';

			prepModelsAndAnimations();
			{
				const gameObject = gameObjectManager.createGameObject(camera, 'camera');
				globals.cameraInfo = gameObject.addComponent(CameraInfo);
			}

			{
				const gameObject = gameObjectManager.createGameObject(scene, 'player');
				console.log('got client info', clientInfo)
				console.log('got model', models[clientInfo.animal])
				gameObject.addComponent(Player, models[clientInfo.animal]);
				currentlyRenderedPlayers.push(clientInfo.socket);
			}
			/*
			{
				const gameObject = gameObjectManager.createGameObject(scene, 'ground');
				gameObject.addComponent(Surface);

			}
			*/

			const animalModelNames = [
				'pig',
				'cow',
				'llama',
				'pug',
				'sheep',
				'zebra',
				'horse',
            ];
            /*
			animalModelNames.forEach((name, ndx) => {
				const gameObject = gameObjectManager.createGameObject(scene, name);
				gameObject.addComponent(Animal, models[name]);
				gameObject.transform.position.x = (ndx + 1) * 5;
            });
            */
		   	isInitalized = true;
		}

		function resizeRendererToDisplaySize(renderer) {
			const canvas = renderer.domElement;
			const width = canvas.clientWidth;
			const height = canvas.clientHeight;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
			renderer.setSize(width, height, false);
			}
			return needResize;
		}

		let then = 0;
		function render(now) {
			// convert to seconds
			globals.time = now * 0.001;
			// make sure delta time isn't too big.
			globals.deltaTime = Math.min(globals.time - then, 1 / 20);
			then = globals.time;

			if (resizeRendererToDisplaySize(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}


            if (isInitalized) {
                if (Object.keys(playerLocations).length > 0) {
                    Object.entries(playerLocations).forEach(([id, location]) => {
						// If the player is not us and not currently created - create it.
                        if (id != clientInfo.socket && currentlyRenderedPlayers.indexOf(id) === -1) {
							const otherPlayer = gameObjectManager.createGameObject(scene, id);
							let pos = location.position
							otherPlayer.addComponent(Animal, models[playerInfo[id].animal], id);
							currentlyRenderedPlayers.push(id);
							otherPlayer.transform.position.set(pos.x, pos.y, pos.z);
						}
                    })
				}
				
			}

			
			gameObjectManager.update();
            inputManager.update();
			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
	}

</script>

