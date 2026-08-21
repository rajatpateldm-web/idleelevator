// Elevator Wear, Breakdown, and Mechanic Repair System
import { floorY } from '../config/floors.js';
import { BREAKDOWN_BALANCE } from '../config/breakdown.js';
import { elevatorState } from '../state/elevatorState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { updateCapacityLed } from '../entities/elevator.js';
import { animateWalkTo } from '../entities/passenger.js';
import { createMechanicEntity } from '../entities/mechanic.js';
import { registerCompleteRepair } from '../ads/adManager.js';

let onOpenBreakdownModalCallback = null;
export function registerOpenBreakdownModal(fn) {
    onOpenBreakdownModalCallback = fn;
}

export function checkElevatorWear(scene) {
    elevatorState.passengersTransported++;
    if (elevatorState.passengersTransported >= elevatorState.passengersUntilBreakdown && !elevatorState.isBrokenDown && !elevatorState.isRepairing) {
        triggerElevatorBreakdown(scene);
    }
}

export function triggerElevatorBreakdown(scene) {
    elevatorState.isBrokenDown = true;
    sessionState.isComboPaused = true;
    updateCapacityLed();
    if (elevatorState.breakdownBanner) {
        elevatorState.breakdownBanner.setVisible(true);
        scene.tweens.add({
            targets: elevatorState.breakdownBanner,
            alpha: 0.3,
            yoyo: true,
            repeat: -1,
            duration: 250
        });
    }
    playSound('alarm');

    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    showFloatingText(scene, 145, elevY - 40, '⚠️ ELEVATOR BREAKDOWN!', '#e74c3c');
    if (onOpenBreakdownModalCallback) onOpenBreakdownModalCallback(scene);
}

export function startStandardRepair(scene) {
    if (elevatorState.mechanicContainer) {
        elevatorState.mechanicContainer.destroy();
        elevatorState.mechanicContainer = null;
    }

    elevatorState.isRepairing = true;
    elevatorState.repairTimeRemaining = BREAKDOWN_BALANCE.STANDARD_REPAIR_DURATION_SEC;

    const { container, wrench, progBar } = createMechanicEntity(scene, elevatorState.currentFloor);
    elevatorState.mechanicContainer = container;

    animateWalkTo(scene, container, 105, floorY[elevatorState.currentFloor] + 16, () => {
        const wrenchTween = scene.tweens.add({
            targets: wrench,
            angle: 45,
            yoyo: true,
            repeat: -1,
            duration: 250,
            onYoyo: () => playSound('wrench')
        });

        scene.time.addEvent({
            delay: 1000,
            repeat: BREAKDOWN_BALANCE.STANDARD_REPAIR_DURATION_SEC - 1,
            callback: () => {
                elevatorState.repairTimeRemaining--;
                const pct = (BREAKDOWN_BALANCE.STANDARD_REPAIR_DURATION_SEC - elevatorState.repairTimeRemaining) / BREAKDOWN_BALANCE.STANDARD_REPAIR_DURATION_SEC;
                progBar.width = 28 * pct;

                if (elevatorState.repairTimeRemaining <= 0) {
                    wrenchTween.stop();
                    completeRepair(scene);
                }
            }
        });
    });
}

export function completeRepair(scene) {
    elevatorState.isBrokenDown = false;
    elevatorState.isRepairing = false;
    sessionState.isComboPaused = false;
    if (elevatorState.breakdownBanner) {
        elevatorState.breakdownBanner.setVisible(false);
    }
    updateCapacityLed();
    playSound('ding');

    elevatorState.passengersTransported = 0;
    elevatorState.passengersUntilBreakdown = Phaser.Math.Between(
        BREAKDOWN_BALANCE.MIN_PASSENGERS_THRESHOLD,
        BREAKDOWN_BALANCE.MAX_PASSENGERS_THRESHOLD
    );

    if (elevatorState.mechanicContainer) {
        animateWalkTo(scene, elevatorState.mechanicContainer, -40, elevatorState.mechanicContainer.y, () => {
            if (elevatorState.mechanicContainer) {
                elevatorState.mechanicContainer.destroy();
                elevatorState.mechanicContainer = null;
            }
        });
    }

    const curY = floorY[elevatorState.currentFloor] || 320;
    showFloatingText(scene, 145, curY - 40, '✅ LIFT RESTORED!', '#2ecc71');
}

// Connect completeRepair to adManager
registerCompleteRepair(completeRepair);

