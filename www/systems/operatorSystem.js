// Automation & Operator AI Loop System
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { passengerState } from '../state/passengerState.js';
import { sessionState } from '../state/sessionState.js';

let onMoveElevatorCallback = null;
export function registerMoveElevator(fn) {
    onMoveElevatorCallback = fn;
}

let onCheckBoardingCallback = null;
export function registerCheckBoarding(fn) {
    onCheckBoardingCallback = fn;
}

export function handleOperatorTick(scene) {
    if (sessionState.operatorTimeLeft > 0) {
        sessionState.operatorTimeLeft--;
        if (sessionState.operatorStatusText) {
            sessionState.operatorStatusText.setText(`👷 Auto: ${sessionState.operatorTimeLeft}s`);
            sessionState.operatorStatusText.setColor('#2ecc71');
        }
        sessionState.isOperatorActive = true;

        if (!elevatorState.isMoving && !elevatorState.isBrokenDown && !elevatorState.isBoarding) {
            runOperatorAI(scene);
        }
    } else {
        if (sessionState.isOperatorActive) {
            sessionState.isOperatorActive = false;
            if (sessionState.operatorStatusText) {
                sessionState.operatorStatusText.setText('👷 Auto: OFF');
                sessionState.operatorStatusText.setColor('#e74c3c');
            }
        }
    }
}

export function runOperatorAI(scene) {
    if (elevatorState.isBrokenDown || elevatorState.isBoarding) return;

    if (passengerState.elevatorPassengers.length > 0) {
        if (onMoveElevatorCallback) {
            onMoveElevatorCallback(scene, passengerState.elevatorPassengers[0].targetFloor);
        }
        return;
    }

    const maxUnlocked = Math.max(...buildingState.unlockedFloors);
    for (let f = maxUnlocked; f >= 1; f--) {
        if (buildingState.unlockedFloors.includes(f) && passengerState.floorQueues[f] && passengerState.floorQueues[f].length > 0 && elevatorState.currentFloor !== f) {
            if (onMoveElevatorCallback) {
                onMoveElevatorCallback(scene, f);
            }
            return;
        }
    }

    if (passengerState.floorQueues[0] && passengerState.floorQueues[0].length > 0 && elevatorState.currentFloor !== 0) {
        if (onMoveElevatorCallback) {
            onMoveElevatorCallback(scene, 0);
        }
        return;
    }

    if (elevatorState.currentFloor === 0 && passengerState.floorQueues[0].length > 0) {
        if (onCheckBoardingCallback) onCheckBoardingCallback(scene);
        if (passengerState.elevatorPassengers.length > 0 && onMoveElevatorCallback) {
            onMoveElevatorCallback(scene, passengerState.elevatorPassengers[0].targetFloor);
        }
    }
}
