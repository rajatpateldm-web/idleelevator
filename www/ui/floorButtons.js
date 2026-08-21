// Floor Action Buttons UI
import { FLOOR_DEFINITIONS, floorY } from '../config/floors.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from './floatingText.js';
import { moveElevator } from '../systems/elevatorSystem.js';
import { registerCreateFloorButtons } from '../world/building.js';

let onOpenBreakdownModalCallback = null;
export function registerOpenBreakdownModal(fn) {
    onOpenBreakdownModalCallback = fn;
}

export function createFloorButtons(scene) {
    if (!scene || !scene.add) return;
    const allFloors = Object.keys(FLOOR_DEFINITIONS).map(Number).sort((a, b) => a - b);
    allFloors.forEach(f => {
        if (sessionState.floorButtonContainers[f]) {
            sessionState.floorButtonContainers[f].destroy();
        }
        if (buildingState.unlockedFloors.includes(f)) {
            const label = f === 0 ? 'G' : `F${f}`;
            sessionState.floorButtonContainers[f] = createSingleFloorButton(scene, 85, floorY[f] - 30, label, f);
        }
    });
}

import { createCrispText, getTouchBounds } from '../config/uiConfig.js';

export function createSingleFloorButton(scene, x, y, label, targetFloor) {
    const btnBg = scene.add.rectangle(x, y + 14, 30, 26, 0x21262d).setDepth(6);
    btnBg.setStrokeStyle(1.5, 0xd29922);

    const touchBounds = getTouchBounds(30, 26, 40);
    btnBg.setInteractive(touchBounds.hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });

    const text = createCrispText(scene, x, y + 14, label, {
        category: 'PRIMARY_BUTTON',
        fontSize: 12,
        color: '#f1e05a',
        fontStyle: 'bold',
        origin: 0.5,
        depth: 7
    });

    btnBg.on('pointerdown', () => {
        playSound('click');
        if (elevatorState.isBrokenDown) {
            showFloatingText(scene, x, y - 10, '⚠️ Broken!', '#e74c3c');
            if (onOpenBreakdownModalCallback) onOpenBreakdownModalCallback(scene);
            return;
        }
        btnBg.setScale(0.92);
        scene.time.delayedCall(100, () => btnBg.setScale(1));
        moveElevator(scene, targetFloor);
    });

    return scene.add.container(0, 0, [btnBg, text]);
}

// Connect createFloorButtons to building
registerCreateFloorButtons(createFloorButtons);
