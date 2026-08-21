// Elevator Car Entity Visuals & Door Animations
import { floorY } from '../config/floors.js';
import { ELEVATOR_MODELS } from '../config/passengers.js';
import { elevatorState } from '../state/elevatorState.js';
import { passengerState } from '../state/passengerState.js';
import { playerState } from '../state/playerState.js';
import { playSound } from '../audio/audioManager.js';

export function createElevatorVisuals(scene) {
    const shaftX = 145;
    const model = ELEVATOR_MODELS[playerState.currentElevatorModelIndex] || ELEVATOR_MODELS[0];

    // Shaft Background (Depth: 3, extended to 960 to reach Floor 5)
    const shaftBg = scene.add.rectangle(shaftX, 440, 64, 960, 0x0c0f17).setDepth(3);
    shaftBg.setStrokeStyle(2, 0x272e3b);

    // Cable (Depth: 4)
    elevatorState.elevatorCable = scene.add.line(0, 0, shaftX, -20, shaftX, floorY[0], 0x8b949e, 0.8).setOrigin(0).setDepth(4);
    elevatorState.elevatorCable.setLineWidth(2);

    // Car Back + Interior (Depth: 5)
    elevatorState.elevatorCarBg = scene.add.rectangle(0, 0, 56, 70, 0x21262d).setStrokeStyle(2, model.strokeColor);
    elevatorState.elevatorCarInterior = scene.add.rectangle(0, 2, 48, 58, model.interiorColor);

    // Capacity LED (Depth: 18)
    elevatorState.capacityLed = scene.add.rectangle(0, -31, 22, 5, 0x2ecc71).setDepth(18);

    // Doors (Depth: 16)
    elevatorState.elevatorDoorLeft = scene.add.rectangle(-12, 2, 24, 58, 0x161b22).setDepth(16).setStrokeStyle(1, 0x484f58);
    elevatorState.elevatorDoorRight = scene.add.rectangle(12, 2, 24, 58, 0x161b22).setDepth(16).setStrokeStyle(1, 0x484f58);

    elevatorState.elevatorContainer = scene.add.container(shaftX, floorY[0], [
        elevatorState.elevatorCarBg,
        elevatorState.elevatorCarInterior,
        elevatorState.capacityLed,
        elevatorState.elevatorDoorLeft,
        elevatorState.elevatorDoorRight
    ]).setDepth(5);

    updateCapacityLed();
}

export function updateElevatorCarSkin() {
    const model = ELEVATOR_MODELS[playerState.currentElevatorModelIndex] || ELEVATOR_MODELS[0];
    if (elevatorState.elevatorCarBg) elevatorState.elevatorCarBg.setStrokeStyle(2, model.strokeColor);
    if (elevatorState.elevatorCarInterior) elevatorState.elevatorCarInterior.fillColor = model.interiorColor;
}

export function updateCapacityLed() {
    if (!elevatorState.capacityLed) return;
    if (elevatorState.isBrokenDown) {
        elevatorState.capacityLed.fillColor = 0xff3838;
        return;
    }
    const occupancy = passengerState.elevatorPassengers.length;
    if (occupancy === 0) {
        elevatorState.capacityLed.fillColor = 0x2ecc71;
    } else if (occupancy < elevatorState.elevatorCapacity) {
        elevatorState.capacityLed.fillColor = 0xf39c12;
    } else {
        elevatorState.capacityLed.fillColor = 0xe74c3c;
    }
}

export function openElevatorDoors(scene, onCompleteCallback) {
    playSound('door');
    scene.tweens.add({
        targets: elevatorState.elevatorDoorLeft,
        x: -24,
        duration: 200,
        ease: 'Cubic.easeOut'
    });

    scene.tweens.add({
        targets: elevatorState.elevatorDoorRight,
        x: 24,
        duration: 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {
            if (onCompleteCallback) onCompleteCallback();
        }
    });
}

export function closeElevatorDoors(scene, onCompleteCallback) {
    playSound('door');
    scene.tweens.add({
        targets: elevatorState.elevatorDoorLeft,
        x: -12,
        duration: 200,
        ease: 'Cubic.easeIn'
    });

    scene.tweens.add({
        targets: elevatorState.elevatorDoorRight,
        x: 12,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () => {
            if (onCompleteCallback) onCompleteCallback();
        }
    });
}
