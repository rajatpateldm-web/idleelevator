// Data-driven Tenant Tier Profiles Configuration
// Defines tier-based modifiers that layer on top of BUSINESS_TYPES.

export const TENANT_TIER_PROFILES = {
    Standard: {
        tier: 'Standard',
        label: 'Standard Tenant',
        trafficRateMultiplier: 1.15,
        patienceMultiplier: 1.15, // Patient / Forgiving
        fareMultiplier: 1.00,
        tipMultiplier: 1.00,
        archetypeWeightModifier: { shopper: 1.3, student: 1.2, senior: 1.2 }
    },
    Premium: {
        tier: 'Premium',
        label: 'Premium Tenant',
        trafficRateMultiplier: 1.00,
        patienceMultiplier: 1.00, // Baseline patience
        fareMultiplier: 1.25,
        tipMultiplier: 1.25,
        archetypeWeightModifier: { exec: 1.3, tourist: 1.2 }
    },
    VIP: {
        tier: 'VIP',
        label: 'VIP Tenant',
        trafficRateMultiplier: 0.85,
        patienceMultiplier: 0.82, // Higher expectation / lower patience
        fareMultiplier: 1.55,
        tipMultiplier: 1.60,
        archetypeWeightModifier: { vip: 1.4, exec: 1.3, rusher: 1.2 }
    },
    Luxury: {
        tier: 'Luxury',
        label: 'Luxury / Elite Tenant',
        trafficRateMultiplier: 0.70,
        patienceMultiplier: 0.68, // Highest expectation / lowest patience
        fareMultiplier: 1.95,
        tipMultiplier: 2.10,
        archetypeWeightModifier: { vip: 1.6, celebrity: 1.5, investor: 1.5 }
    },
    Ground: {
        tier: 'Ground',
        label: 'Ground Kiosk',
        trafficRateMultiplier: 1.00,
        patienceMultiplier: 1.00,
        fareMultiplier: 1.00,
        tipMultiplier: 1.00,
        archetypeWeightModifier: {}
    }
};

export function getTenantTierProfile(tierKey) {
    if (!tierKey) return TENANT_TIER_PROFILES.Standard;
    const k = String(tierKey).toUpperCase();
    if (k.includes('LUXURY') || k.includes('ELITE')) return TENANT_TIER_PROFILES.Luxury;
    if (k.includes('VIP')) return TENANT_TIER_PROFILES.VIP;
    if (k.includes('PREMIUM')) return TENANT_TIER_PROFILES.Premium;
    if (k.includes('GROUND')) return TENANT_TIER_PROFILES.Ground;
    return TENANT_TIER_PROFILES.Standard;
}
