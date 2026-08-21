// Reputation Debt System
// Tracks temporary elevator-service pressure separately from the building rating.
//
// Pipeline:
//   Walkout → immediate rating penalty (unchanged) + Reputation Debt +1
//   Sustained good service → gradual decay
//   High debt → lower premium tenant offer probability + vacancy risk on premium contracts
//
// Debt does NOT affect passenger patience (no runaway loop).
// Debt does NOT replace or modify the buildingRating star system.

import { buildingState } from '../state/buildingState.js';
import { isDevModeActive } from '../config/devConfig.js';

// ─── Configuration ───────────────────────────────────────────────────────────
// All thresholds are centralised here so tuning never touches system logic.

export const REPUTATION_DEBT_CONFIG = {
    // Bounds
    MIN_DEBT: 0,
    MAX_DEBT: 10,

    // How many consecutive successful deliveries are required before 1 unit decays.
    // Higher = slower recovery. Avoids fast reset after a few good trips.
    DECAY_SUCCESS_THRESHOLD: 8,

    // Offer availability multipliers by debt bracket.
    // Applied to the probability that a Premium/VIP/Luxury advertising tier is shown.
    OFFER_PENALTY_TABLE: [
        { maxDebt: 2,  mult: 1.00 },  // 0–2:   no penalty
        { maxDebt: 4,  mult: 0.90 },  // 3–4:   slight reduction
        { maxDebt: 6,  mult: 0.75 },  // 5–6:   moderate reduction
        { maxDebt: 8,  mult: 0.55 },  // 7–8:   significant reduction
        { maxDebt: 10, mult: 0.35 },  // 9–10:  severe reduction
    ],

    // Tenant sensitivity by tier – governs early-cancellation vacancy risk.
    // Higher value = tenant checks debt more aggressively.
    VACANCY_SENSITIVITY: {
        Standard: 0.0,   // immune
        Premium:  0.02,  // 2% additional risk per debt point above threshold
        VIP:      0.04,  // 4% additional risk per debt point above threshold
        Luxury:   0.05,  // 5% additional risk per debt point above threshold
    },

    // Debt level at which vacancy risk starts applying (inclusive).
    VACANCY_RISK_DEBT_THRESHOLD: 6,
};

// ─── Internal counter for decay gating ───────────────────────────────────────
// Persisted on buildingState so save/load keeps it, but not exported directly.
// Accessed via helpers below.
function _getSuccessCount() {
    return buildingState._debtDecaySuccessCounter || 0;
}
function _setSuccessCount(n) {
    buildingState._debtDecaySuccessCounter = Math.max(0, n);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Called on every walkout.
 * Increments Reputation Debt by `amount`, clamped to MAX_DEBT.
 * Also resets the decay counter so sustained bad service doesn't accidentally
 * trigger recovery at the same time.
 * @param {number} amount
 */
export function addReputationDebt(amount = 1) {
    const prev = buildingState.reputationDebt;
    buildingState.reputationDebt = Math.min(
        REPUTATION_DEBT_CONFIG.MAX_DEBT,
        buildingState.reputationDebt + amount
    );
    _setSuccessCount(0); // reset decay progress on new walkout

    if (isDevModeActive()) {
        console.log(`[REPUTATION DEBT] Walkout → debt ${prev} → ${buildingState.reputationDebt} (+${amount}), decay counter reset`);
    }
}

/**
 * Called after each successful passenger completion.
 * Increments an internal counter; only actually decays debt once the counter
 * reaches DECAY_SUCCESS_THRESHOLD. This prevents fast recovery.
 */
export function tickDebtDecay() {
    if (buildingState.reputationDebt <= REPUTATION_DEBT_CONFIG.MIN_DEBT) {
        _setSuccessCount(0);
        return;
    }

    const next = _getSuccessCount() + 1;
    if (next >= REPUTATION_DEBT_CONFIG.DECAY_SUCCESS_THRESHOLD) {
        const prev = buildingState.reputationDebt;
        buildingState.reputationDebt = Math.max(
            REPUTATION_DEBT_CONFIG.MIN_DEBT,
            buildingState.reputationDebt - 1
        );
        _setSuccessCount(0);
        if (isDevModeActive()) {
            console.log(`[REPUTATION DEBT] Recovery → debt ${prev} → ${buildingState.reputationDebt} (after ${REPUTATION_DEBT_CONFIG.DECAY_SUCCESS_THRESHOLD} successes)`);
        }
    } else {
        _setSuccessCount(next);
        if (isDevModeActive()) {
            console.log(`[REPUTATION DEBT] Good service tick ${next}/${REPUTATION_DEBT_CONFIG.DECAY_SUCCESS_THRESHOLD} — debt stays at ${buildingState.reputationDebt}`);
        }
    }
}

/**
 * Direct decay (for future event-based recovery grants).
 * @param {number} amount
 */
export function decayReputationDebt(amount = 1) {
    const prev = buildingState.reputationDebt;
    buildingState.reputationDebt = Math.max(
        REPUTATION_DEBT_CONFIG.MIN_DEBT,
        buildingState.reputationDebt - amount
    );
    if (isDevModeActive()) {
        console.log(`[REPUTATION DEBT] Direct decay → debt ${prev} → ${buildingState.reputationDebt} (-${amount})`);
    }
}

/**
 * Returns current debt level (0–10).
 * @returns {number}
 */
export function getReputationDebt() {
    return buildingState.reputationDebt;
}

/**
 * Returns computed impact multipliers for the current debt level.
 *
 * offerPenaltyMult  – multiply against premium offer availability probability
 * vacancyRiskFn     – function(tier) returning extra vacancy risk fraction per rent tick
 *
 * @returns {{ offerPenaltyMult: number, vacancyRiskFn: function(string): number }}
 */
export function getReputationDebtImpact() {
    const debt = buildingState.reputationDebt;

    // Offer penalty
    let offerPenaltyMult = 1.0;
    for (const entry of REPUTATION_DEBT_CONFIG.OFFER_PENALTY_TABLE) {
        if (debt <= entry.maxDebt) {
            offerPenaltyMult = entry.mult;
            break;
        }
    }

    // Vacancy risk – only activates above threshold
    const vacancyRiskFn = (tier) => {
        if (debt < REPUTATION_DEBT_CONFIG.VACANCY_RISK_DEBT_THRESHOLD) return 0;
        const sensitivity = REPUTATION_DEBT_CONFIG.VACANCY_SENSITIVITY[tier] || 0;
        const excessDebt = debt - REPUTATION_DEBT_CONFIG.VACANCY_RISK_DEBT_THRESHOLD;
        return sensitivity * excessDebt;
    };

    if (isDevModeActive()) {
        console.log(`[REPUTATION DEBT] Impact — debt: ${debt}, offerMult: ${offerPenaltyMult.toFixed(2)}, vacancyRisk(VIP): ${vacancyRiskFn('VIP').toFixed(3)}, vacancyRisk(Premium): ${vacancyRiskFn('Premium').toFixed(3)}`);
    }

    return { offerPenaltyMult, vacancyRiskFn };
}
