// Demographic Archetypes, Special Passengers, Models, Missions, and Events Config

export const ARCHETYPES = [
    // Standard Archetypes
    { type: 'shopper', name: 'Shopper', isSpecial: false, speed: 1.0, patience: 18, tipChance: 0.4, skin: 0xffdbac, shirt: 0xe67e22, pants: 0x34495e, hair: 0xd35400, tagEmoji: '' },
    { type: 'student', name: 'Student', isSpecial: false, speed: 1.1, patience: 16, tipChance: 0.3, skin: 0xe0ac69, shirt: 0x27ae60, pants: 0x2c3e50, hair: 0x4a235a, tagEmoji: '' },
    { type: 'senior', name: 'Senior', isSpecial: false, speed: 0.7, patience: 22, tipChance: 0.6, skin: 0xf5deb3, shirt: 0x8e44ad, pants: 0x7f8c8d, hair: 0xbdc3c7, tagEmoji: '' },

    // 1. VIP (High tip chance, high reward, requires rating >= 3.0)
    { type: 'vip', name: 'VIP', isSpecial: true, rarity: 0.20, minRating: 3.0, speed: 1.3, patience: 14, tipChance: 0.95, coinMult: 2.5, ratingBonus: 0.08, skin: 0xffdbac, shirt: 0x16a085, pants: 0x0a3d62, hair: 0xf1c40f, badge: '⭐ VIP', badgeColor: '#f1c40f' },

    // 2. Celebrity (Very rare, large reward, large rating impact)
    { type: 'celebrity', name: 'Celebrity', isSpecial: true, rarity: 0.08, minRating: 3.5, speed: 1.2, patience: 12, tipChance: 1.0, coinMult: 4.0, ratingBonus: 0.20, skin: 0xf5deb3, shirt: 0xe91e63, pants: 0x2c3e50, hair: 0xf39c12, badge: '🎤 CELEBRITY', badgeColor: '#ec4899' },

    // 3. Executive (Speedy, high tip chance, requires decent rating)
    { type: 'exec', name: 'Executive', isSpecial: true, rarity: 0.22, minRating: 2.5, speed: 1.4, patience: 13, tipChance: 0.8, coinMult: 2.0, ratingBonus: 0.06, skin: 0xf1c27d, shirt: 0x2c3e50, pants: 0x1e272e, hair: 0x1a1a1a, badge: '💼 EXECUTIVE', badgeColor: '#38bdf8' },

    // 4. Investor (Can grant a temporary building income bonus multiplier)
    { type: 'investor', name: 'Investor', isSpecial: true, rarity: 0.12, minRating: 3.0, speed: 1.1, patience: 15, tipChance: 0.85, coinMult: 3.0, ratingBonus: 0.10, skin: 0xffdbac, shirt: 0x0f766e, pants: 0x1e293b, hair: 0x64748b, badge: '💎 INVESTOR', badgeColor: '#10b981', grantsInvestorBoost: true },

    // 5. Tourist (Random destination, longer dwell visit)
    { type: 'tourist', name: 'Tourist', isSpecial: true, rarity: 0.18, minRating: 1.0, speed: 0.85, patience: 20, tipChance: 0.6, coinMult: 1.8, dwellMultiplier: 1.6, ratingBonus: 0.05, skin: 0xfce7f3, shirt: 0xf97316, pants: 0x0284c7, hair: 0xa855f7, badge: '📸 TOURIST', badgeColor: '#fb923c' },

    // 6. Rusher (Very low patience, much higher reward if served before patience drops below 50%)
    { type: 'rusher', name: 'Rusher', isSpecial: true, rarity: 0.20, minRating: 1.0, speed: 1.7, patience: 7.5, tipChance: 0.75, coinMult: 3.5, ratingBonus: 0.07, skin: 0xffedd5, shirt: 0xef4444, pants: 0x18181b, hair: 0xd97706, badge: '⚡ RUSHER', badgeColor: '#ef4444', isRusher: true }
];

// Elevator Car Cosmetic Models
export const ELEVATOR_MODELS = [
    { id: 'standard', name: 'Standard Utility', minPrestige: 0, strokeColor: 0x388bfd, interiorColor: 0x2d333b, bonusTipPct: 0 },
    { id: 'glass_express', name: 'Glass Express', minPrestige: 1, strokeColor: 0x00d2d3, interiorColor: 0x1e3799, bonusTipPct: 0.15 },
    { id: 'executive_gold', name: 'Executive Gold', minPrestige: 2, strokeColor: 0xf1c40f, interiorColor: 0x3d3000, bonusTipPct: 0.35 },
    { id: 'quantum_lift', name: 'Quantum Penthouse', minPrestige: 3, strokeColor: 0xa855f7, interiorColor: 0x2e0854, bonusTipPct: 0.60 }
];

// 3-Slot Active Missions Templates
export const MISSION_TEMPLATES = [
    { type: 'passengers', desc: 'Transport 10 passengers', target: 10, rewardCoins: 75, rewardTips: 5 },
    { type: 'coins', desc: 'Earn 100 coins', target: 100, rewardCoins: 60, rewardTips: 3 },
    { type: 'tips', desc: 'Earn 5 tips', target: 5, rewardCoins: 80, rewardTips: 6 },
    { type: 'no_walkout', desc: 'Serve 5 passengers without walkout', target: 5, rewardCoins: 90, rewardTips: 8 },
    { type: 'rent', desc: 'Collect 3 rent payments', target: 3, rewardCoins: 70, rewardTips: 4 },
    { type: 'passengers_quick', desc: 'Transport 15 passengers', target: 15, rewardCoins: 110, rewardTips: 8 },
    { type: 'coins_burst', desc: 'Earn 250 coins', target: 250, rewardCoins: 140, rewardTips: 10 },
    { type: 'tips_vip', desc: 'Earn 8 tips', target: 8, rewardCoins: 120, rewardTips: 10 }
];

// Controlled Random Events Definitions
export const RANDOM_EVENTS = {
    shopping_rush: {
        id: 'shopping_rush',
        title: '🛍️ SHOPPING RUSH',
        desc: 'Spawning rate surged for 45s!',
        duration: 45,
        color: '#f39c12',
        badgeBg: 0x78350f,
        badgeBorder: 0xf59e0b
    },
    corporate_event: {
        id: 'corporate_event',
        title: '🏢 CORPORATE EVENT',
        desc: 'Office & Execs pay 2x for 60s!',
        duration: 60,
        color: '#38bdf8',
        badgeBg: 0x0c4a6e,
        badgeBorder: 0x38bdf8
    },
    celebrity_visit: {
        id: 'celebrity_visit',
        title: '🎤 CELEBRITY VISIT',
        desc: 'A star has arrived in the lobby!',
        duration: 35,
        color: '#ec4899',
        badgeBg: 0x831843,
        badgeBorder: 0xf472b6
    },
    power_surge: {
        id: 'power_surge',
        title: '⚡ POWER SURGE',
        desc: 'Lift moving 30% slower for 30s',
        duration: 30,
        color: '#facc15',
        badgeBg: 0x713f12,
        badgeBorder: 0xeab308
    },
    happy_hour: {
        id: 'happy_hour',
        title: '🍹 HAPPY HOUR',
        desc: 'Tips +50% & higher chance for 45s!',
        duration: 45,
        color: '#a855f7',
        badgeBg: 0x581c87,
        badgeBorder: 0xc084fc
    }
};
