// Business Type Definitions
// All business behaviour lives here as data. Read from BUSINESS_TYPES.
export const BUSINESS_TYPES = {
    // CAFE – High footfall, low individual reward, boosts building happiness
    CAFE: {
        id: 'CAFE',
        label: '☕ Café',
        color: '#f39c12',
        visitorFrequency: 1.6,      // multiplier on global spawn weight for this floor
        dwellMin: 5000,
        dwellMax: 8000,
        passengerPool: ['shopper', 'student', 'senior'],  // types biased toward here
        coinMultiplier: 0.8,        // slightly below average ride reward
        tipMultiplier: 0.9,
        rentMultiplier: 0.7,        // lower rent – kept busy by volume
        ratingImpact: 0.01,         // positive per satisfied visitor
        attractsSpecials: false,
        desc: '☕ High footfall · Low fare · Happy vibes'
    },

    // SHOPPING – High footfall, medium reward, attracts diverse crowd
    SHOPPING: {
        id: 'SHOPPING',
        label: '🛍️ Shopping',
        color: '#e67e22',
        visitorFrequency: 1.4,
        dwellMin: 6000,
        dwellMax: 10000,
        passengerPool: ['shopper', 'tourist'],
        coinMultiplier: 1.0,
        tipMultiplier: 1.0,
        rentMultiplier: 1.0,
        ratingImpact: 0.01,
        attractsSpecials: false,
        desc: '🛍️ Busy floor · Mixed crowd · Medium reward'
    },

    // OFFICE – Medium footfall, reliable higher rent, attracts executives
    OFFICE: {
        id: 'OFFICE',
        label: '🏢 Office',
        color: '#2980b9',
        visitorFrequency: 0.9,
        dwellMin: 9000,
        dwellMax: 14000,
        passengerPool: ['exec', 'investor'],
        coinMultiplier: 1.4,
        tipMultiplier: 1.3,
        rentMultiplier: 1.5,
        ratingImpact: 0.01,
        attractsSpecials: true,     // can attract exec/investor special passengers
        desc: '🏢 Steady demand · High rent · Suit crowd'
    },

    // GYM – Low footfall, long visits, steady rating improvement
    GYM: {
        id: 'GYM',
        label: '🏋️ Gym',
        color: '#27ae60',
        visitorFrequency: 0.6,
        dwellMin: 14000,
        dwellMax: 22000,
        passengerPool: ['shopper', 'student', 'rusher'],
        coinMultiplier: 1.1,
        tipMultiplier: 1.1,
        rentMultiplier: 1.2,
        ratingImpact: 0.02,         // best rating-per-visit of any type
        attractsSpecials: false,
        desc: '🏋️ Long visits · Low traffic · Builds rating'
    },

    // ENTERTAINMENT – Variable footfall, higher tips, attracts celebrities
    ENTERTAINMENT: {
        id: 'ENTERTAINMENT',
        label: '🎭 Entertainment',
        color: '#8e44ad',
        visitorFrequency: 1.2,
        dwellMin: 7000,
        dwellMax: 13000,
        passengerPool: ['tourist', 'celebrity', 'shopper'],
        coinMultiplier: 1.2,
        tipMultiplier: 1.8,         // best tips
        rentMultiplier: 1.3,
        ratingImpact: 0.02,
        attractsSpecials: true,     // biased toward celebrity/tourist
        desc: '🎭 Variable traffic · High tips · Star power'
    },

    // LUXURY – Rare visitors, very high value, VIP & celebrity magnet
    LUXURY: {
        id: 'LUXURY',
        label: '💎 Luxury',
        color: '#f1c40f',
        visitorFrequency: 0.45,
        dwellMin: 10000,
        dwellMax: 18000,
        passengerPool: ['vip', 'celebrity', 'investor'],
        coinMultiplier: 2.2,
        tipMultiplier: 2.5,         // highest tip ceiling
        rentMultiplier: 2.0,
        ratingImpact: 0.02,
        attractsSpecials: true,     // strongly biased toward VIP/celebrity/investor
        desc: '💎 Rare visits · Premium reward · Elite guests'
    }
};
