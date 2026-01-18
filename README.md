# 🐍 FLUPPY SNAKE | IP Logging Game

**Fluppy Snake** is a feature-packed, retro-futuristic Snake game running on Cloudflare Pages, with a hidden IP logging backend powered by Cloudflare Workers.

## 🚀 Features

### 🎮 Gameplay
-   **4 Themes**: Neon, Classic (Gameboy), Minimal, Bio-Hazard, Matrix, Sunset, Candy.
-   **4 Modes**:
    -   **Classic**: Standard Snake.
    -   **Speed**: Fast-paced action.
    -   **Survival**: Obstacles spawn as you eat.
    -   **Zen**: No walls, no death (except self-collision), just chill.
    -   **Campaign**: Speed increases as your score grows.
    -   **Portal**: Walls wrap around telekinetically.
    -   **Poison**: Avoid the red poison apples!
-   **4 Maps**: Box, Infinite, Maze, Obstacles.
-   **Difficulty**: Easy, Medium, Hard, Extreme.

### 📱 Controls
-   **PC**: WASD or Arrow Keys.
-   **Mobile**: Touch Swipe Gestures + On-Screen D-Pad.

### 🕵️‍♂️ Backend (IP Logger)
This project includes a **Cloudflare Worker** that logs visitor IP addresses.
-   **Worker URL**: `https://fluppy.suprememuhit.workers.dev` (Direct logging)
-   **Frontend URL**: `https://fluppy.pages.dev` (Silent background logging via `/ping`)

Logs are stored in Cloudflare's internal logs (viewable via `wrangler tail` or Dashboard).

## 🛠️ Installation & Deployment

### Prerequisites
-   Node.js & npm
-   Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Setup
1.  **Clone the repo**:
    ```bash
    git clone https://github.com/SupremeMuhit/fluppy.git
    cd fluppy
    ```
2.  **Install dependencies** (if using any backend libs):
    ```bash
    npm install
    ```

### Local Development
To run the worker locally:
```bash
wrangler dev
```
To run the frontend, simply open `public/index.html` or use a static server.

### Deploy
Deploy the Worker:
```bash
wrangler deploy
```
Deploy the Frontend (Cloudflare Pages):
-   Connect your GitHub repo to Cloudflare Pages.
-   Set Build Output Directory to `public`.

## 📂 Project Structure
-   `/public`: Static game files (HTML, CSS, JS).
-   `/workers`: Backend logic (`basic-ip-logger.js`).
-   `wrangler.toml`: Cloudflare configuration.

---
*Created by SupremeMuhit*
