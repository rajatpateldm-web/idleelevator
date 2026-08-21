// Elevator Mechanical Motion, Boarding & Unloading System
import { floorY } from '../config/floors.js';
import { elevatorState } from '../state/elevatorState.js';
import { passengerState } from '../state/passengerState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { openElevatorDoors, closeElevatorDoors, updateCapacityLed } from '../entities/elevator.js';
import { animateWalkTo, updateQueueDisplay } from '../entities/passenger.js';
import { checkElevatorWear } from './breakdownSystem.js';
import { runOperatorAI, registerMoveElevator, registerCheckBoarding } from './operatorSystem.js';

let onTransitionToShopDwellCallback = null;
export function registerTransitionToShopDwell(fn) {
    onTransitionToShopDwellCallback = fn;
}

let onCompleteReturnJourneyCallback = null;
export function registerCompleteReturnJourney(fn) {
    onCompleteReturnJourneyCallback = fn;
}

export function updatePassengersInsideElevator() {
    const spacing = 16;
    const startX = 145 - ((passengerState.elevatorPassengers.length - 1) * spacing) / 2;
    passengerState.elevatorPassengers.forEach((p, index) => {
        p.scene.tweens.killTweensOf(p);
        p.x = startX + index * spacing;
        p.y = elevatorState.elevatorContainer.y + 14;
        p.setDepth(14);
        p.targetTag.setVisible(false);
        p.tagBg.setVisible(false);
        p.patienceBar.setVisible(false);
        p.barBg.setVisible(false);
        if (p.specialBadge) p.specialBadge.setVisible(false);
        if (p.specialBadgeBg) p.specialBadgeBg.setVisible(false);
    });
    updateCapacityLed();
}

export function checkBoarding(scene) {
    if (elevatorState.isBrokenDown || elevatorState.isBoarding) return;
    const queue = passengerState.floorQueues[elevatorState.currentFloor];
    if (!queue) return;

    if (queue.length === 0 || passengerState.elevatorPassengers.length >= elevatorState.elevatorCapacity) {
        return;
    }

    const boardingList = [];
    while (passengerState.elevatorPassengers.length + boardingList.length < elevatorState.elevatorCapacity && queue.length > 0) {
        const passenger = queue.shift();
        passenger.isWaiting = false;
        passenger.patienceBar.setVisible(false);
        passenger.barBg.setVisible(false);
        boardingList.push(passenger);
    }

    updateQueueDisplay(elevatorState.currentFloor);

    if (boardingList.length > 0) {
        elevatorState.isBoarding = true;
        let completedBoarding = 0;

        boardingList.forEach((passenger) => {
            passenger.setDepth(14);
            animateWalkTo(scene, passenger, 145, floorY[elevatorState.currentFloor] + 16, () => {
                passengerState.elevatorPassengers.push(passenger);
                completedBoarding++;

                if (completedBoarding === boardingList.length) {
                    elevatorState.isBoarding = false;
                    updatePassengersInsideElevator();
                    if (sessionState.isOperatorActive && !elevatorState.isBrokenDown) {
                        scene.time.delayedCall(200, () => runOperatorAI(scene));
                    }
                }
            });
        });
    }
}

export function unloadPassengers(scene) {
    const stayingPassengers = [];

    passengerState.elevatorPassengers.forEach(p => {
        if (p.targetFloor === elevatorState.currentFloor) {
            p.scene.tweens.killTweensOf(p);
            checkElevatorWear(scene);

            if (p.destination === 'up') {
                if (onTransitionToShopDwellCallback) {
                    onTransitionToShopDwellCallback(scene, p);
                }
            } else {
                if (onCompleteReturnJourneyCallback) {
                    onCompleteReturnJourneyCallback(scene, p);
                }
            }
        } else {
            stayingPassengers.push(p);
        }
    });

    passengerState.elevatorPassengers = stayingPassengers;
    updatePassengersInsideElevator();
}

export function moveElevator(scene, targetFloor) {
    if (elevatorState.isMoving || elevatorState.isBrokenDown || elevatorState.isBoarding) return;
    if (elevatorState.currentFloor === targetFloor) {
        openElevatorDoors(scene, () => {
            unloadPassengers(scene);
            checkBoarding(scene);
        });
        return;
    }

    elevatorState.isMoving = true;

    closeElevatorDoors(scene, () => {
        const destinationY = floorY[targetFloor];
        const floorsDelta = Math.abs(targetFloor - elevatorState.currentFloor);
        const speedMult = (sessionState.activeRandomEvent && sessionState.activeRandomEvent.id === 'power_surge') ? 1.30 : 1.0;
        const calculatedDuration = elevatorState.moveDuration * speedMult * (1 + (floorsDelta - 1) * 0.35);

        scene.tweens.add({
            targets: elevatorState.elevatorContainer,
            y: destinationY,
            duration: calculatedDuration,
            ease: 'Cubic.easeInOut',
            onUpdate: () => {
                if (elevatorState.elevatorCable) {
                    elevatorState.elevatorCable.setTo(145, 100, 145, elevatorState.elevatorContainer.y);
                }
                updatePassengersInsideElevator();
            },
            onComplete: () => {
                elevatorState.isMoving = false;
                elevatorState.currentFloor = targetFloor;
                updatePassengersInsideElevator();

                scene.tweens.add({
                    targets: elevatorState.elevatorContainer,
                    y: destinationY + 2,
                    duration: 80,
                    yoyo: true,
                    ease: 'Quad.easeInOut',
                    onUpdate: () => {
                        if (elevatorState.elevatorCable) {
                            elevatorState.elevatorCable.setTo(145, 100, 145, elevatorState.elevatorContainer.y);
                        }
                        updatePassengersInsideElevator();
                    },
                    onComplete: () => {
                        playSound('ding');
                        openElevatorDoors(scene, () => {
                            unloadPassengers(scene);
                            checkBoarding(scene);

                            if (sessionState.isOperatorActive && !elevatorState.isBrokenDown && !elevatorState.isBoarding) {
                                scene.time.delayedCall(300, () => runOperatorAI(scene));
                            }
                        });
                    }
                });
            }
        });
    });
}

// Connect moveElevator and checkBoarding to operatorSystem
registerMoveElevator(moveElevator);
registerCheckBoarding(checkBoarding);
