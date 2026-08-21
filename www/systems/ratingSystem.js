// Building Reputation Rating System
import { TIMING_BALANCE } from '../config/timing.js';
import { buildingState } from '../state/buildingState.js';
import { sessionState } from '../state/sessionState.js';
import { saveGameData } from '../save/saveManager.js';

export function modifyBuildingRating(scene, delta) {
    buildingState.buildingRating = Math.max(
        TIMING_BALANCE.MIN_RATING,
        Math.min(TIMING_BALANCE.MAX_RATING, buildingState.buildingRating + delta)
    );
    if (sessionState.ratingText) {
        sessionState.ratingText.setText(`⭐ ${buildingState.buildingRating.toFixed(1)} / ${TIMING_BALANCE.MAX_RATING.toFixed(1)}`);
    }
    saveGameData();
}

