// Commercial Tenant Lifecycle, Rent & Contract System
import { BUSINESS_TYPES } from '../config/businesses.js';
import { FLOOR_DEFINITIONS, floorY } from '../config/floors.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { buildingState } from '../state/buildingState.js';
import { playerState } from '../state/playerState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { saveGameData } from '../save/saveManager.js';
import { renderShopSlot } from '../world/building.js';

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

let onMissionProgressCallback = null;
export function registerMissionProgress(fn) {
    onMissionProgressCallback = fn;
}

let onSpawnPassengerCallback = null;
export function registerSpawnPassenger(fn) {
    onSpawnPassengerCallback = fn;
}

export function getBusinessTypeForFloor(floor) {
    const shop = buildingState.shops[floor];
    if (!shop || !shop.active) return null;
    const btId = shop.businessType;
    return (btId && BUSINESS_TYPES[btId]) ? BUSINESS_TYPES[btId] : null;
}

export function handleShopRentAndLifecycle(scene) {
    const rentTickSeconds = Math.round(TIMING_BALANCE.SHOP_RENT_TICK_MS / 1000);
    buildingState.unlockedFloors.forEach(f => {
        if (f === 0) return;
        const shop = buildingState.shops[f];
        if (shop && shop.active) {
            playerState.coins += shop.rent;
            playerState.totalCoinsEarnedLifetime += shop.rent;
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            playSound('coin');
            showFloatingText(scene, 310, floorY[f] - 15, `+${shop.rent} 💰 Rent`, '#2ecc71');

            if (onMissionProgressCallback) {
                onMissionProgressCallback(scene, 'rent', 1);
                onMissionProgressCallback(scene, 'coins', shop.rent);
            }

            shop.contractTime -= rentTickSeconds;
            if (shop.gracePeriod > 0) shop.gracePeriod -= rentTickSeconds;

            if (shop.timerText && shop.timerText.active) {
                shop.timerText.setText(`⏱ ${Math.max(0, shop.contractTime)}s | +${shop.rent}💰/${rentTickSeconds}s`);
            }

            if (shop.gracePeriod <= 0 && buildingState.buildingRating <= TIMING_BALANCE.TENANT_DEPARTURE_RATING_THRESHOLD) {
                shop.active = false;
                renderShopSlot(scene, f);
                playSound('alarm');
                showFloatingText(scene, 290, floorY[f] - 30, '💔 Tenant Left (Rating Low ⭐)', '#e74c3c');
                saveGameData();
                return;
            }

            if (shop.contractTime <= 0) {
                shop.active = false;
                renderShopSlot(scene, f);
                showFloatingText(scene, 290, floorY[f] - 30, '📜 Contract Ended!', '#f39c12');
                saveGameData();
            }
        }
    });
}

export function signTenantContract(scene, floor, tier) {
    playSound('coin');
    const floorDef = FLOOR_DEFINITIONS[floor];
    const tierData = (floorDef && floorDef.advertisingTiers && floorDef.advertisingTiers[tier]) ? floorDef.advertisingTiers[tier] : null;

    if (tierData) {
        buildingState.shops[floor].name = tierData.name;
        buildingState.shops[floor].desc = tierData.desc;
        buildingState.shops[floor].rent = tierData.rent;
        buildingState.shops[floor].contractTime = tierData.duration || 300;
        buildingState.shops[floor].businessType = tierData.businessType || null;
    } else {
        buildingState.shops[floor].name = `${tier} Business`;
        buildingState.shops[floor].desc = '🏢 Commercial Unit';
        buildingState.shops[floor].rent = 10;
        buildingState.shops[floor].contractTime = 300;
        buildingState.shops[floor].businessType = null;
    }

    buildingState.shops[floor].tier = tier;
    buildingState.shops[floor].gracePeriod = 60;
    buildingState.shops[floor].active = true;

    renderShopSlot(scene, floor);
    saveGameData();
    showFloatingText(scene, 290, floorY[floor] - 30, `🎉 New Lease: ${buildingState.shops[floor].name}!`, '#2ecc71');

    scene.time.delayedCall(400, () => {
        if (onSpawnPassengerCallback) onSpawnPassengerCallback(scene);
    });
}
