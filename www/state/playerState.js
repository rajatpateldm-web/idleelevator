// Player Economy, Skyscraper Level, Prestige & Lifetime Stats State

export const playerState = {
    coins: 0,
    tips: 0,
    prestigeTokens: 0,
    skyscraperLevel: 1,
    totalPassengersServedLifetime: 0,
    totalCoinsEarnedLifetime: 0,
    specialPassengersTransported: 0,
    maxServiceComboLifetime: 0,
    currentElevatorModelIndex: 0,
    lastSavedTimestamp: 0
};

export function addCoins(amount) {
    playerState.coins += amount;
    playerState.totalCoinsEarnedLifetime += amount;
    return playerState.coins;
}

export function deductCoins(amount) {
    if (playerState.coins >= amount) {
        playerState.coins -= amount;
        return true;
    }
    return false;
}

export function addTips(amount) {
    playerState.tips += amount;
    return playerState.tips;
}

export function deductTips(amount) {
    if (playerState.tips >= amount) {
        playerState.tips -= amount;
        return true;
    }
    return false;
}
