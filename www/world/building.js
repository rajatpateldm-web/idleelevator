// Building Architecture, Staircases, and Floor Structure Rendering
import { FLOOR_DEFINITIONS, FLOOR_UNLOCK_COSTS, floorY } from '../config/floors.js';
import { buildingState } from '../state/buildingState.js';
import { playerState } from '../state/playerState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { saveGameData } from '../save/saveManager.js';
import { drawStairSection } from './stairs.js';
import { createShopSlotVisual } from '../entities/shop.js';

let onOpenAdvertisingModalCallback = null;
export function registerOpenAdvertisingModal(fn) {
    onOpenAdvertisingModalCallback = fn;
}

let onCreateFloorButtonsCallback = null;
export function registerCreateFloorButtons(fn) {
    onCreateFloorButtonsCallback = fn;
}

let onSpawnPassengerCallback = null;
export function registerSpawnPassenger(fn) {
    onSpawnPassengerCallback = fn;
}

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

export function createBuildingVisuals(scene) {
    // 1. Staircase Shaft (Depth: 1)
    const stairwellBg = scene.add.rectangle(35, 450, 60, 960, 0x131720).setDepth(1);
    stairwellBg.setStrokeStyle(2, 0x2c3444);

    scene.add.text(35, 15, '🪜 STAIRS', { fontSize: '7px', color: '#e0af68', fontStyle: 'bold' }).setOrigin(0.5).setDepth(2);

    // Draw staircase connections dynamically for all floors above ground
    const definedUpperFloors = Object.keys(FLOOR_DEFINITIONS).map(Number).filter(f => f > 0).sort((a, b) => a - b);
    for (let i = 0; i < definedUpperFloors.length; i++) {
        const higherFloor = definedUpperFloors[i];
        const lowerFloor = higherFloor - 1;
        if (floorY[higherFloor] !== undefined && floorY[lowerFloor] !== undefined) {
            drawStairSection(scene, floorY[higherFloor], floorY[lowerFloor]);
        }
    }

    // Ground Floor Lobby (Depth: 1 & 2)
    scene.add.rectangle(210, floorY[0] + 32, 290, 10, 0x3b4457).setDepth(1).setStrokeStyle(1, 0x56637a);
    scene.add.rectangle(305, floorY[0] + 4, 85, 48, 0x1a252f, 0.9).setDepth(1).setStrokeStyle(1, 0x2ecc71);
    scene.add.text(270, floorY[0] - 14, '☕ LOBBY KIOSK', { fontSize: '8px', color: '#2ecc71', fontStyle: 'bold' }).setDepth(2);
    scene.add.text(270, floorY[0] - 2, 'Snacks & Coffee', { fontSize: '7px', color: '#a5b1c2' }).setDepth(2);
    scene.add.text(270, floorY[0] + 8, '💰 Foot Traffic', { fontSize: '6.5px', color: '#f1c40f' }).setDepth(2);

    definedUpperFloors.forEach(floor => {
        renderFloorStructure(scene, floor);
    });
}

export function renderFloorStructure(scene, floor) {
    const y = floorY[floor];
    scene.add.rectangle(210, y + 32, 290, 10, 0x3b4457).setDepth(1).setStrokeStyle(1, 0x56637a);

    if (buildingState.unlockedFloors.includes(floor)) {
        renderShopSlot(scene, floor);
    } else {
        renderLockedConstructionSlot(scene, floor);
    }
}

export function renderLockedConstructionSlot(scene, floor) {
    if (buildingState.lockedFloorUI[floor]) {
        buildingState.lockedFloorUI[floor].destroy();
    }

    const y = floorY[floor];
    const cost = FLOOR_UNLOCK_COSTS[floor];

    const slotBg = scene.add.rectangle(0, 0, 105, 48, 0x2b1e10, 0.9).setStrokeStyle(1.5, 0xf39c12);
    const label = scene.add.text(0, -12, `🏗️ UNLOCK F${floor}`, { fontSize: '9px', color: '#f39c12', fontStyle: 'bold' }).setOrigin(0.5);
    const costText = scene.add.text(0, 4, `${cost} 💰`, { fontSize: '10px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
    const subText = scene.add.text(0, 16, 'Tap to Build', { fontSize: '7px', color: '#cbd5e1' }).setOrigin(0.5);

    const container = scene.add.container(290, y + 4, [slotBg, label, costText, subText]).setDepth(2);

    slotBg.setInteractive({ useHandCursor: true });
    slotBg.on('pointerdown', () => {
        if (floor > 1 && !buildingState.unlockedFloors.includes(floor - 1)) {
            showFloatingText(scene, 290, y - 25, `Unlock Floor ${floor - 1} First!`, '#e74c3c');
            playSound('alarm');
            return;
        }

        if (playerState.coins >= cost) {
            playerState.coins -= cost;
            buildingState.unlockedFloors.push(floor);
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            playSound('build');
            showFloatingText(scene, 290, y - 30, `🎉 Floor ${floor} Constructed!`, '#2ecc71');

            container.destroy();
            renderShopSlot(scene, floor);
            if (onCreateFloorButtonsCallback) onCreateFloorButtonsCallback(scene);

            scene.time.delayedCall(400, () => {
                if (onSpawnPassengerCallback) onSpawnPassengerCallback(scene);
            });
        } else {
            showFloatingText(scene, 290, y - 25, `Need ${cost} 💰!`, '#e74c3c');
            playSound('click');
        }
    });

    buildingState.lockedFloorUI[floor] = container;
}

export function renderShopSlot(scene, floor) {
    if (buildingState.shops[floor] && buildingState.shops[floor].uiContainer) {
        buildingState.shops[floor].uiContainer.destroy();
    }

    const shop = buildingState.shops[floor];
    const y = floorY[floor];
    const floorDef = FLOOR_DEFINITIONS[floor];

    const { shopBg, titleText, subText, timerText, activityLight } = createShopSlotVisual(scene, floor, shop);

    // Floor Theme Signage / Light Strip
    const floorLabelBg = scene.add.rectangle(-53, -24, 28, 9, 0x1e293b, 0.9).setStrokeStyle(0.8, 0x475569);
    const floorLabelText = scene.add.text(-53, -24, `F${floor}`, { fontSize: '6.5px', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);

    const elements = [shopBg, floorLabelBg, floorLabelText, titleText, subText, timerText];
    if (activityLight) elements.push(activityLight);

    const container = scene.add.container(290, y + 4, elements).setDepth(2);

    shopBg.setInteractive({ useHandCursor: true });
    shopBg.on('pointerdown', () => {
        playSound('click');
        if (!shop.active) {
            if (onOpenAdvertisingModalCallback) onOpenAdvertisingModalCallback(scene, floor);
        } else {
            showFloatingText(scene, 290, y - 25, `${shop.name} (${shop.contractTime}s left)`, '#58a6ff');
        }
    });

    buildingState.shops[floor].uiContainer = container;
    buildingState.shops[floor].timerText = timerText;
}
