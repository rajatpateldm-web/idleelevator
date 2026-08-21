// Passenger Spawning, Dwell, Return, and Patience System
import { ARCHETYPES } from '../config/passengers.js';
import { floorY } from '../config/floors.js';
import { ECONOMY_BALANCE } from '../config/economy.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { passengerState } from '../state/passengerState.js';
import { playerState } from '../state/playerState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { createPassengerEntity, animateWalkTo, getQueuePositionX } from '../entities/passenger.js';
import { triggerStaircaseWalkout } from '../world/stairs.js';
import { calculatePassengerFare } from './economySystem.js';
import { getBusinessTypeForFloor } from './shopSystem.js';
import { modifyBuildingRating, getReputationTier } from './ratingSystem.js';
import { checkBoarding, registerTransitionToShopDwell, registerCompleteReturnJourney } from './elevatorSystem.js';
import { registerSpawnPassenger as registerBuildingSpawn } from '../world/building.js';
import { registerSpawnPassenger as registerAdSpawn } from '../ads/adManager.js';

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

let onMissionProgressCallback = null;
export function registerMissionProgress(fn) {
    onMissionProgressCallback = fn;
}

export function spawnPassenger(scene) {
    if (!scene || !scene.add) return;
    if (passengerState.floorQueues[0].length >= TIMING_BALANCE.MAX_GROUND_QUEUE) return;

    const activeDestinations = [];
    buildingState.unlockedFloors.forEach(f => {
        if (f > 0 && buildingState.shops[f] && buildingState.shops[f].active) {
            const bt = getBusinessTypeForFloor(f);
            const weight = bt ? bt.visitorFrequency : 1.0;
            const slots = Math.max(1, Math.round(weight * 4));
            for (let s = 0; s < slots; s++) activeDestinations.push(f);
        }
    });

    let targetFloor = 0;
    const wantsKiosk = (Math.random() < TIMING_BALANCE.KIOSK_SPAWN_CHANCE) || (activeDestinations.length === 0);

    const eligibleArchetypes = ARCHETYPES.filter(a => !a.minRating || buildingState.buildingRating >= a.minRating);
    const roll = Math.random();

    let archetype;
    const comboSpecialBonus = Math.min(
        ECONOMY_BALANCE.MAX_COMBO_SPECIAL_SPAWN_BONUS,
        sessionState.serviceCombo * ECONOMY_BALANCE.COMBO_SPECIAL_SPAWN_BONUS_PER_LEVEL
    );
    const repTier = getReputationTier();
    const repSpecialMult = repTier ? repTier.specialSpawnMult : 1.0;
    const specialChance = Math.min(0.85, (ECONOMY_BALANCE.BASE_SPECIAL_SPAWN_CHANCE + comboSpecialBonus) * repSpecialMult);

    if (!wantsKiosk && activeDestinations.length > 0) {
        targetFloor = Phaser.Utils.Array.GetRandom(activeDestinations);
    }

    const destBusiness = targetFloor > 0 ? getBusinessTypeForFloor(targetFloor) : null;
    const specialPool = eligibleArchetypes.filter(a => a.isSpecial);
    const regularPool = eligibleArchetypes.filter(a => !a.isSpecial);

    if (destBusiness && destBusiness.attractsSpecials && specialPool.length > 0 && roll < specialChance) {
        const poolFiltered = specialPool.filter(a => destBusiness.passengerPool.includes(a.type));
        archetype = poolFiltered.length > 0
            ? Phaser.Utils.Array.GetRandom(poolFiltered)
            : Phaser.Utils.Array.GetRandom(specialPool);
    } else if (destBusiness && destBusiness.passengerPool.length > 0 && Math.random() < 0.6) {
        const poolTypes = destBusiness.passengerPool.filter(t => !ARCHETYPES.find(a => a.type === t && a.isSpecial));
        const poolMatches = regularPool.filter(a => poolTypes.includes(a.type));
        archetype = poolMatches.length > 0
            ? Phaser.Utils.Array.GetRandom(poolMatches)
            : Phaser.Utils.Array.GetRandom(regularPool.length > 0 ? regularPool : eligibleArchetypes);
    } else if (specialPool.length > 0 && roll < specialChance) {
        archetype = Phaser.Utils.Array.GetRandom(specialPool);
    } else {
        archetype = Phaser.Utils.Array.GetRandom(regularPool.length > 0 ? regularPool : eligibleArchetypes);
    }

    if (archetype.type === 'tourist' && activeDestinations.length > 0) {
        targetFloor = Phaser.Utils.Array.GetRandom(activeDestinations);
    } else if (wantsKiosk && archetype.type !== 'vip' && archetype.type !== 'celebrity' && archetype.type !== 'investor') {
        targetFloor = 0;
    } else if (targetFloor === 0 && activeDestinations.length > 0 &&
               (archetype.type === 'vip' || archetype.type === 'celebrity' || archetype.type === 'investor')) {
        targetFloor = Phaser.Utils.Array.GetRandom(activeDestinations);
    }

    const passenger = createPassengerEntity(scene, archetype, targetFloor);
    passengerState.allActivePassengers.push(passenger);

    if (targetFloor === 0) {
        handleLobbyKioskVisitor(scene, passenger);
    } else {
        passengerState.floorQueues[0].push(passenger);
        animateWalkTo(scene, passenger, getQueuePositionX(0, passengerState.floorQueues[0].length - 1), floorY[0] + 16, () => {
            passenger.isWaiting = true;
            if (!elevatorState.isMoving && !elevatorState.isBrokenDown && !elevatorState.isBoarding && elevatorState.currentFloor === 0) {
                checkBoarding(scene);
            }
        });
    }
}

export function spawnCelebrityPassenger(scene) {
    const celebArch = ARCHETYPES.find(a => a.type === 'celebrity') || ARCHETYPES[3];
    const activeDestinations = [];
    buildingState.unlockedFloors.forEach(f => {
        if (f > 0 && buildingState.shops[f] && buildingState.shops[f].active) {
            activeDestinations.push(f);
        }
    });
    const targetFloor = activeDestinations.length > 0 ? Phaser.Utils.Array.GetRandom(activeDestinations) : 0;

    const passenger = createPassengerEntity(scene, celebArch, targetFloor);
    passengerState.allActivePassengers.push(passenger);

    if (targetFloor === 0) {
        handleLobbyKioskVisitor(scene, passenger);
    } else {
        passengerState.floorQueues[0].push(passenger);
        animateWalkTo(scene, passenger, getQueuePositionX(0, passengerState.floorQueues[0].length - 1), floorY[0] + 16, () => {
            passenger.isWaiting = true;
            if (!elevatorState.isMoving && !elevatorState.isBrokenDown && !elevatorState.isBoarding && elevatorState.currentFloor === 0) {
                checkBoarding(scene);
            }
        });
    }
}

export function handleLobbyKioskVisitor(scene, passenger) {
    passenger.patienceBar.setVisible(false);
    passenger.barBg.setVisible(false);
    animateWalkTo(scene, passenger, 290, floorY[0] + 16, () => {
        scene.time.delayedCall(ECONOMY_BALANCE.KIOSK_DWELL_MS, () => {
            if (!passenger.active) return;
            const prestigeBonus = 1 + (playerState.prestigeTokens * ECONOMY_BALANCE.PRESTIGE_MULTIPLIER_PER_TOKEN);
            const earnedCoins = Math.round(ECONOMY_BALANCE.KIOSK_COINS * prestigeBonus);
            playerState.coins += earnedCoins;
            modifyBuildingRating(scene, ECONOMY_BALANCE.KIOSK_RATING_DELTA);
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            playSound('coin');
            showFloatingText(scene, 290, floorY[0] - 15, `+${earnedCoins} 💰 Coffee Sale`, '#2ecc71');

            if (onMissionProgressCallback) {
                onMissionProgressCallback(scene, 'coins', earnedCoins);
            }

            animateWalkTo(scene, passenger, 390, floorY[0] + 16, () => {
                passengerState.allActivePassengers = passengerState.allActivePassengers.filter(p => p !== passenger);
                passenger.destroy();
            });
        });
    });
}

export function transitionToShopDwell(scene, passenger) {
    passenger.currentFloor = elevatorState.currentFloor;
    const shopX = 260 + (passengerState.floorOccupants[elevatorState.currentFloor].length % 3) * 24;
    passengerState.floorOccupants[elevatorState.currentFloor].push(passenger);

    const bt = getBusinessTypeForFloor(elevatorState.currentFloor);
    const dwellMin = bt ? bt.dwellMin : 7000;
    const dwellMax = bt ? bt.dwellMax : 10000;
    const dwellBase = Phaser.Math.Between(dwellMin, dwellMax);
    const dwellDuration = passenger.archetype.dwellMultiplier ? dwellBase * passenger.archetype.dwellMultiplier : dwellBase;

    animateWalkTo(scene, passenger, shopX, floorY[elevatorState.currentFloor] + 16, () => {
        scene.time.delayedCall(dwellDuration, () => {
            if (!passenger.active) return;
            passengerState.floorOccupants[passenger.currentFloor] = passengerState.floorOccupants[passenger.currentFloor].filter(item => item !== passenger);

            passenger.lastVisitedFloor = passenger.currentFloor;
            passenger.destination = 'down';
            passenger.targetFloor = 0;
            passenger.targetTag.setText('G').setColor('#2ecc71').setVisible(true);
            passenger.tagBg.setStrokeStyle(1.5, 0x2ecc71).setVisible(true);
            passenger.patience = passenger.maxPatience;
            passenger.patienceBar.setVisible(true);
            passenger.barBg.setVisible(true);
            if (passenger.specialBadge) passenger.specialBadge.setVisible(true);
            if (passenger.specialBadgeBg) passenger.specialBadgeBg.setVisible(true);

            passengerState.floorQueues[passenger.currentFloor].push(passenger);
            animateWalkTo(scene, passenger, getQueuePositionX(passenger.currentFloor, passengerState.floorQueues[passenger.currentFloor].length - 1), floorY[passenger.currentFloor] + 16, () => {
                passenger.isWaiting = true;
            });
        });
    });
}

export function completeReturnJourney(scene, passenger) {
    const archetype = passenger.archetype;
    const { isHappy, earnedCoins, earnedTips, ratingDelta } = calculatePassengerFare(passenger);

    if (archetype.grantsInvestorBoost) {
        sessionState.investorBoostTimeRemaining = Math.min(
            ECONOMY_BALANCE.INVESTOR_SURGE_MAX_DURATION_SEC,
            sessionState.investorBoostTimeRemaining + ECONOMY_BALANCE.INVESTOR_SURGE_DURATION_SEC
        );
        showFloatingText(scene, 180, 140, '📈 30s Investor Income Surge Active (+50%)!', '#10b981');
    }

    modifyBuildingRating(scene, ratingDelta);

    playerState.coins += earnedCoins;
    playerState.tips += earnedTips;
    playerState.totalCoinsEarnedLifetime += earnedCoins;
    playerState.totalPassengersServedLifetime++;
    if (archetype.isSpecial) {
        playerState.specialPassengersTransported++;
    }

    if (onHUDUpdateCallback) onHUDUpdateCallback();

    if (earnedTips > 0) {
        playSound('tip');
    } else {
        playSound('coin');
    }

    const badgeLabel = archetype.badge ? `${archetype.badge} ` : '';
    const rewardLabel = earnedTips > 0 ? `${badgeLabel}+${earnedCoins} 💰 +${earnedTips} 💎` : `${badgeLabel}+${earnedCoins} 💰`;
    showFloatingText(scene, passenger.x, passenger.y - 20, rewardLabel, archetype.badgeColor || (earnedTips > 0 ? '#00d2d3' : '#f1c40f'));

    if (onMissionProgressCallback) {
        onMissionProgressCallback(scene, 'passengers', 1);
        onMissionProgressCallback(scene, 'coins', earnedCoins);
        if (earnedTips > 0) {
            onMissionProgressCallback(scene, 'tips', earnedTips);
        }
        sessionState.consecutiveNoWalkout++;
        onMissionProgressCallback(scene, 'no_walkout', 1);
    }

    passengerState.allActivePassengers = passengerState.allActivePassengers.filter(item => item !== passenger);

    animateWalkTo(scene, passenger, 390, floorY[0] + 16, () => {
        passenger.destroy();
    });
}

export function updatePassengers(delta) {
    for (let i = passengerState.allActivePassengers.length - 1; i >= 0; i--) {
        const p = passengerState.allActivePassengers[i];
        if (p && p.active && p.isWaiting) {
            p.patience -= delta / 1000;
            if (p.patience < 0) p.patience = 0;

            const pct = p.patience / p.maxPatience;
            p.patienceBar.width = 24 * pct;

            if (pct > 0.5) {
                p.patienceBar.fillColor = 0x2ecc71;
            } else if (pct > 0.25) {
                p.patienceBar.fillColor = 0xf39c12;
            } else {
                p.patienceBar.fillColor = 0xe74c3c;
            }

            if (p.patience <= 0 && !p.isWalkingOut) {
                triggerStaircaseWalkout(p.scene, p);
            }
        }
    }
}

// Register callbacks with elevatorSystem and others
registerTransitionToShopDwell(transitionToShopDwell);
registerCompleteReturnJourney(completeReturnJourney);
registerBuildingSpawn(spawnPassenger);
registerAdSpawn(spawnPassenger);
