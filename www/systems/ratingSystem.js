// Building Reputation Rating System & Tiers
import { TIMING_BALANCE } from '../config/timing.js';
import { buildingState } from '../state/buildingState.js';
import { sessionState } from '../state/sessionState.js';
import { saveGameData } from '../save/saveManager.js';

export const REPUTATION_TIERS = {
    POOR: { id: 'POOR', label: 'POOR', min: 1.0, max: 1.99, color: '#e74c3c', tipMult: 0.7, specialSpawnMult: 0.5, incomeMult: 0.8 },
    AVERAGE: { id: 'AVERAGE', label: 'AVERAGE', min: 2.0, max: 2.99, color: '#f39c12', tipMult: 0.9, specialSpawnMult: 0.8, incomeMult: 0.95 },
    GOOD: { id: 'GOOD', label: 'GOOD', min: 3.0, max: 3.99, color: '#f1c40f', tipMult: 1.0, specialSpawnMult: 1.0, incomeMult: 1.0 },
    EXCELLENT: { id: 'EXCELLENT', label: 'EXCELLENT', min: 4.0, max: 4.79, color: '#2ecc71', tipMult: 1.25, specialSpawnMult: 1.3, incomeMult: 1.15 },
    ELITE: { id: 'ELITE', label: 'ELITE', min: 4.8, max: 5.0, color: '#a855f7', tipMult: 1.6, specialSpawnMult: 1.75, incomeMult: 1.35 }
};

export function getReputationTier(rating = buildingState.buildingRating) {
    if (rating >= 4.8) return REPUTATION_TIERS.ELITE;
    if (rating >= 4.0) return REPUTATION_TIERS.EXCELLENT;
    if (rating >= 3.0) return REPUTATION_TIERS.GOOD;
    if (rating >= 2.0) return REPUTATION_TIERS.AVERAGE;
    return REPUTATION_TIERS.POOR;
}

export function modifyBuildingRating(scene, delta) {
    buildingState.buildingRating = Math.max(
        TIMING_BALANCE.MIN_RATING,
        Math.min(TIMING_BALANCE.MAX_RATING, buildingState.buildingRating + delta)
    );
    if (sessionState.ratingText) {
        const tier = getReputationTier();
        sessionState.ratingText.setText(`⭐ ${buildingState.buildingRating.toFixed(1)} / 5.0\n${tier.label}`).setColor(tier.color);
    }
    saveGameData();
}

