// Google AdMob & Browser Fallback Ad Manager
import { OPERATOR_BALANCE } from '../config/operator.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { sessionState } from '../state/sessionState.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from '../ui/floatingText.js';
import { saveGameData, collectOfflineEarnings } from '../save/saveManager.js';

const REWARDED_AD_ID = 'ca-app-pub-7809965112838039/5774818818';

let onCompleteRepairCallback = null;
export function registerCompleteRepair(fn) {
    onCompleteRepairCallback = fn;
}

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

let onSpawnPassengerCallback = null;
export function registerSpawnPassenger(fn) {
    onSpawnPassengerCallback = fn;
}

let onHideBreakdownModalCallback = null;
export function registerHideBreakdownModal(fn) {
    onHideBreakdownModalCallback = fn;
}

let onHideAdModalCallback = null;
export function registerHideAdModal(fn) {
    onHideAdModalCallback = fn;
}

export async function initAdMob() {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            await AdMob.initialize();
        } catch (err) {
            console.error('AdMob Init Error', err);
        }
    }
}

export async function showRewardedAdForBoost(scene) {
    playSound('click');
    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            showFloatingText(scene, 180, elevY, 'Loading Video...', '#f1c40f');
            const options = {
                adId: REWARDED_AD_ID,
                isTesting: false
            };
            await AdMob.prepareRewardVideoAd(options);
            await AdMob.showRewardVideoAd();

            sessionState.operatorTimeLeft += OPERATOR_BALANCE.BOOST_DURATION_SEC;
            sessionState.isOperatorActive = true;
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            playSound('tip');
            showFloatingText(scene, 180, elevY, `+${OPERATOR_BALANCE.BOOST_DURATION_SEC}s Operator Boost!`, '#2ecc71');
        } catch (error) {
            console.error('Ad failed to play:', error);
            showFloatingText(scene, 180, elevY, 'Ad Unavailable', '#e74c3c');
        }
    } else {
        sessionState.operatorTimeLeft += OPERATOR_BALANCE.BOOST_DURATION_SEC;
        sessionState.isOperatorActive = true;
        if (onHUDUpdateCallback) onHUDUpdateCallback();
        saveGameData();
        playSound('tip');
        showFloatingText(scene, 180, elevY, `Browser: +${OPERATOR_BALANCE.BOOST_DURATION_SEC}s Boost!`, '#2ecc71');
    }
}

export async function showRewardedAdForInstantRepair(scene) {
    playSound('click');
    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            showFloatingText(scene, 180, elevY - 40, 'Loading Ad...', '#f1c40f');
            const options = {
                adId: REWARDED_AD_ID,
                isTesting: false
            };
            await AdMob.prepareRewardVideoAd(options);
            await AdMob.showRewardVideoAd();

            if (onHideBreakdownModalCallback) onHideBreakdownModalCallback();
            if (onCompleteRepairCallback) onCompleteRepairCallback(scene);
            playSound('ding');
            showFloatingText(scene, 145, elevY - 40, '⚡ Fast Fix Complete!', '#2ecc71');
        } catch (error) {
            console.error('Ad repair error', error);
            showFloatingText(scene, 180, elevY - 40, 'Ad Unavailable', '#e74c3c');
        }
    } else {
        if (onHideBreakdownModalCallback) onHideBreakdownModalCallback();
        if (onCompleteRepairCallback) onCompleteRepairCallback(scene);
        playSound('ding');
        showFloatingText(scene, 145, elevY - 40, 'Browser: Instant Fix!', '#2ecc71');
    }
}

export async function showRewardedAdForPRRatingBoost(scene) {
    playSound('click');
    const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            showFloatingText(scene, 180, elevY, 'Loading PR Video...', '#f1c40f');
            const options = {
                adId: REWARDED_AD_ID,
                isTesting: false
            };
            await AdMob.prepareRewardVideoAd(options);
            await AdMob.showRewardVideoAd();

            buildingState.buildingRating = TIMING_BALANCE.MAX_RATING;
            if (sessionState.ratingText) sessionState.ratingText.setText(`⭐ ${TIMING_BALANCE.MAX_RATING.toFixed(1)} / ${TIMING_BALANCE.MAX_RATING.toFixed(1)}`);
            saveGameData();
            if (onHideAdModalCallback) onHideAdModalCallback();
            playSound('tip');
            showFloatingText(scene, 180, elevY, `🌟 Rating Restored to ${TIMING_BALANCE.MAX_RATING.toFixed(1)} ⭐`, '#2ecc71');
            if (onSpawnPassengerCallback) onSpawnPassengerCallback(scene);
        } catch (error) {
            console.error('Ad PR error', error);
            showFloatingText(scene, 180, elevY, 'Ad Unavailable', '#e74c3c');
        }
    } else {
        buildingState.buildingRating = TIMING_BALANCE.MAX_RATING;
        if (sessionState.ratingText) sessionState.ratingText.setText(`⭐ ${TIMING_BALANCE.MAX_RATING.toFixed(1)} / ${TIMING_BALANCE.MAX_RATING.toFixed(1)}`);
        saveGameData();
        if (onHideAdModalCallback) onHideAdModalCallback();
        playSound('tip');
        showFloatingText(scene, 180, elevY, `Browser: Rating Reset to ${TIMING_BALANCE.MAX_RATING.toFixed(1)} ⭐`, '#2ecc71');
        if (onSpawnPassengerCallback) onSpawnPassengerCallback(scene);
    }
}

export async function claim2xOfflineAdReward(scene) {
    playSound('click');
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            showFloatingText(scene, 180, 110, 'Loading 2X Reward Ad...', '#f1c40f');
            const options = {
                adId: REWARDED_AD_ID,
                isTesting: false
            };
            await AdMob.prepareRewardVideoAd(options);
            await AdMob.showRewardVideoAd();

            collectOfflineEarnings(scene, 2);
        } catch (error) {
            console.error('Ad error', error);
            collectOfflineEarnings(scene, 2);
        }
    } else {
        collectOfflineEarnings(scene, 2);
    }
}
