// Economy Calculations, Fares & Multipliers System
import { ELEVATOR_MODELS } from '../config/passengers.js';
import { ECONOMY_BALANCE } from '../config/economy.js';
import { buildingState } from '../state/buildingState.js';
import { playerState } from '../state/playerState.js';
import { sessionState } from '../state/sessionState.js';
import { getBusinessTypeForFloor } from './shopSystem.js';
import { getReputationTier } from './ratingSystem.js';
import { getTenantTierProfile } from '../config/tenants.js';
import { getEffectiveDemandModifiers } from './demandSystem.js';

export function calculatePassengerFare(passenger) {
    const archetype = passenger.archetype;
    const isHappy = passenger.patience > (passenger.maxPatience * 0.4);

    let comboMultiplier = 1.0;
    if (isHappy) {
        sessionState.serviceCombo++;
        if (sessionState.serviceCombo > playerState.maxServiceComboLifetime) {
            playerState.maxServiceComboLifetime = sessionState.serviceCombo;
        }
        comboMultiplier = 1 + Math.min(
            ECONOMY_BALANCE.MAX_COMBO_COIN_BONUS,
            sessionState.serviceCombo * ECONOMY_BALANCE.COMBO_COIN_BONUS_PER_LEVEL
        );
    }

    const floorMultiplier = Math.max(1, passenger.currentFloor || 1);
    const prestigeBonus = 1 + (playerState.prestigeTokens * ECONOMY_BALANCE.PRESTIGE_MULTIPLIER_PER_TOKEN);
    const investorBonus = sessionState.investorBoostTimeRemaining > 0 ? ECONOMY_BALANCE.INVESTOR_SURGE_MULTIPLIER : 1.0;
    const curModel = (ELEVATOR_MODELS[playerState.currentElevatorModelIndex] && playerState.prestigeTokens >= ELEVATOR_MODELS[playerState.currentElevatorModelIndex].minPrestige)
        ? ELEVATOR_MODELS[playerState.currentElevatorModelIndex]
        : ELEVATOR_MODELS[0];
    const modelTipMultiplier = 1 + (curModel.bonusTipPct || 0);

    const archCoinMult = archetype.coinMult || 1.0;
    const corpEventBonus = (sessionState.activeRandomEvent && sessionState.activeRandomEvent.id === 'corporate_event' && (archetype.type === 'exec' || passenger.currentFloor >= 2))
        ? ECONOMY_BALANCE.CORPORATE_EVENT_MULTIPLIER
        : 1.0;

    const visitedFloor = passenger.lastVisitedFloor || 0;
    const businessType = getBusinessTypeForFloor(visitedFloor);
    const demand = visitedFloor > 0 ? getEffectiveDemandModifiers(visitedFloor) : null;
    const tenantFareMult = demand ? demand.fareMultiplier : 1.0;
    const tenantTipMult = demand ? demand.tipMultiplier : 1.0;
    const businessCoinMult = businessType ? businessType.coinMultiplier : 1.0;
    const businessTipMult = businessType ? businessType.tipMultiplier : 1.0;
    const repTier = getReputationTier();
    const repIncomeMult = repTier ? repTier.incomeMult : 1.0;
    const repTipMult = repTier ? repTier.tipMult : 1.0;

    const baseCoins = ECONOMY_BALANCE.BASE_FARE + (floorMultiplier >= ECONOMY_BALANCE.HIGH_FLOOR_BONUS_START ? floorMultiplier * ECONOMY_BALANCE.HIGH_FLOOR_BONUS_MULTIPLIER : 0);
    let earnedCoins = Math.round(baseCoins * archCoinMult * businessCoinMult * tenantFareMult * prestigeBonus * investorBonus * comboMultiplier * corpEventBonus * repIncomeMult);

    if (archetype.isRusher && passenger.patience > (passenger.maxPatience * ECONOMY_BALANCE.RUSHER_PATIENCE_THRESHOLD_PCT)) {
        earnedCoins = Math.round(earnedCoins * ECONOMY_BALANCE.RUSHER_SPEED_BONUS_MULTIPLIER);
    }

    let earnedTips = 0;
    const comboTipBonus = Math.min(
        ECONOMY_BALANCE.MAX_COMBO_TIP_BONUS,
        sessionState.serviceCombo * ECONOMY_BALANCE.COMBO_TIP_BONUS_PER_LEVEL
    );
    const isHappyHour = (sessionState.activeRandomEvent && sessionState.activeRandomEvent.id === 'happy_hour');
    const happyHourTipChanceBonus = isHappyHour ? ECONOMY_BALANCE.HAPPY_HOUR_TIP_CHANCE_BONUS : 0.0;
    const happyHourTipMult = isHappyHour ? ECONOMY_BALANCE.HAPPY_HOUR_TIP_MULTIPLIER : 1.0;

    const effectiveTipChance = Math.min(1.0, archetype.tipChance + comboTipBonus + happyHourTipChanceBonus);

    if (isHappy && Math.random() < effectiveTipChance) {
        let rawTips = 1;
        const tipRange = ECONOMY_BALANCE.TIP_RANGES[archetype.type] || ECONOMY_BALANCE.TIP_RANGES.standard;
        rawTips = (typeof Phaser !== 'undefined' && Phaser.Math && Phaser.Math.Between)
            ? Phaser.Math.Between(tipRange.min, tipRange.max)
            : Math.floor(Math.random() * (tipRange.max - tipRange.min + 1)) + tipRange.min;
        earnedTips = Math.round(rawTips * businessTipMult * tenantTipMult * prestigeBonus * modelTipMultiplier * investorBonus * happyHourTipMult * repTipMult);
    }

    const archetypeRating = archetype.ratingBonus || 0.05;
    const businessRatingImpact = businessType ? businessType.ratingImpact : 0;
    const ratingDelta = archetypeRating + businessRatingImpact;

    return {
        isHappy,
        earnedCoins,
        earnedTips,
        ratingDelta
    };
}

