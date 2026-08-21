// Economy, Fares, Multipliers, Tip Ranges & Offline Earnings Balance Configuration

export const ECONOMY_BALANCE = {
    // Ride Base Fares & Kiosk
    BASE_FARE: 5,
    HIGH_FLOOR_BONUS_START: 3,
    HIGH_FLOOR_BONUS_MULTIPLIER: 2,
    KIOSK_COINS: 2,
    KIOSK_DWELL_MS: 4000,
    KIOSK_RATING_DELTA: 0.04,

    // Progression Multipliers
    PRESTIGE_MULTIPLIER_PER_TOKEN: 0.2,
    INVESTOR_SURGE_MULTIPLIER: 1.5,
    INVESTOR_SURGE_DURATION_SEC: 30,
    INVESTOR_SURGE_MAX_DURATION_SEC: 60,

    // Service Combos
    COMBO_COIN_BONUS_PER_LEVEL: 0.04,
    MAX_COMBO_COIN_BONUS: 0.40,
    COMBO_TIP_BONUS_PER_LEVEL: 0.02,
    MAX_COMBO_TIP_BONUS: 0.20,
    COMBO_SPECIAL_SPAWN_BONUS_PER_LEVEL: 0.02,
    MAX_COMBO_SPECIAL_SPAWN_BONUS: 0.20,
    BASE_SPECIAL_SPAWN_CHANCE: 0.35,

    // Special Archetype Bonuses
    RUSHER_SPEED_BONUS_MULTIPLIER: 1.5,
    RUSHER_PATIENCE_THRESHOLD_PCT: 0.5,

    // Random Event Modifiers
    HAPPY_HOUR_TIP_CHANCE_BONUS: 0.25,
    HAPPY_HOUR_TIP_MULTIPLIER: 1.5,
    CORPORATE_EVENT_MULTIPLIER: 2.0,
    POWER_SURGE_SPEED_SLOWDOWN: 1.30,

    // Tip Amount Ranges
    TIP_RANGES: {
        celebrity: { min: 8, max: 15 },
        vip: { min: 4, max: 8 },
        investor: { min: 4, max: 8 },
        exec: { min: 2, max: 5 },
        rusher: { min: 2, max: 5 },
        standard: { min: 1, max: 2 }
    },

    // Offline Idle Calculations
    OFFLINE: {
        MIN_SECONDS: 45,
        MAX_SECONDS: 8 * 3600,       // 8 Hours
        RENT_EFFICIENCY: 0.60,       // 60% offline rent efficiency
        AVG_BASE_FARE: 7,
        TIP_RATE_FACTOR: 0.05
    }
};
