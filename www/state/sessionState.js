// Session, Audio, Operator, Combos, Missions, Events & Modals State

export const sessionState = {
    isAudioMuted: false,

    // Operator
    operatorTimeLeft: 0,
    isOperatorActive: false,

    // Investor Boost
    investorBoostTimeRemaining: 0,

    // Service Combo
    serviceCombo: 0,
    isComboPaused: false,

    // Controlled Random Events
    activeRandomEvent: null,
    randomEventTimeRemaining: 0,

    // Missions
    activeMissions: [],
    consecutiveNoWalkout: 0,

    // Offline Earnings Pending Cache
    offlinePendingEarnings: null,

    // UI & Modal Containers
    missionsModalContainer: null,
    hqModalContainer: null,
    breakdownModalContainer: null,
    adModalContainer: null,
    offlineModalContainer: null,
    devEventsModalContainer: null,
    eventBannerContainer: null,
    eventBannerText: null,

    // HUD element references
    coinText: null,
    tipText: null,
    ratingText: null,
    operatorStatusText: null,
    serviceComboText: null,
    soundToggleBtn: null,
    objectiveBannerText: null,
    investorBoostText: null,
    capBtnObj: null,
    speedBtnObj: null,
    floorButtonContainers: {}
};
