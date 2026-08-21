// Centralized Demand System Pipeline and Extension Point
import { getTenantTierProfile } from '../config/tenants.js';
import { getBusinessTypeForFloor } from './shopSystem.js';
import { buildingState } from '../state/buildingState.js';
import { getCurrentPhase } from './daySystem.js';

/**
 * Returns the current DAY_PHASE object (or null if day not active).
 * Future demand providers should read this to apply phase-specific modifiers.
 * e.g. const phase = getCurrentDayPhase(); if (phase?.id === 'MORNING_RUSH') { ... }
 */
export function getCurrentDayPhase() {
    return getCurrentPhase();
}


const demandModifierProviders = [];

/**
 * Register a provider function for external demand modifiers.
 * @param {Function} providerFn - (floor, shop, businessType) => ({ trafficRateMultiplier, patienceMultiplier, fareMultiplier, tipMultiplier, archetypeWeightModifier })
 * @returns {Function} Unregister function
 */
export function registerDemandModifierProvider(providerFn) {
    if (typeof providerFn === 'function' && !demandModifierProviders.includes(providerFn)) {
        demandModifierProviders.push(providerFn);
    }
    return () => {
        const idx = demandModifierProviders.indexOf(providerFn);
        if (idx !== -1) demandModifierProviders.splice(idx, 1);
    };
}

/**
 * Computes the final effective demand modifiers for a given floor.
 * Follows the pipeline: Business Profile -> Tenant Tier -> Future Demand Modifiers -> Future Event Modifiers -> Final Modifiers.
 * 
 * @param {number} floor 
 * @returns {Object} { trafficRateMultiplier, patienceMultiplier, fareMultiplier, tipMultiplier, archetypeWeightModifier }
 */
export function getEffectiveDemandModifiers(floor) {
    const shop = (floor > 0 && buildingState.shops) ? buildingState.shops[floor] : null;
    const businessType = floor > 0 ? getBusinessTypeForFloor(floor) : null;
    const baseTierProfile = getTenantTierProfile(shop ? shop.tier : 'Standard');

    const result = {
        trafficRateMultiplier: baseTierProfile.trafficRateMultiplier || 1.0,
        patienceMultiplier: baseTierProfile.patienceMultiplier || 1.0,
        fareMultiplier: baseTierProfile.fareMultiplier || 1.0,
        tipMultiplier: baseTierProfile.tipMultiplier || 1.0,
        archetypeWeightModifier: { ...(baseTierProfile.archetypeWeightModifier || {}) }
    };

    for (let i = 0; i < demandModifierProviders.length; i++) {
        try {
            const mod = demandModifierProviders[i](floor, shop, businessType);
            if (mod) {
                if (mod.trafficRateMultiplier) result.trafficRateMultiplier *= mod.trafficRateMultiplier;
                if (mod.patienceMultiplier) result.patienceMultiplier *= mod.patienceMultiplier;
                if (mod.fareMultiplier) result.fareMultiplier *= mod.fareMultiplier;
                if (mod.tipMultiplier) result.tipMultiplier *= mod.tipMultiplier;
                if (mod.archetypeWeightModifier) {
                    Object.keys(mod.archetypeWeightModifier).forEach(type => {
                        result.archetypeWeightModifier[type] = (result.archetypeWeightModifier[type] || 1.0) * mod.archetypeWeightModifier[type];
                    });
                }
            }
        } catch (err) {
            console.error('[DemandSystem] Error in demand modifier provider:', err);
        }
    }

    return result;
}
