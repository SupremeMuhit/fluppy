# Multiplayer Implementation Details (Backup)

This document contains information on how the multiplayer feature was implemented in Fluppy Snake. This can be used to rebuild the feature in the future.

## Tech Stack
- **Firebase Realtime Database**: Used for room management and real-time game state synchronization.
- **Firebase Compat SDK**: Used for compatibility with the `file://` protocol and non-module scripts.

## Core Logic

### 1. Initialization
The `initMultiplayer()` function initializes Firebase with a placeholder configuration and sets up listeners for room data.

### 2. Room Management
- **Room Codes**: 5-digit numeric codes.
- **Creation**: Player 1 creates a room, setting the initial game state (mode, map, difficulty) in Firebase.
- **Joining**: Player 2 joins using the room code and listens for changes.

### 3. Synchronization
- **Snake Positions**: Each player updates their own snake position in Firebase.
- **Directions**: Directions are synced to allow smooth movement prediction.
- **Game State**: `isActive`, `connected`, and `isWaiting` flags manage the UI and game loop transitions.

### 4. UI Components
- `mp-popup`: The main entry point for selecting "Create" or "Join".
- `sidebar-game`: A dedicated sidebar view for multiplayer stats (Time, Score P1, Score P2, Room Number).
- `mp-btn`: The main menu button to trigger multiplayer setup.

## Key Code Sections (Ref)
- **`index.html`**: Lines 60-122 (Popup), 214-217 (Menu button), 231-277 (Multiplayer Sidebar).
- **`script.js`**: `mp` state object, `initMultiplayer`, `startMpAction`, and various `if (mp.isActive)` checks in `update()` and `draw()`.
- **`style.css`**: Styles for `#mp-popup`, `#sidebar-game`, and the `.loader` animation.

## Historical Note
Removed on 2026-01-21 to simplify the game to a pure single-player experience.
