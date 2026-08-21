// Elevator Idle - Application Entry Point & Orchestrator
import { createGameConfig } from './config/gameConfig.js';
import { RANDOM_EVENTS } from './config/passengers.js';
import { TIMING_BALANCE } from './config/timing.js';
import { BREAKDOWN_BALANCE } from './config/breakdown.js';
import { elevatorState } from './state/elevatorState.js';
import { sessionState } from './state/sessionState.js';
import { getAudioContext } from './audio/audioManager.js';
import { initAdMob } from './ads/adManager.js';
import { loadSavedData, saveGameData, checkAndShowOfflineEarnings } from './save/saveManager.js';
import { generateSolidTextures } from './world/visuals.js';
import { createBuildingVisuals } from './world/building.js';
import { createElevatorVisuals } from './entities/elevator.js';
import { createFloorButtons } from './ui/floorButtons.js';
import { createPinnedHUD } from './ui/hud.js';
import { handleOperatorTick } from './systems/operatorSystem.js';
import { handleShopRentAndLifecycle } from './systems/shopSystem.js';
import { spawnPassenger, updatePassengers } from './systems/passengerSystem.js';
import { handleRandomEventTick, triggerRandomEvent } from './ui/modals.js';

function create() {
    const scene = this;

    // 1. Persistence & Ad Integration
    loadSavedData();
    initAdMob();

    // 2. Offline Idle Earnings Check
    checkAndShowOfflineEarnings(scene);

    // 3. Procedural Crisp Textures
    generateSolidTextures(scene);

    // 4. Extended Vertical Skyscraper Camera Bounds
    scene.cameras.main.setBounds(0, 0, 360, 1040);
    scene.cameras.main.scrollY = 320;
    setupFreeTouchScroll(scene);

    elevatorState.passengersUntilBreakdown = Phaser.Math.Between(
        BREAKDOWN_BALANCE.MIN_PASSENGERS_THRESHOLD,
        BREAKDOWN_BALANCE.MAX_PASSENGERS_THRESHOLD
    );

    // 5. Building Architecture, Staircases & Floor Units
    createBuildingVisuals(scene);

    // 6. Elevator System
    createElevatorVisuals(scene);

    // 7. Floor Action Call Buttons
    createFloorButtons(scene);

    // 8. Fixed HUD & Upgrade Panels
    createPinnedHUD(scene);

    // 9. Breakdown Warning Banner
    elevatorState.breakdownBanner = scene.add.text(145, 120, '⚠️ OUT OF ORDER', {
        fontSize: '10px',
        color: '#ff4757',
        backgroundColor: '#1e272e',
        padding: { x: 4, y: 2 },
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(40).setVisible(false);

    // 10. Dynamic Passenger Spawner
    sessionState.passengerSpawnEvent = scene.time.addEvent({
        delay: TIMING_BALANCE.PASSENGER_SPAWN_INTERVAL_MS,
        callback: () => {
            spawnPassenger(scene);
            if (sessionState.activeRandomEvent && sessionState.activeRandomEvent.id === 'shopping_rush') {
                scene.time.delayedCall(TIMING_BALANCE.SHOPPING_RUSH_EXTRA_SPAWN_DELAY_MS, () => spawnPassenger(scene));
            }
        },
        loop: true
    });

    // 11. Automation Operator Loop
    scene.time.addEvent({
        delay: TIMING_BALANCE.OPERATOR_LOOP_MS,
        callback: () => handleOperatorTick(scene),
        loop: true
    });

    // 12. Passive Commercial Shop Rent & Contract Loop
    scene.time.addEvent({
        delay: TIMING_BALANCE.SHOP_RENT_TICK_MS,
        callback: () => handleShopRentAndLifecycle(scene),
        loop: true
    });

    // 13. Auto-Save Timer
    scene.time.addEvent({
        delay: TIMING_BALANCE.AUTO_SAVE_INTERVAL_MS,
        callback: saveGameData,
        loop: true
    });

    // 14. Investor Boost & Random Event Countdown Loop
    scene.time.addEvent({
        delay: TIMING_BALANCE.COUNTDOWN_TICK_MS,
        callback: () => {
            if (sessionState.investorBoostTimeRemaining > 0) {
                sessionState.investorBoostTimeRemaining--;
                if (sessionState.investorBoostText) {
                    sessionState.investorBoostText.setText(`💰 +50% Surge: ${sessionState.investorBoostTimeRemaining}s`).setVisible(true);
                }
            } else if (sessionState.investorBoostText) {
                sessionState.investorBoostText.setVisible(false);
            }

            handleRandomEventTick(scene);
        },
        loop: true
    });

    // 15. Natural Occasional Random Event Evaluator
    scene.time.addEvent({
        delay: TIMING_BALANCE.NATURAL_EVENT_INTERVAL_MS,
        callback: () => {
            if (!sessionState.activeRandomEvent && !elevatorState.isBrokenDown && Math.random() < TIMING_BALANCE.NATURAL_EVENT_PROBABILITY) {
                const eventKeys = Object.keys(RANDOM_EVENTS);
                const chosenKey = Phaser.Utils.Array.GetRandom(eventKeys);
                triggerRandomEvent(scene, chosenKey);
            }
        },
        loop: true
    });

    // 16. Audio Context Unlock on First User Touch
    scene.input.once('pointerdown', () => {
        getAudioContext();
    });

    // Initial Passenger Spawn
    spawnPassenger(scene);
}

function update(time, delta) {
    updatePassengers(delta);
}

function setupFreeTouchScroll(scene) {
    let isDragging = false;
    let dragStartY = 0;
    let cameraStartY = 0;

    scene.input.on('pointerdown', (pointer) => {
        if (pointer.y > 70 && pointer.y < 545) {
            isDragging = true;
            dragStartY = pointer.y;
            cameraStartY = scene.cameras.main.scrollY;
        }
    });

    scene.input.on('pointermove', (pointer) => {
        if (isDragging) {
            const deltaY = (pointer.y - dragStartY) * 1.15;
            scene.cameras.main.scrollY = Phaser.Math.Clamp(cameraStartY - deltaY, 0, 320);
        }
    });

    scene.input.on('pointerup', () => {
        isDragging = false;
    });
}

// Instantiate Phaser Game Instance
const gameConfig = createGameConfig({ create, update });
const game = new Phaser.Game(gameConfig);