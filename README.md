# Simple FPS Game

A basic first-person shooter game built using Three.js and Vite, featuring endless enemy waves and cross-platform controls.

## Features

*   First-person perspective with a rendered gun model.
*   Endless waves of enemy soldiers that move towards the player.
*   Shooting mechanics with bullet representation.
*   Basic 3D environment with a floor and simple obstacles.
*   Player health system: Enemies damage the player on contact.
*   Kill count display.
*   Game over screen ("You Died!") with a "Start Over" option.
*   Responsive UI elements for health, kills, and messages.
*   Cross-platform controls supporting both desktop (keyboard/mouse) and mobile (touch/joystick).

## Setup and Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    Requires Node.js and npm.
    ```bash
    npm install
    ```
3.  **Start the development server:**
    ```bash
    npm run dev
    ```
4.  **Open the game:**
    *   Navigate to the local URL provided by Vite (e.g., `http://localhost:5173`) in your desktop browser.
    *   For mobile testing, ensure your mobile device is on the same Wi-Fi network as your computer. Open a mobile browser and navigate to the **Network** URL provided by Vite (e.g., `http://192.168.1.100:5173`).

## Controls

### Desktop

*   **Click Screen:** Lock pointer control / Start game
*   **Mouse Movement:** Look around
*   **W:** Move Forward
*   **A:** Move Left
*   **S:** Move Backward
*   **D:** Move Right
*   **Left Mouse Button:** Shoot
*   **ESC:** Unlock pointer control

### Mobile

*   **Left Joystick:** Move (appears bottom-left)
*   **Drag on Screen (right side):** Look around
*   **Right Button ("SHOOT"):** Shoot (appears bottom-right)

## Key Dependencies

*   [Three.js](https://threejs.org/)
*   [Vite](https://vitejs.dev/)
*   [nipplejs](https://github.com/yoannmoinet/nipplejs) (for mobile joystick) 