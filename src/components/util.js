
import * as THREE from 'three';


export function removeArrayElement(array, element) {
    const ndx = array.indexOf(element);
    if (ndx >= 0) {
    array.splice(ndx, 1);
    }
}

export class SafeArray {
    constructor() {
        this.array = [];
        this.addQueue = [];
        this.removeQueue = new Set();
    }
    get isEmpty() {
        return this.addQueue.length + this.array.length > 0;
    }
    add(element) {
        this.addQueue.push(element);
    }
    remove(element) {
        this.removeQueue.add(element);
    }
    forEach(fn) {
        this._addQueued();
        this._removeQueued();
        for (const element of this.array) {
            if (this.removeQueue.has(element)) {
                continue;
            }
            fn(element);
        }
        this._removeQueued();
    }
    _addQueued() {
        if (this.addQueue.length) {
            this.array.splice(this.array.length, 0, ...this.addQueue);
            this.addQueue = [];
        }
    }
    _removeQueued() {
        if (this.removeQueue.size) {
            this.array = this.array.filter(element => !this.removeQueue.has(element));
            this.removeQueue.clear();
        }
    }
}

export class GameObject {
    constructor(parent, name) {
        this.name = name;
        this.components = [];
        this.transform = new THREE.Object3D();
        parent.add(this.transform);
    }
    addComponent(ComponentType, ...args) {
        const component = new ComponentType(this, ...args);
        this.components.push(component);
        return component;
    }
    removeComponent(component) {
        removeArrayElement(this.components, component);
    }
    getComponent(ComponentType) {
        return this.components.find(c => c instanceof ComponentType);
    }
    update() {
        for (const component of this.components) {
            component.update();
        }
    }
}


// Base for all components
export class Component {
    constructor(gameObject) {
    this.gameObject = gameObject;
    }
    update() {
    }
}


// Keeps the state of keys/buttons
//
// You can check
//
//   inputManager.keys.left.down
//
// to see if the left key is currently held down
// and you can check
//
//   inputManager.keys.left.justPressed
//
// To see if the left key was pressed this frame
//
// Keys are 'left', 'right', 'a', 'b', 'up', 'down'
export class InputManager {
    constructor() {
        this.keys = {};
        const keyMap = new Map();
    
        const setKey = (keyName, pressed) => {
            const keyState = this.keys[keyName];
            keyState.justPressed = pressed && !keyState.down;
            keyState.down = pressed;
            console.log('setting key', keyName, pressed)
        };
    
        const addKey = (keyCode, name) => {
            this.keys[name] = { down: false, justPressed: false };
            keyMap.set(keyCode, name);
        };
    
        const setKeyFromKeyCode = (keyCode, pressed) => {
            const keyName = keyMap.get(keyCode);
            if (!keyName) {
                return;
            }
            setKey(keyName, pressed);
        };
    
        addKey(37, 'left');
        addKey(39, 'right');
        addKey(38, 'up');
        addKey(40, 'down');
        addKey(88, 'b');
        addKey(32, 'space');
        addKey(16, 'shift');
        addKey(87, 'w');
        addKey(83, 's');
        addKey(65, 'a');
        addKey(68, 'd');


    
        window.addEventListener('keydown', (e) => {
            setKeyFromKeyCode(e.keyCode, true);
        });
        window.addEventListener('keyup', (e) => {
            setKeyFromKeyCode(e.keyCode, false);
        });

        const sides = [
            { elem: document.querySelector('#left'),  key: 'left'  },
            { elem: document.querySelector('#right'), key: 'right' },
        ];
    
        const clearKeys = () => {
            for (const {key} of sides) {
                setKey(key, false);
            }
        };

    }
    update() {
        for (const keyState of Object.values(this.keys)) {
            if (keyState.justPressed) {
                keyState.justPressed = false;
            }
        }
    }
}

export class GameObjectManager {
    constructor() {
        this.gameObjects = new SafeArray();
    }
    createGameObject(parent, name) {
        const gameObject = new GameObject(parent, name);
        this.gameObjects.add(gameObject);
        return gameObject;
    }
    removeGameObject(gameObject) {
        this.gameObjects.remove(gameObject);
    }
    update() {
        this.gameObjects.forEach(gameObject => gameObject.update());
    }
}
     
/******************************
 * PHYSICS FUNCTIONS
 ******************************/

export function getVelocity(startingV, acceleration, deltaTime) {
    return (startingV + (acceleration * deltaTime))
}
export function getY(startingY, startingV, acceleration, deltaTime) {
    return (startingY + (startingV * deltaTime) + (.5 * acceleration * Math.pow(deltaTime,2)))
}