// Building Floors, Rating, and Shops State

export const buildingState = {
    unlockedFloors: [0, 1, 2],
    buildingRating: 3.5,
    shops: {
        1: { name: 'BOUTIQUE CAFE', desc: '☕ Coffee & Pastry', tier: 'Standard', rent: 2, active: true, contractTime: 300, gracePeriod: 60, businessType: 'CAFE', uiContainer: null, timerText: null },
        2: { name: 'TECH CORP HQ', desc: '🏢 Suite 201', tier: 'Premium', rent: 6, active: true, contractTime: 450, gracePeriod: 60, businessType: 'OFFICE', uiContainer: null, timerText: null },
        3: { name: 'FITNESS ARENA', desc: '🏋️ Luxury Gym', tier: 'Luxury', rent: 12, active: false, contractTime: 0, gracePeriod: 60, businessType: 'GYM', uiContainer: null, timerText: null },
        4: { name: 'SKYLINE FINANCIAL', desc: '💎 Penthouse Fund', tier: 'VIP', rent: 25, active: false, contractTime: 0, gracePeriod: 60, businessType: 'LUXURY', uiContainer: null, timerText: null },
        5: { name: 'STARLIGHT ASTRONOMY', desc: '🔭 Panoramic Lounge', tier: 'VIP', rent: 45, active: false, contractTime: 0, gracePeriod: 60, businessType: 'LUXURY', uiContainer: null, timerText: null }
    },
    lockedFloorUI: {}
};
