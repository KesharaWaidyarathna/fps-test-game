import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'; // RE-ADDED
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import nipplejs from 'nipplejs'; // ADDED

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background
scene.fog = new THREE.Fog(0x87ceeb, 0, 75);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.7; // Approximate eye level

// --- Load AK47 Model ---
const loader = new GLTFLoader();
let ak47Model = null; // Variable to hold the loaded model

loader.load(
    '/gun.glb', // Load the new gun model
    function (gltf) {
        // Remove the old model if it was already loaded and added
        if (ak47Model && ak47Model.parent) {
            ak47Model.parent.remove(ak47Model);
        }

        ak47Model = gltf.scene; // Re-using the variable name, now holds gun.glb
        console.log('gun.glb model loaded successfully');

        ak47Model.scale.set(0.01, 0.01, 0.01);       // Keep scale for now
        ak47Model.position.set(0.27, -0.25, -0.5);  // Adjust Y down, bring Z closer
        ak47Model.rotation.set(0.40, Math.PI, 0.55);     // Keep Y rotation, add small Z rotation (tilt)

        // Add the loaded model to the camera
        camera.add(ak47Model);
    },
    // called while loading is progressing
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // called when loading has errors
    function (error) {
        console.error('An error happened loading the model:', error);
        // Optionally, add back the placeholder if loading fails
    }
);
scene.add(camera); // Ensure camera (and its children like the gun) is in the scene
// --- End Load AK47 Model ---

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// // Basic Cube (Let's remove this for now)
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green color
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);

// Floor
const floorGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Add some simple obstacles
const obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(2, 3, 2);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

for (let i = 0; i < 10; i++) {
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
        (Math.random() - 0.5) * 80, // Random x within -40 to 40
        1.5, // Set height so bottom is on the floor (half of height 3)
        (Math.random() - 0.5) * 80  // Random z within -40 to 40
    );
    obstacle.userData.isObstacle = true; // Tag for collision detection
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Game State
let playerHealth = 100;
let gameActive = true;

// UI Elements
const healthDisplayElement = document.getElementById('healthDisplay');
const winMessageElement = document.getElementById('winMessage');
const loseMessageElement = document.getElementById('loseMessage');

// --- Enemies ---
const enemies = [];
let soldierModel = null;
let killCount = 0;
const killCountElement = document.getElementById('killCount');
const enemySpeed = 1.5;
const enemyDamage = 15;
const enemyAttackDistance = 2.5; // Increased distance for attack/disappear

// Use the same GLTFLoader instance
loader.load(
    '/soldier.glb', // Path to your soldier model
    function (gltf) {
        soldierModel = gltf.scene;
        console.log('Soldier model loaded.');
        // Spawn initial enemies
        const initialSpawnCount = 5; // Spawn 5 initially
        spawnEnemies(initialSpawnCount);
    },
    (xhr) => console.log(`Soldier ${(xhr.loaded / xhr.total * 100)}% loaded`),
    (error) => console.error('Error loading soldier model:', error)
);

function spawnEnemies(count) {
    if (!soldierModel || !gameActive) return;

    for (let i = 0; i < count; i++) {
        const enemy = soldierModel.clone(); // Clone the loaded model
        // enemy.scale.set(0.5, 0.5, 0.5); // Previous smaller scale
        enemy.scale.set(0.35, 0.35, 0.35); // Make enemies slightly smaller
        enemy.position.set(
            (Math.random() - 0.5) * 70, // Random x
            0, // Position Y on the floor
            (Math.random() - 0.5) * 70  // Random z
        );

        enemy.userData.boundingBox = new THREE.Box3().setFromObject(enemy);
        enemy.userData.isEnemy = true;

        scene.add(enemy);
        enemies.push(enemy);
    }
    console.log('Spawned', count, 'enemies');
}

function updateKillCount() {
    killCount++;
    if (killCountElement) {
        killCountElement.textContent = `Kills: ${killCount}`;
    }

    // Spawn one new enemy for each kill to make it endless
    spawnEnemies(1);
}

function updateHealth(newHealth) {
    playerHealth = Math.max(0, newHealth); // Ensure health doesn't go below 0
    if (healthDisplayElement) {
        healthDisplayElement.textContent = `Health: ${playerHealth}`;
    }
    if (playerHealth <= 0) {
        endGame(false); // Player loses
    }
}

function endGame(playerWon) {
    if (!gameActive) return;
    gameActive = false;
    if (controls && controls.isLocked) { // Only unlock if desktop controls are active and locked
        controls.unlock();
    }

    if (playerWon) {
        winMessageElement.style.display = 'block';
    } else {
        loseMessageElement.style.display = 'block';
    }
    // Optional: Stop enemy movement/animation loop etc.
}

// Add event listeners for restart buttons
const restartButtonWin = document.getElementById('restartButtonWin');
const restartButtonLose = document.getElementById('restartButtonLose');

function restartGame() {
    location.reload(); // Simple page reload to restart
}

if (restartButtonWin) {
    restartButtonWin.addEventListener('click', restartGame);
}
if (restartButtonLose) {
    restartButtonLose.addEventListener('click', restartGame);
}

// --- End Enemies / Game State ---

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 15, 10);
scene.add(directionalLight);

// --- Input Detection ---
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
console.log('Is Touch Device:', isTouchDevice);

// --- Controls Setup (Conditional) ---
let controls = null; // For PointerLockControls on desktop
const keys = {}; // For keyboard state on desktop

let lookTouch = null;
let lastLookX = 0;
let lastLookY = 0;
const lookSensitivity = 0.004; // Adjust sensitivity

let moveData = { forward: 0, right: 0 }; // Store joystick movement

if (isTouchDevice) {
    // --- Touch Controls Initialization ---
    const joystickZone = document.getElementById('joystickZone');
    if (joystickZone) {
        const joystickManager = nipplejs.create({
            zone: joystickZone,
            mode: 'static',
            position: { left: '15%', bottom: '15%' },
            color: 'white',
            size: 100
        });
        joystickManager.on('move', (evt, data) => {
            const angle = data.angle.radian;
            const force = Math.min(data.force, 1.0); // Clamp force to max 1
            moveData.forward = Math.sin(angle) * force;
            moveData.right = Math.cos(angle) * force;
        });
        joystickManager.on('end', () => {
            moveData.forward = 0;
            moveData.right = 0;
        });
    } else {
        console.warn('Joystick zone not found!');
    }

    document.addEventListener('touchstart', (event) => {
        const shootButton = document.getElementById('shootButton'); // Check inside listener
        if (event.target === joystickZone || event.target.closest('#joystickZone') || event.target === shootButton || event.target.closest('button')) {
            return;
        }
        if (!lookTouch) {
            lookTouch = event.changedTouches[0];
            lastLookX = lookTouch.clientX;
            lastLookY = lookTouch.clientY;
        }
    }, { passive: false });

    document.addEventListener('touchmove', (event) => {
        if (!lookTouch) return;
        let currentTouch = null;
        for (let i = 0; i < event.changedTouches.length; i++) {
            if (event.changedTouches[i].identifier === lookTouch.identifier) {
                currentTouch = event.changedTouches[i];
                break;
            }
        }
        if (currentTouch) {
            const deltaX = currentTouch.clientX - lastLookX;
            const deltaY = currentTouch.clientY - lastLookY;
            camera.rotation.y -= deltaX * lookSensitivity;
            camera.rotation.x -= deltaY * lookSensitivity;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
            lastLookX = currentTouch.clientX;
            lastLookY = currentTouch.clientY;
        }
    }, { passive: false });

    document.addEventListener('touchend', (event) => {
        if (lookTouch) {
            for (let i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === lookTouch.identifier) {
                    lookTouch = null;
                    break;
                }
            }
        }
    });

    const shootButton = document.getElementById('shootButton');
    if (shootButton) {
        shootButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (gameActive) shoot();
        });
    } else {
        console.warn('Shoot button not found!');
    }
    // --- End Touch Controls Initialization ---

} else {
    // --- Desktop Controls Initialization ---
    controls = new PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject()); // Add the controls object for desktop

    // Hide mobile UI elements
    const joystickZone = document.getElementById('joystickZone');
    const shootButton = document.getElementById('shootButton');
    if (joystickZone) joystickZone.style.display = 'none';
    if (shootButton) shootButton.style.display = 'none';

    document.addEventListener('click', () => {
        if (!controls.isLocked && gameActive) {
            controls.lock();
        }
    });

    controls.addEventListener('lock', () => console.log('Pointer locked'));
    controls.addEventListener('unlock', () => console.log('Pointer unlocked'));

    document.addEventListener('keydown', (event) => { keys[event.code] = true; });
    document.addEventListener('keyup', (event) => { keys[event.code] = false; });

    document.addEventListener('mousedown', (event) => {
        if (event.button === 0 && controls.isLocked && gameActive) { // Left click, locked, active
            shoot();
        }
    });
    // --- End Desktop Controls Initialization ---
}

// Shooting
const bullets = [];
const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const bulletSpeed = 25;
const bulletMaxDistance = 50;

function shoot() {
    if (!gameActive) return;
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.position.copy(camera.position).add(direction.multiplyScalar(0.2));
    bullet.userData.velocity = direction.normalize().multiplyScalar(bulletSpeed);
    bullet.userData.distanceTraveled = 0;
    scene.add(bullet);
    bullets.push(bullet);
}

const desktopMoveSpeed = 5.0; // Separate speed for keyboard
const touchMoveSpeed = 3.0;   // Separate speed for joystick
const velocity = new THREE.Vector3();
let lastTime = performance.now();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Animation Loop
function animate() {
    if (!gameActive) {
        requestAnimationFrame(animate); // Keep rendering even if game over for messages
        renderer.render(scene, camera);
        return;
    }
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;

    // --- Player Movement (Conditional) ---
    velocity.x -= velocity.x * 10.0 * deltaTime;
    velocity.z -= velocity.z * 10.0 * deltaTime;

    if (isTouchDevice) {
        // Touch Movement (Joystick)
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

        // Apply joystick input
        const joystickForce = Math.sqrt(moveData.forward * moveData.forward + moveData.right * moveData.right); // Already clamped in listener
        if (Math.abs(moveData.forward) > 0.05) { // Adjusted deadzone
            velocity.z += forward.z * moveData.forward * touchMoveSpeed * deltaTime * 10; // Use touchMoveSpeed
            velocity.x += forward.x * moveData.forward * touchMoveSpeed * deltaTime * 10;
        }
        if (Math.abs(moveData.right) > 0.05) { // Adjusted deadzone
            velocity.z -= right.z * moveData.right * touchMoveSpeed * deltaTime * 10; // Use touchMoveSpeed
            velocity.x -= right.x * moveData.right * touchMoveSpeed * deltaTime * 10;
        }
        // Apply movement directly to camera
        camera.position.x += velocity.x * deltaTime;
        camera.position.z += velocity.z * deltaTime;

    } else if (controls && controls.isLocked) {
        // Desktop Movement (Keyboard + PointerLock)
        const moveDirection = new THREE.Vector3();
        moveDirection.z = Number(keys['KeyW'] || false) - Number(keys['KeyS'] || false);
        moveDirection.x = Number(keys['KeyA'] || false) - Number(keys['KeyD'] || false);
        moveDirection.normalize(); // Ensures consistent movement speed

        if (keys['KeyW'] || keys['KeyS']) velocity.z -= moveDirection.z * desktopMoveSpeed * 10.0 * deltaTime; // Use desktopMoveSpeed
        if (keys['KeyA'] || keys['KeyD']) velocity.x -= moveDirection.x * desktopMoveSpeed * 10.0 * deltaTime; // Use desktopMoveSpeed

        controls.moveRight(velocity.x * deltaTime);
        controls.moveForward(-velocity.z * deltaTime);
    }
    // --- End Player Movement ---

    // --- Enemy Movement, Facing & Attack ---
    const playerPosition = camera.position;

    // Loop backwards for safe removal
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);

        // Check if enemy reached the player
        if (distanceToPlayer <= enemyAttackDistance) {
            console.log("Enemy reached player!");
            updateHealth(playerHealth - enemyDamage);
            scene.remove(enemy);
            enemies.splice(i, 1); // Remove from array
            continue; // Skip the rest for this removed enemy
        }

        // --- If enemy hasn't reached player, move and look --- 
        const direction = new THREE.Vector3();
        direction.subVectors(playerPosition, enemy.position).normalize();
        direction.y = 0;

        // Move
        enemy.position.addScaledVector(direction, enemySpeed * deltaTime);

        // Look at player
        const lookAtPosition = new THREE.Vector3(playerPosition.x, enemy.position.y, playerPosition.z);
        enemy.lookAt(lookAtPosition);
        enemy.rotateY(Math.PI); // Flip 180 degrees

        // Update bounding box
        enemy.userData.boundingBox.setFromObject(enemy);
        // --- End Move and Look ---
    }
    // --- End Enemy Logic ---

    // Bullet Movement & Collision Cleanup
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const distanceIncrement = bullet.userData.velocity.length() * deltaTime;

        bullet.position.addScaledVector(bullet.userData.velocity, deltaTime);
        bullet.userData.distanceTraveled += distanceIncrement;

        let bulletRemoved = false;
        const bulletPoint = bullet.position;

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (enemy.userData.boundingBox.containsPoint(bulletPoint)) {
                console.log('Enemy hit!');
                scene.remove(enemy); // Remove enemy from scene
                enemies.splice(j, 1); // Remove enemy from array

                scene.remove(bullet); // Remove bullet from scene
                bullets.splice(i, 1); // Remove bullet from array
                bulletRemoved = true;

                updateKillCount(); // Increment kill count & check win condition
                break;
            }
        }

        if (bulletRemoved) continue; // Skip further checks if bullet was removed

        // Check collision with obstacles (optional: make bullets stop)
        for (const obstacle of obstacles) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle);
            if (obstacleBox.containsPoint(bulletPoint)) {
                console.log('Obstacle hit');
                scene.remove(bullet);
                bullets.splice(i, 1);
                bulletRemoved = true;
                break;
            }
        }

        if (bulletRemoved) continue;
        // --- End Collision Detection ---

        // Remove bullet if it travels too far
        if (bullet.userData.distanceTraveled > bulletMaxDistance) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }

    lastTime = currentTime;
    renderer.render(scene, camera);
}

animate(); 