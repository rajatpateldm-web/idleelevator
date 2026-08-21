// Staircase Visuals & Walkout Descent Logic
import { floorY } from '../config/floors.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { passengerState } from '../state/passengerState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { saveGameData } from '../save/saveManager.js';
import { animateWalkTo, updateQueueDisplay } from '../entities/passenger.js';
import { addReputationDebt } from '../systems/reputationSystem.js';

let onModifyRatingCallback = null;
export function registerModifyRating(fn) {
    onModifyRatingCallback = fn;
}

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

export function drawStairSection(scene, topY, bottomY) {
    const steps = 6;
    const dy = (bottomY - topY) / steps;
    const dx = 36 / steps;
    for (let i = 0; i < steps; i++) {
        const stepX = 52 - i * dx;
        const stepY = topY + 30 + i * dy;
        const step = scene.add.rectangle(stepX, stepY, 14, 4, 0x3d475a).setDepth(2);
        step.setStrokeStyle(1, 0xf39c12);
    }
    const rail = scene.add.line(0, 0, 56, topY + 25, 18, bottomY + 25, 0x58a6ff, 0.7).setOrigin(0).setDepth(2);
    rail.setLineWidth(2);
}

export function triggerStaircaseWalkout(scene, passenger) {
    passenger.isWalkingOut = true;
    passenger.isWaiting = false;
    passenger.patienceBar.setVisible(false);
    passenger.barBg.setVisible(false);

    passenger.angryEmoji.setVisible(true);
    scene.tweens.add({
        targets: passenger.angryEmoji,
        alpha: 0.2,
        yoyo: true,
        repeat: -1,
        duration: 180
    });

    passengerState.floorQueues[passenger.currentFloor] = passengerState.floorQueues[passenger.currentFloor].filter(p => p !== passenger);
    updateQueueDisplay(passenger.currentFloor);

    if (onModifyRatingCallback) {
        onModifyRatingCallback(scene, TIMING_BALANCE.WALKOUT_RATING_PENALTY);
    }
    addReputationDebt(1);

    if (!sessionState.isComboPaused) {
        sessionState.consecutiveNoWalkout = 0;
        if (sessionState.serviceCombo > 0) {
            showFloatingText(scene, 180, 110, `❌ COMBO BROKEN (x${sessionState.serviceCombo})!`, '#ff4757');
        }
        sessionState.serviceCombo = 0;

        sessionState.activeMissions.forEach(m => {
            if (m.type === 'no_walkout' && !m.completed && !m.claimed) {
                m.progress = 0;
            }
        });
    } else {
        showFloatingText(scene, 180, 110, `⏸️ Combo Paused during Breakdown (x${sessionState.serviceCombo})`, '#f39c12');
    }

    if (onHUDUpdateCallback) onHUDUpdateCallback();
    saveGameData();
    playSound('alarm');
    showFloatingText(scene, passenger.x, passenger.y - 30, `${TIMING_BALANCE.WALKOUT_RATING_PENALTY.toFixed(2)} ⭐ Walkout!`, '#e74c3c');

    if (passenger.currentFloor === 0) {
        animateWalkTo(scene, passenger, 390, floorY[0] + 16, () => {
            passengerState.allActivePassengers = passengerState.allActivePassengers.filter(p => p !== passenger);
            passenger.destroy();
        });
    } else {
        animateWalkTo(scene, passenger, 45, floorY[passenger.currentFloor] + 16, () => {
            stepDownStairs(scene, passenger, passenger.currentFloor);
        });
    }
}

export function stepDownStairs(scene, passenger, fromFloor) {
    const nextFloor = fromFloor - 1;
    const targetY = floorY[nextFloor] + 16;

    scene.tweens.add({
        targets: passenger,
        x: 25,
        y: targetY,
        duration: 1000,
        ease: 'Linear',
        onComplete: () => {
            passenger.currentFloor = nextFloor;
            if (nextFloor > 0) {
                stepDownStairs(scene, passenger, nextFloor);
            } else {
                animateWalkTo(scene, passenger, 390, floorY[0] + 16, () => {
                    passengerState.allActivePassengers = passengerState.allActivePassengers.filter(p => p !== passenger);
                    passenger.destroy();
                });
            }
        }
    });
}
