// Daily Building Cycle — Phase Configuration
// All durations are in seconds.
// Change DEV_MODE_DURATIONS to false to use PRODUCTION_DURATIONS.

export const DAY_PHASES = [
    {
        id: 'MORNING',
        label: 'Morning',
        emoji: '🌅',
        // placeholder multipliers (not yet applied — reserved for Rush Hour Phase 2)
        trafficMultiplier: 1.0,
        devDuration: 60,
        prodDuration: 480  // 8 minutes
    },
    {
        id: 'MORNING_RUSH',
        label: 'Morning Rush',
        emoji: '☕',
        trafficMultiplier: 1.0,   // Phase 2 will set this to e.g. 1.5
        devDuration: 60,
        prodDuration: 300  // 5 minutes
    },
    {
        id: 'MIDDAY',
        label: 'Midday',
        emoji: '🌞',
        trafficMultiplier: 1.0,
        devDuration: 60,
        prodDuration: 600  // 10 minutes
    },
    {
        id: 'LUNCH_RUSH',
        label: 'Lunch Rush',
        emoji: '🍱',
        trafficMultiplier: 1.0,
        devDuration: 60,
        prodDuration: 300  // 5 minutes
    },
    {
        id: 'EVENING',
        label: 'Evening',
        emoji: '🌆',
        trafficMultiplier: 1.0,
        devDuration: 60,
        prodDuration: 480  // 8 minutes
    },
    {
        id: 'EVENING_RUSH',
        label: 'Evening Rush',
        emoji: '🌇',
        trafficMultiplier: 1.0,
        devDuration: 60,
        prodDuration: 300  // 5 minutes
    },
    {
        id: 'CLOSING',
        label: 'Closing',
        emoji: '🌙',
        trafficMultiplier: 1.0,
        devDuration: 30,
        prodDuration: 120  // 2 minutes
    }
];

// Set to true to use devDuration for all phases (fast testing).
// Set to false to use prodDuration for production gameplay.
export const DAY_USE_DEV_DURATIONS = true;

// Total phases in the day cycle
export const DAY_PHASE_COUNT = DAY_PHASES.length;
