// Save, Load, and Offline Idle Persistence Manager
import { playerState } from '../state/playerState.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { sessionState } from '../state/sessionState.js';
import { CAPACITY_VALUES, SPEED_VALUES } from '../config/upgrades.js';
import { MISSION_TEMPLATES } from '../config/passengers.js';
import { ECONOMY_BALANCE } from '../config/economy.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';

export function createMissionInstance(templateIndex) {
    const tmpl = MISSION_TEMPLATES[templateIndex % MISSION_TEMPLATES.length];
    return {
        id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: tmpl.type,
        desc: tmpl.desc,
        target: tmpl.target,
        progress: 0,
        rewardCoins: tmpl.rewardCoins,
        rewardTips: tmpl.rewardTips,
        completed: false,
        claimed: false
    };
}

export function initDefaultMissions() {
    if (!sessionState.activeMissions || sessionState.activeMissions.length === 0) {
        sessionState.activeMissions = [
            createMissionInstance(0),
            createMissionInstance(1),
            createMissionInstance(2)
        ];
    }
}

export const CURRENT_SAVE_VERSION = 1;

/**
 * Migration registry: each migration function takes data from version (v - 1) and migrates it to v.
 * Example: MIGRATIONS[2] = (v1Data) => { return v2Data; }
 */
const MIGRATIONS = {
    // Registered future migrations go here
};

export function migrateSaveData(data) {
    if (!data || typeof data !== 'object') {
        return null;
    }

    // 1. Detect missing saveVersion; treat legacy saves as version 1
    let version = data.saveVersion;
    if (typeof version !== 'number' || version < 1) {
        version = 1;
        data.saveVersion = 1;
    }

    // 2. If a future version is detected (e.g. save from a newer build), do not erase or down-migrate
    if (version > CURRENT_SAVE_VERSION) {
        console.warn(`Save version ${version} is newer than client version ${CURRENT_SAVE_VERSION}. Loading safely without overwriting unknown fields.`);
        return data;
    }

    // 3. Sequentially apply migrations up to CURRENT_SAVE_VERSION
    while (version < CURRENT_SAVE_VERSION) {
        const nextVersion = version + 1;
        const migrationFn = MIGRATIONS[nextVersion];
        if (typeof migrationFn === 'function') {
            data = migrationFn(data) || data;
            data.saveVersion = nextVersion;
            version = nextVersion;
        } else {
            data.saveVersion = nextVersion;
            version = nextVersion;
        }
    }

    return data;
}

export function loadSavedData() {
    const saved = localStorage.getItem('elevator_idle_save');
    if (saved) {
        try {
            let data = JSON.parse(saved);
            data = migrateSaveData(data);
            if (!data) {
                initDefaultMissions();
                return;
            }

            if (typeof data.coins === 'number') playerState.coins = data.coins;
            if (typeof data.tips === 'number') playerState.tips = data.tips;
            if (typeof data.buildingRating === 'number' && data.buildingRating > 1.0) {
                buildingState.buildingRating = Math.max(
                    TIMING_BALANCE.MIN_RATING,
                    Math.min(TIMING_BALANCE.MAX_RATING, data.buildingRating)
                );
            } else {
                buildingState.buildingRating = TIMING_BALANCE.DEFAULT_RATING;
            }
            if (typeof data.isAudioMuted === 'boolean') sessionState.isAudioMuted = data.isAudioMuted;

            if (Array.isArray(data.unlockedFloors) && data.unlockedFloors.length > 0) {
                buildingState.unlockedFloors = data.unlockedFloors;
            }

            elevatorState.capacityLevel = data.capacityLevel || 1;
            elevatorState.speedLevel = data.speedLevel || 1;
            elevatorState.elevatorCapacity = CAPACITY_VALUES[elevatorState.capacityLevel - 1] || 2;
            elevatorState.moveDuration = SPEED_VALUES[elevatorState.speedLevel - 1] || 850;

            playerState.skyscraperLevel = data.skyscraperLevel || 1;
            playerState.prestigeTokens = data.prestigeTokens || 0;
            playerState.totalPassengersServedLifetime = data.totalPassengersServedLifetime || 0;
            playerState.totalCoinsEarnedLifetime = data.totalCoinsEarnedLifetime || 0;
            playerState.specialPassengersTransported = data.specialPassengersTransported || 0;
            playerState.maxServiceComboLifetime = data.maxServiceComboLifetime || 0;
            playerState.currentElevatorModelIndex = data.currentElevatorModelIndex || 0;

            playerState.lastSavedTimestamp = data.lastSavedTimestamp || 0;

            if (data.activeMissions && Array.isArray(data.activeMissions) && data.activeMissions.length === 3) {
                sessionState.activeMissions = data.activeMissions;
            } else {
                initDefaultMissions();
            }
            sessionState.consecutiveNoWalkout = data.consecutiveNoWalkout || 0;

            if (data.shops && typeof data.shops === 'object') {
                Object.keys(data.shops).forEach(f => {
                    const floorNum = parseInt(f, 10);
                    if (buildingState.shops[floorNum]) {
                        Object.assign(buildingState.shops[floorNum], data.shops[floorNum]);
                    }
                });
            }
        } catch (e) {
            console.error('Error loading save', e);
            initDefaultMissions();
        }
    } else {
        initDefaultMissions();
    }
}

export function saveGameData() {
    const savedShops = {};
    Object.keys(buildingState.shops).forEach(f => {
        const s = buildingState.shops[f];
        savedShops[f] = {
            name: s.name,
            desc: s.desc,
            active: s.active,
            contractTime: s.contractTime,
            rent: s.rent,
            tier: s.tier,
            businessType: s.businessType || null
        };
    });

    const data = {
        saveVersion: CURRENT_SAVE_VERSION,
        coins: playerState.coins,
        tips: playerState.tips,
        buildingRating: buildingState.buildingRating,
        isAudioMuted: sessionState.isAudioMuted,
        unlockedFloors: buildingState.unlockedFloors,
        capacityLevel: elevatorState.capacityLevel,
        speedLevel: elevatorState.speedLevel,
        skyscraperLevel: playerState.skyscraperLevel,
        prestigeTokens: playerState.prestigeTokens,
        totalPassengersServedLifetime: playerState.totalPassengersServedLifetime,
        totalCoinsEarnedLifetime: playerState.totalCoinsEarnedLifetime,
        specialPassengersTransported: playerState.specialPassengersTransported,
        maxServiceComboLifetime: playerState.maxServiceComboLifetime,
        currentElevatorModelIndex: playerState.currentElevatorModelIndex,
        lastSavedTimestamp: Date.now(),
        activeMissions: sessionState.activeMissions,
        consecutiveNoWalkout: sessionState.consecutiveNoWalkout,
        shops: savedShops
    };
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
        localStorage.setItem('elevator_idle_save', JSON.stringify(data));
    }
}

// Callback hook for HUD update after saving or collecting
let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

// Callback hook for mission update
let onMissionProgressCallback = null;
export function registerMissionProgressUpdater(fn) {
    onMissionProgressCallback = fn;
}

// Callback hook for opening offline modal
let onOpenOfflineModalCallback = null;
export function registerOfflineModalOpener(fn) {
    onOpenOfflineModalCallback = fn;
}

export function checkAndShowOfflineEarnings(scene) {
    if (!playerState.lastSavedTimestamp || playerState.lastSavedTimestamp <= 0) {
        playerState.lastSavedTimestamp = Date.now();
        saveGameData();
        return;
    }

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - playerState.lastSavedTimestamp) / 1000);

    playerState.lastSavedTimestamp = now;
    saveGameData();

    if (elapsedSeconds < ECONOMY_BALANCE.OFFLINE.MIN_SECONDS) {
        return;
    }

    const cappedSeconds = Math.min(elapsedSeconds, ECONOMY_BALANCE.OFFLINE.MAX_SECONDS);

    let activeShopCount = 0;
    let totalPassiveRentPerMin = 0;
    buildingState.unlockedFloors.forEach(f => {
        if (f > 0 && buildingState.shops[f] && buildingState.shops[f].active) {
            activeShopCount++;
            totalPassiveRentPerMin += (buildingState.shops[f].rent || 2) * 10;
        }
    });

    const basePassengerPerMin = activeShopCount > 0 ? (4 + activeShopCount * 2) : 2;
    const minutesAway = cappedSeconds / 60;

    const estimatedPassengers = Math.floor(minutesAway * basePassengerPerMin);
    if (estimatedPassengers <= 0) return;

    const prestigeBonus = 1 + (playerState.prestigeTokens * ECONOMY_BALANCE.PRESTIGE_MULTIPLIER_PER_TOKEN);
    const avgFare = Math.round(ECONOMY_BALANCE.OFFLINE.AVG_BASE_FARE * prestigeBonus);
    const tripCoins = estimatedPassengers * avgFare;
    const rentCoins = Math.floor((minutesAway * totalPassiveRentPerMin * ECONOMY_BALANCE.OFFLINE.RENT_EFFICIENCY));
    const totalCoins = Math.max(10, tripCoins + rentCoins);

    const ratingBonus = (buildingState.buildingRating / TIMING_BALANCE.MAX_RATING);
    const estimatedTips = Math.max(0, Math.floor(estimatedPassengers * ECONOMY_BALANCE.OFFLINE.TIP_RATE_FACTOR * ratingBonus * prestigeBonus));

    const hours = Math.floor(cappedSeconds / 3600);
    const mins = Math.floor((cappedSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    sessionState.offlinePendingEarnings = {
        passengers: estimatedPassengers,
        coins: totalCoins,
        tips: estimatedTips,
        timeStr: timeStr
    };

    if (scene && scene.time && scene.time.delayedCall) {
        scene.time.delayedCall(400, () => {
            if (onOpenOfflineModalCallback) {
                onOpenOfflineModalCallback(scene, sessionState.offlinePendingEarnings);
            }
        });
    } else if (onOpenOfflineModalCallback) {
        onOpenOfflineModalCallback(scene, sessionState.offlinePendingEarnings);
    }
}

export function collectOfflineEarnings(scene, multiplier = 1) {
    if (!sessionState.offlinePendingEarnings) return;

    const earnedCoins = sessionState.offlinePendingEarnings.coins * multiplier;
    const earnedTips = sessionState.offlinePendingEarnings.tips * multiplier;
    const servedPass = sessionState.offlinePendingEarnings.passengers;

    playerState.coins += earnedCoins;
    playerState.tips += earnedTips;
    playerState.totalCoinsEarnedLifetime += earnedCoins;
    playerState.totalPassengersServedLifetime += servedPass;

    if (onMissionProgressCallback) {
        onMissionProgressCallback(scene, 'passengers', servedPass);
        onMissionProgressCallback(scene, 'coins', earnedCoins);
        if (earnedTips > 0) {
            onMissionProgressCallback(scene, 'tips', earnedTips);
        }
    }

    sessionState.offlinePendingEarnings = null;
    if (sessionState.offlineModalContainer) {
        sessionState.offlineModalContainer.destroy();
        sessionState.offlineModalContainer = null;
    }

    playerState.lastSavedTimestamp = Date.now();
    saveGameData();
    if (onHUDUpdateCallback) onHUDUpdateCallback();

    playSound('coin');
    showFloatingText(scene, 180, 110, `🎉 Collected Offline: +${earnedCoins.toLocaleString()} 💰 +${earnedTips} 💎!`, '#2ecc71');
}
