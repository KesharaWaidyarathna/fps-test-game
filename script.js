import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Import GLTFLoader

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
let totalEnemiesToSpawn = 20;
let enemiesSpawned = 0;
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
        // Spawn initial enemies up to the total count
        const initialSpawnCount = Math.min(totalEnemiesToSpawn, 5); // Spawn a few initially
        spawnEnemies(initialSpawnCount);
        enemiesSpawned += initialSpawnCount;
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

    // Check win condition
    if (killCount >= totalEnemiesToSpawn) {
        endGame(true); // Player wins
    }
    // Spawn remaining enemies if needed
    else if (enemiesSpawned < totalEnemiesToSpawn) {
        const spawnNow = Math.min(totalEnemiesToSpawn - enemiesSpawned, 3); // Spawn in waves
        spawnEnemies(spawnNow);
        enemiesSpawned += spawnNow;
    }
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
    if (!gameActive) return; // Don't run multiple times
    gameActive = false;
    controls.unlock(); // Release pointer lock

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

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);

// Pointer Lock Event Listeners
document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    }
});

controls.addEventListener('lock', () => {
    console.log('Pointer locked');
    // You might want to hide a start menu here
});

controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
    // You might want to show a pause menu here
});

// scene.add(controls.getObject()); // We add the camera itself now, which includes the controls object AND the gun

// Movement state
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Shooting
const bullets = [];
const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red bullets
const bulletSpeed = 25;
const bulletMaxDistance = 50;

function shoot() {
    if (!controls.isLocked) return; // Only shoot when pointer is locked

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Get camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // Set bullet initial position slightly in front of the camera
    bullet.position.copy(camera.position).add(direction.multiplyScalar(0.2));

    // Store direction and add velocity (needs to be updated in animate)
    bullet.userData.velocity = direction.normalize().multiplyScalar(bulletSpeed);
    bullet.userData.distanceTraveled = 0;

    scene.add(bullet);
    bullets.push(bullet);
}

// Add mouse down listener for shooting (using mousedown for potential hold-to-fire later)
document.addEventListener('mousedown', (event) => {
    // Check for left mouse button (button === 0)
    if (event.button === 0) {
        shoot();
    }
});

const moveSpeed = 5.0;
const velocity = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
let lastTime = performance.now();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Animation Loop
function animate() {
    if (!gameActive) return; // Stop loop if game ended

    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;

    // Player Movement
    if (controls.isLocked === true) {
        velocity.x -= velocity.x * 10.0 * deltaTime;
        velocity.z -= velocity.z * 10.0 * deltaTime;

        moveDirection.z = Number(keys['KeyW'] || false) - Number(keys['KeyS'] || false);
        moveDirection.x = Number(keys['KeyD'] || false) - Number(keys['KeyA'] || false);
        moveDirection.normalize(); // Ensures consistent movement speed

        if (keys['KeyW'] || keys['KeyS']) velocity.z -= moveDirection.z * moveSpeed * 10.0 * deltaTime; // Apply acceleration
        if (keys['KeyA'] || keys['KeyD']) velocity.x -= moveDirection.x * moveSpeed * 10.0 * deltaTime;

        controls.moveRight(-velocity.x * deltaTime);
        controls.moveForward(-velocity.z * deltaTime);
    }

    // --- Enemy Movement, Facing & Attack ---
    const playerPosition = controls.getObject().position;

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