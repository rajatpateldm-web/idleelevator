// Development Mode Panel & Controls
import { isDevModeActive } from '../config/devConfig.js';
import { ARCHETYPES, RANDOM_EVENTS } from '../config/passengers.js';
import { FLOOR_DEFINITIONS, floorY } from '../config/floors.js';
import { playerState } from '../state/playerState.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { passengerState } from '../state/passengerState.js';
import { sessionState } from '../state/sessionState.js';
import { saveGameData, createMissionInstance } from '../save/saveManager.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from './floatingText.js';
import { moveElevator, updatePassengersInsideElevator } from '../systems/elevatorSystem.js';
import { triggerElevatorBreakdown, completeRepair } from '../systems/breakdownSystem.js';
import { createPassengerEntity, animateWalkTo, getQueuePositionX, updateQueueDisplay } from '../entities/passenger.js';
import { updateCapacityLed } from '../entities/elevator.js';
import { renderFloorStructure } from '../world/building.js';
import { createFloorButtons } from './floorButtons.js';
import { triggerRandomEvent, stopRandomEvent } from './modals.js';

let onHUDUpdateCallback = null;
export function registerDevHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

let devPanelContainer = null;

export function createDevButton(scene) {
    if (!isDevModeActive()) return;

    // Compact Top Pinned Dev Badge Button
    const btnBg = scene.add.rectangle(48, 14, 76, 20, 0xd9534f, 0.9)
        .setStrokeStyle(1.2, 0xffffff, 0.8)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0)
        .setDepth(150);

    const btnText = scene.add.text(48, 14, '🛠️ DEV MODE', {
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(151);

    btnBg.on('pointerdown', () => {
        playSound('click');
        openDevPanel(scene);
    });
}

function spawnDevPassenger(scene, archetype) {
    const activeDestinations = [];
    buildingState.unlockedFloors.forEach(f => {
        if (f > 0) activeDestinations.push(f);
    });
    const targetFloor = activeDestinations.length > 0 ? Phaser.Utils.Array.GetRandom(activeDestinations) : 1;

    const passenger = createPassengerEntity(scene, archetype, 0, 'up', targetFloor);
    passengerState.allActivePassengers.push(passenger);
    passengerState.floorQueues[0].push(passenger);

    animateWalkTo(scene, passenger, getQueuePositionX(0, passengerState.floorQueues[0].length - 1), floorY[0] + 16, () => {
        passenger.isWaiting = true;
    });

    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    showFloatingText(scene, 180, elevY, `Spawned: ${archetype.name}`, '#2ecc71');
}

function simulateTimeElapsed(scene, seconds) {
    let activeShopCount = 0;
    let totalPassiveRentPerMin = 0;
    buildingState.unlockedFloors.forEach(f => {
        if (f > 0 && buildingState.shops[f] && buildingState.shops[f].active) {
            activeShopCount++;
            totalPassiveRentPerMin += (buildingState.shops[f].rent || 2) * 10;
        }
    });

    const minutes = seconds / 60;
    const basePassengerPerMin = activeShopCount > 0 ? (4 + activeShopCount * 2) : 2;
    const estPassengers = Math.floor(minutes * basePassengerPerMin);
    const prestigeBonus = 1 + (playerState.prestigeTokens * 0.2);
    const avgFare = Math.round(7 * prestigeBonus);
    const tripCoins = estPassengers * avgFare;
    const rentCoins = Math.floor(minutes * totalPassiveRentPerMin * 0.6);
    const totalSimCoins = Math.max(5, tripCoins + rentCoins);
    const ratingBonus = (buildingState.buildingRating / 5.0);
    const estTips = Math.max(0, Math.floor(estPassengers * 0.05 * ratingBonus * prestigeBonus));

    playerState.coins += totalSimCoins;
    playerState.tips += estTips;
    playerState.totalCoinsEarnedLifetime += totalSimCoins;
    playerState.totalPassengersServedLifetime += estPassengers;

    if (onHUDUpdateCallback) onHUDUpdateCallback();
    saveGameData();
    playSound('coin');

    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    showFloatingText(scene, 180, elevY, `⏩ Sim +${seconds}s: +${totalSimCoins}💰, +${estTips}💵`, '#a855f7');
}

export function openDevPanel(scene) {
    if (devPanelContainer) {
        devPanelContainer.destroy();
        devPanelContainer = null;
    }

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.85).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 330, 560, 0x181e29).setStrokeStyle(2, 0xd9534f);

    const title = scene.add.text(180, centerY - 258, '🛠️ DEV MODE CONTROL PANEL', {
        fontSize: '13px',
        color: '#ff6b6b',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = scene.add.text(180, centerY - 242, 'Debug & Sandbox Testing Tools (Non-Production)', {
        fontSize: '8.5px',
        color: '#94a3b8'
    }).setOrigin(0.5);

    const buttons = [];

    function makeDevBtn(x, y, w, h, label, color, onClick) {
        const bg = scene.add.rectangle(x, y, w, h, color)
            .setStrokeStyle(1, 0xffffff, 0.3)
            .setInteractive({ useHandCursor: true });
        const txt = scene.add.text(x, y, label, {
            fontSize: '8.5px',
            color: '#ffffff',
            align: 'center',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        bg.on('pointerdown', () => {
            playSound('click');
            onClick();
        });

        buttons.push(bg, txt);
    }

    function makeCategoryHeader(y, text, col = '#58a6ff') {
        const header = scene.add.text(180, y, `── ${text} ──`, {
            fontSize: '9.5px',
            color: col,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        buttons.push(header);
    }

    let curY = centerY - 215;

    // 1. ECONOMY
    makeCategoryHeader(curY, 'ECONOMY', '#2ecc71');
    curY += 20;
    makeDevBtn(78, curY, 86, 22, '+100 COINS', 0x238636, () => {
        playerState.coins += 100;
        playerState.totalCoinsEarnedLifetime += 100;
        if (onHUDUpdateCallback) onHUDUpdateCallback();
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, '+100 💰', '#2ecc71');
    });
    makeDevBtn(180, curY, 86, 22, '+100 TIPS', 0x238636, () => {
        playerState.tips += 100;
        if (onHUDUpdateCallback) onHUDUpdateCallback();
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, '+100 💵', '#f1c40f');
    });
    makeDevBtn(282, curY, 86, 22, 'RESET ECO', 0x7f1d1d, () => {
        playerState.coins = 0;
        playerState.tips = 0;
        if (onHUDUpdateCallback) onHUDUpdateCallback();
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, 'Economy Zeroed', '#e74c3c');
    });

    curY += 30;

    // 2. PASSENGERS
    makeCategoryHeader(curY, 'PASSENGERS', '#38bdf8');
    curY += 20;
    makeDevBtn(66, curY, 74, 22, 'SPAWN NORM', 0x1e3a8a, () => {
        const norm = ARCHETYPES.find(a => a.type === 'standard') || ARCHETYPES[0];
        spawnDevPassenger(scene, norm);
    });
    makeDevBtn(142, curY, 70, 22, 'SPAWN VIP', 0x6d28d9, () => {
        const vip = ARCHETYPES.find(a => a.type === 'vip') || ARCHETYPES[0];
        spawnDevPassenger(scene, vip);
    });
    makeDevBtn(218, curY, 74, 22, 'SPAWN SPEC', 0x047857, () => {
        const specials = ARCHETYPES.filter(a => a.isSpecial);
        const spec = Phaser.Utils.Array.GetRandom(specials) || ARCHETYPES[0];
        spawnDevPassenger(scene, spec);
    });
    makeDevBtn(294, curY, 70, 22, 'CLEAR ALL', 0x991b1b, () => {
        passengerState.allActivePassengers.forEach(p => { if (p && p.destroy) p.destroy(); });
        passengerState.allActivePassengers = [];
        Object.keys(passengerState.floorQueues).forEach(f => {
            passengerState.floorQueues[f] = [];
            updateQueueDisplay(Number(f));
        });
        Object.keys(passengerState.floorOccupants).forEach(f => { passengerState.floorOccupants[f] = []; });
        passengerState.elevatorPassengers = [];
        updateCapacityLed();
        showFloatingText(scene, 180, centerY - 240, 'Passengers Cleared', '#e74c3c');
    });

    curY += 30;

    // 3. ELEVATOR
    makeCategoryHeader(curY, 'ELEVATOR', '#fbbf24');
    curY += 20;
    makeDevBtn(56, curY, 54, 22, 'MOVE G', 0x334155, () => moveElevator(scene, 0));
    makeDevBtn(114, curY, 54, 22, 'MOVE F1', 0x334155, () => {
        if (buildingState.unlockedFloors.includes(1)) moveElevator(scene, 1);
        else showFloatingText(scene, 180, centerY - 240, 'F1 Locked', '#e74c3c');
    });
    makeDevBtn(172, curY, 54, 22, 'MOVE F2', 0x334155, () => {
        if (buildingState.unlockedFloors.includes(2)) moveElevator(scene, 2);
        else showFloatingText(scene, 180, centerY - 240, 'F2 Locked', '#e74c3c');
    });
    makeDevBtn(230, curY, 54, 22, 'MOVE TOP', 0x334155, () => {
        const top = Math.max(...buildingState.unlockedFloors);
        moveElevator(scene, top);
    });
    makeDevBtn(288, curY, 54, 22, 'FILL/EMPTY', 0x475569, () => {
        if (passengerState.elevatorPassengers.length > 0) {
            passengerState.elevatorPassengers.forEach(p => {
                passengerState.allActivePassengers = passengerState.allActivePassengers.filter(item => item !== p);
                if (p && p.destroy) p.destroy();
            });
            passengerState.elevatorPassengers = [];
            showFloatingText(scene, 180, centerY - 240, 'Lift Emptied', '#e74c3c');
        } else {
            const needed = elevatorState.elevatorCapacity;
            for (let i = 0; i < needed; i++) {
                const p = createPassengerEntity(scene, ARCHETYPES[0], 0, 'up', Math.max(1, ...buildingState.unlockedFloors));
                passengerState.allActivePassengers.push(p);
                passengerState.elevatorPassengers.push(p);
            }
            showFloatingText(scene, 180, centerY - 240, `Lift Filled (${needed})`, '#2ecc71');
        }
        updatePassengersInsideElevator();
        updateCapacityLed();
    });

    curY += 30;

    // 4. BUILDING & REPUTATION
    makeCategoryHeader(curY, 'BUILDING & REPUTATION', '#a855f7');
    curY += 20;
    makeDevBtn(78, curY, 94, 22, 'UNLOCK FLOOR', 0x6d28d9, () => {
        const allFloors = Object.keys(FLOOR_DEFINITIONS).map(Number).sort((a, b) => a - b);
        const nextFloor = allFloors.find(f => !buildingState.unlockedFloors.includes(f));
        if (nextFloor !== undefined) {
            buildingState.unlockedFloors.push(nextFloor);
            buildingState.unlockedFloors.sort((a, b) => a - b);
            renderFloorStructure(scene, nextFloor);
            createFloorButtons(scene);
            saveGameData();
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            showFloatingText(scene, 180, centerY - 240, `Unlocked Floor ${nextFloor}!`, '#2ecc71');
        } else {
            showFloatingText(scene, 180, centerY - 240, 'All Floors Unlocked', '#f1c40f');
        }
    });
    makeDevBtn(180, curY, 86, 22, 'RATING 5.0 ⭐', 0x059669, () => {
        buildingState.buildingRating = 5.0;
        if (sessionState.ratingText) sessionState.ratingText.setText('⭐ 5.0 / 5.0');
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, 'Rating: 5.0 ⭐', '#2ecc71');
    });
    makeDevBtn(282, curY, 86, 22, 'RATING 1.0 ⭐', 0x991b1b, () => {
        buildingState.buildingRating = 1.0;
        if (sessionState.ratingText) sessionState.ratingText.setText('⭐ 1.0 / 5.0');
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, 'Rating: 1.0 ⭐', '#e74c3c');
    });

    curY += 30;

    // 5. EVENTS & BREAKDOWN
    makeCategoryHeader(curY, 'EVENTS & BREAKDOWN', '#f97316');
    curY += 20;
    makeDevBtn(56, curY, 54, 20, 'RUSH (45s)', 0xb45309, () => {
        triggerRandomEvent(scene, 'shopping_rush');
    });
    makeDevBtn(114, curY, 54, 20, 'CORP (60s)', 0x0284c7, () => {
        triggerRandomEvent(scene, 'corporate_event');
    });
    makeDevBtn(172, curY, 54, 20, 'CELEB (35s)', 0xdb2777, () => {
        triggerRandomEvent(scene, 'celebrity_visit');
    });
    makeDevBtn(230, curY, 54, 20, 'SURGE (30s)', 0xca8a04, () => {
        triggerRandomEvent(scene, 'power_surge');
    });
    makeDevBtn(288, curY, 54, 20, 'HAPPY (45s)', 0x9333ea, () => {
        triggerRandomEvent(scene, 'happy_hour');
    });

    curY += 25;
    makeDevBtn(95, curY, 120, 20, '⏹️ END ACTIVE EVENT', 0x475569, () => {
        stopRandomEvent(scene);
        showFloatingText(scene, 180, centerY - 240, 'Event Ended', '#94a3b8');
    });
    makeDevBtn(225, curY, 60, 20, 'BREAK LIFT', 0x991b1b, () => {
        triggerElevatorBreakdown(scene);
    });
    makeDevBtn(290, curY, 50, 20, 'FIX LIFT', 0x059669, () => {
        completeRepair(scene);
    });

    curY += 30;

    // 6. MISSIONS & TIME SIMULATION
    makeCategoryHeader(curY, 'MISSIONS & TIME SIM', '#ec4899');
    curY += 20;
    makeDevBtn(66, curY, 74, 22, 'COMPLETE M.', 0x831843, () => {
        const pending = sessionState.activeMissions.find(m => !m.completed && !m.claimed);
        if (pending) {
            pending.progress = pending.target;
            pending.completed = true;
            playSound('ding');
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            showFloatingText(scene, 180, centerY - 240, `Mission Done: ${pending.desc}`, '#2ecc71');
        } else {
            showFloatingText(scene, 180, centerY - 240, 'No Incomplete Missions', '#f1c40f');
        }
    });
    makeDevBtn(142, curY, 70, 22, 'RESET MISS.', 0x475569, () => {
        sessionState.activeMissions = [
            createMissionInstance(0),
            createMissionInstance(1),
            createMissionInstance(2)
        ];
        if (onHUDUpdateCallback) onHUDUpdateCallback();
        saveGameData();
        showFloatingText(scene, 180, centerY - 240, 'Missions Reset', '#2ecc71');
    });
    makeDevBtn(218, curY, 74, 22, 'SIM +1 MIN', 0x3730a3, () => simulateTimeElapsed(scene, 60));
    makeDevBtn(294, curY, 70, 22, 'SIM +10 MIN', 0x312e81, () => simulateTimeElapsed(scene, 600));

    curY += 30;

    // 7. TIME & SAVE CONTROLS
    makeCategoryHeader(curY, 'TIME & SAVE MANAGEMENT', '#64748b');
    curY += 20;
    makeDevBtn(78, curY, 86, 22, 'SIM +1 HOUR', 0x1e1b4b, () => simulateTimeElapsed(scene, 3600));
    makeDevBtn(180, curY, 86, 22, 'EXPORT SAVE', 0x0f766e, () => {
        const saved = localStorage.getItem('elevator_idle_save');
        console.log('=== EXPORTED SAVE ===\n', saved);
        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(saved);
        }
        alert(`SAVE DATA EXPORTED (and copied to clipboard if supported):\n\n${saved}`);
    });
    makeDevBtn(282, curY, 86, 22, 'RESET SAVE', 0x881337, () => {
        if (confirm('Are you sure you want to completely erase the saved game data?')) {
            localStorage.removeItem('elevator_idle_save');
            alert('Save wiped! Reloading...');
            window.location.reload();
        }
    });

    curY += 34;

    // Close Dev Panel Button
    const closeBtn = scene.add.rectangle(180, curY, 180, 26, 0x1f2937)
        .setStrokeStyle(1.2, 0xd9534f)
        .setInteractive({ useHandCursor: true });
    const closeText = scene.add.text(180, curY, '✖ CLOSE DEV PANEL', {
        fontSize: '10px',
        color: '#ff6b6b',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
        playSound('click');
        hideDevPanel();
    });

    devPanelContainer = scene.add.container(0, 0, [
        overlay, modalBg, title, subtitle, ...buttons, closeBtn, closeText
    ]).setDepth(220);
}

export function hideDevPanel() {
    if (devPanelContainer) {
        devPanelContainer.destroy();
        devPanelContainer = null;
    }
}
