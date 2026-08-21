// Scalable Skyscraper Floor Architecture (Ground through Floor 5)
export const FLOOR_DEFINITIONS = {
    0: {
        floor: 0,
        name: 'LOBBY & CONCOURSE',
        theme: 'Ground',
        unlockCost: 0,
        y: 820,
        defaultTenant: { name: 'LOBBY KIOSK', desc: '☕ Snacks & Coffee', rent: 0, tier: 'Ground' },
        advertisingTiers: {}
    },
    1: {
        floor: 1,
        name: 'SHOPPING ARCADE',
        theme: 'Retail',
        unlockCost: 0,
        y: 660,
        defaultTenant: { name: 'BOUTIQUE CAFE', desc: '☕ Coffee & Pastry', rent: 2, tier: 'Standard', contractTime: 300, gracePeriod: 60, businessType: 'CAFE' },
        advertisingTiers: {
            Standard: { name: 'CORNER BAKERY', desc: '🥐 Fresh Goods', rent: 2, cost: 20, duration: 300, businessType: 'CAFE' },
            Premium: { name: 'ARTISAN ESPRESSO', desc: '☕ Gourmet Drinks', rent: 6, cost: 50, duration: 450, businessType: 'CAFE' }
        }
    },
    2: {
        floor: 2,
        name: 'OFFICE SUITES',
        theme: 'Business',
        unlockCost: 0,
        y: 500,
        defaultTenant: { name: 'TECH CORP HQ', desc: '🏢 Suite 201', rent: 6, tier: 'Premium', contractTime: 450, gracePeriod: 60, businessType: 'OFFICE' },
        advertisingTiers: {
            Standard: { name: 'CONSULTING STUDIO', desc: '💼 Legal Services', rent: 2, cost: 20, duration: 300, businessType: 'OFFICE' },
            Premium: { name: 'SAAS HEADQUARTERS', desc: '💻 Cloud Solutions', rent: 6, cost: 50, duration: 450, businessType: 'OFFICE' }
        }
    },
    3: {
        floor: 3,
        name: 'WELLNESS & ATHLETICS',
        theme: 'Fitness',
        unlockCost: 800,
        y: 340,
        defaultTenant: { name: 'FITNESS ARENA', desc: '🏋️ Luxury Gym', rent: 12, tier: 'Luxury', contractTime: 0, gracePeriod: 60, businessType: 'GYM' },
        advertisingTiers: {
            Standard: { name: 'FITNESS ARENA', desc: '🏋️ Luxury Gym', rent: 10, cost: 60, duration: 300, businessType: 'GYM' },
            Premium: { name: 'VIP CYBER LOUNGE', desc: '🎮 High-Tech Arcade', rent: 16, cost: 150, duration: 450, businessType: 'ENTERTAINMENT' }
        }
    },
    4: {
        floor: 4,
        name: 'PENTHOUSE COMMERCE',
        theme: 'Executive',
        unlockCost: 2000,
        y: 180,
        defaultTenant: { name: 'SKYLINE FINANCIAL', desc: '💎 Penthouse Fund', rent: 25, tier: 'VIP', contractTime: 0, gracePeriod: 60, businessType: 'LUXURY' },
        advertisingTiers: {
            Standard: { name: 'PENTHOUSE SUITE', desc: '🍸 Rooftop Club', rent: 20, cost: 60, duration: 300, businessType: 'ENTERTAINMENT' },
            Premium: { name: 'SKYLINE FINANCIAL', desc: '💎 Hedge Fund HQ', rent: 35, cost: 150, duration: 450, businessType: 'LUXURY' }
        }
    },
    5: {
        floor: 5,
        name: 'SKYLINE OBSERVATORY & ROOFTOP',
        theme: 'Skyline',
        unlockCost: 4500,
        y: 20,
        defaultTenant: { name: 'STARLIGHT ASTRONOMY', desc: '🔭 Panoramic Lounge', rent: 45, tier: 'VIP', contractTime: 0, gracePeriod: 60, businessType: 'LUXURY' },
        advertisingTiers: {
            Standard: { name: 'STARLIGHT LOUNGE', desc: '🔭 Sky Observatory', rent: 35, cost: 120, duration: 300, businessType: 'ENTERTAINMENT' },
            Premium: { name: 'ORBITAL VENTURES', desc: '🚀 Aerospace Lab', rent: 60, cost: 300, duration: 450, businessType: 'LUXURY' }
        }
    }
};

export const FLOOR_UNLOCK_COSTS = {
    3: 800,
    4: 2000,
    5: 4500
};

// Floor coordinate lookups
export const floorY = {
    0: FLOOR_DEFINITIONS[0].y,
    1: FLOOR_DEFINITIONS[1].y,
    2: FLOOR_DEFINITIONS[2].y,
    3: FLOOR_DEFINITIONS[3].y,
    4: FLOOR_DEFINITIONS[4].y,
    5: FLOOR_DEFINITIONS[5].y
};
