// Elevator & Mechanical Breakdown State
import { CAPACITY_VALUES, SPEED_VALUES } from '../config/upgrades.js';

export const elevatorState = {
    // Upgrades
    capacityLevel: 1,
    speedLevel: 1,
    elevatorCapacity: CAPACITY_VALUES[0],
    moveDuration: SPEED_VALUES[0],

    // Dynamics
    currentFloor: 0,
    isMoving: false,
    isBoarding: false,

    // Breakdown
    isBrokenDown: false,
    isRepairing: false,
    passengersTransported: 0,
    passengersUntilBreakdown: 30,
    repairTimeRemaining: 0,

    // Scene visual references
    elevatorContainer: null,
    elevatorCarBg: null,
    elevatorCarInterior: null,
    elevatorDoorLeft: null,
    elevatorDoorRight: null,
    elevatorCable: null,
    capacityLed: null,
    breakdownBanner: null,
    mechanicContainer: null
};
