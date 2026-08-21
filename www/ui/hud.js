// Fixed HUD Header, Sub-Banners, and Mission Progress UI
import { playerState } from '../state/playerState.js';
import { buildingState } from '../state/buildingState.js';
import { sessionState } from '../state/sessionState.js';
import { ECONOMY_BALANCE } from '../config/economy.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from './floatingText.js';
import { saveGameData, initDefaultMissions, registerHUDUpdater as registerSaveHUD, registerMissionProgressUpdater } from '../save/saveManager.js';
import { openMissionsModal, openHQManagementModal, openDevEventsModal, registerHUDUpdater as registerModalHUD } from './modals.js';
import { createBottomUpgradePanel, registerHUDUpdater as registerUpgradeHUD } from './upgradePanel.js';
import { createDevButton, registerDevHUDUpdater } from './devPanel.js';
import { registerHUDUpdater as registerStairsHUD, registerModifyRating } from '../world/stairs.js';
import { registerHUDUpdater as registerBuildingHUD } from '../world/building.js';
import { registerHUDUpdater as registerShopHUD, registerMissionProgress as registerShopMission } from '../systems/shopSystem.js';
import { registerHUDUpdater as registerPassengerHUD, registerMissionProgress as registerPassengerMission } from '../systems/passengerSystem.js';
import { registerHUDUpdater as registerAdHUD } from '../ads/adManager.js';
import { modifyBuildingRating, getReputationTier } from '../systems/ratingSystem.js';

export function getMissionBannerString() {
    initDefaultMissions();
    const readyCount = sessionState.activeMissions.filter(m => m.completed && !m.claimed).length;
    if (readyCount > 0) {
        return `🎁 ${readyCount} Mission${readyCount > 1 ? 's' : ''} Ready to Claim! (Tap to View)`;
    }
    const firstActive = sessionState.activeMissions.find(m => !m.completed);
    if (firstActive) {
        return `📜 Mission: ${firstActive.desc} [${firstActive.progress}/${firstActive.target}] (+${firstActive.rewardCoins}💰)`;
    }
    return `📜 Missions: 3 Active Slots (Tap to View)`;
}

export function updateHUD() {
    if (sessionState.coinText) sessionState.coinText.setText(`💰 ${playerState.coins}`);
    if (sessionState.tipText) sessionState.tipText.setText(`💎 ${playerState.tips}`);
    if (sessionState.ratingText) {
        const tier = getReputationTier();
        sessionState.ratingText.setText(`⭐ ${buildingState.buildingRating.toFixed(1)} / 5.0\n${tier.label}`).setColor(tier.color);
    }
    if (sessionState.objectiveBannerText) sessionState.objectiveBannerText.setText(getMissionBannerString());

    if (sessionState.serviceComboText) {
        if (sessionState.serviceCombo >= 1) {
            const coinPct = Math.min(
                Math.round(ECONOMY_BALANCE.MAX_COMBO_COIN_BONUS * 100),
                Math.round(sessionState.serviceCombo * ECONOMY_BALANCE.COMBO_COIN_BONUS_PER_LEVEL * 100)
            );
            const tipPct = Math.min(
                Math.round(ECONOMY_BALANCE.MAX_COMBO_TIP_BONUS * 100),
                Math.round(sessionState.serviceCombo * ECONOMY_BALANCE.COMBO_TIP_BONUS_PER_LEVEL * 100)
            );
            const icon = sessionState.serviceCombo >= 10 ? '⚡' : (sessionState.serviceCombo >= 5 ? '🔥' : '✨');
            sessionState.serviceComboText.setText(`${icon} COMBO x${sessionState.serviceCombo}\n+${coinPct}% 💰 | +${tipPct}% 💎`).setVisible(true);
            sessionState.serviceComboText.setColor(sessionState.serviceCombo >= 10 ? '#c084fc' : (sessionState.serviceCombo >= 5 ? '#f87171' : '#fbbf24'));
        } else {
            sessionState.serviceComboText.setVisible(false);
        }
    }
}

export function updateMissionProgress(scene, eventType, amount = 1) {
    let changed = false;

    sessionState.activeMissions.forEach((m) => {
        if (!m.completed && !m.claimed) {
            if (m.type === eventType) {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    playSound('tip');
                    showFloatingText(scene, 180, 110, `🎯 Mission Ready: ${m.desc}!`, '#2ecc71');
                }
                changed = true;
            } else if (m.type === 'passengers_quick' && eventType === 'passengers') {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    playSound('tip');
                    showFloatingText(scene, 180, 110, `🎯 Mission Ready: ${m.desc}!`, '#2ecc71');
                }
                changed = true;
            } else if (m.type === 'coins_burst' && eventType === 'coins') {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    playSound('tip');
                    showFloatingText(scene, 180, 110, `🎯 Mission Ready: ${m.desc}!`, '#2ecc71');
                }
                changed = true;
            } else if (m.type === 'tips_vip' && eventType === 'tips') {
                m.progress += amount;
                if (m.progress >= m.target) {
                    m.progress = m.target;
                    m.completed = true;
                    playSound('tip');
                    showFloatingText(scene, 180, 110, `🎯 Mission Ready: ${m.desc}!`, '#2ecc71');
                }
                changed = true;
            }
        }
    });

    if (changed) {
        if (sessionState.objectiveBannerText) sessionState.objectiveBannerText.setText(getMissionBannerString());
        saveGameData();
    }
}

import { createCrispText, responsiveFontSize, getTouchBounds } from '../config/uiConfig.js';

export function createPinnedHUD(scene) {
    // 1. Pinned Background Top Bar
    const topBar = scene.add.rectangle(180, 36, 344, 52, 0x161b22, 0.95).setDepth(100).setScrollFactor(0);
    topBar.setStrokeStyle(1.5, 0x30363d);

    // 2. Economy Stats
    sessionState.coinText = createCrispText(scene, 14, 20, `💰 ${playerState.coins}`, {
        category: 'PRIMARY',
        fontSize: 14,
        color: '#ffdf5d',
        fontStyle: 'bold',
        depth: 101,
        scrollFactor: 0
    });

    sessionState.tipText = createCrispText(scene, 14, 40, `💎 ${playerState.tips}`, {
        category: 'SECONDARY_LABEL',
        fontSize: 12,
        color: '#58a6ff',
        fontStyle: 'bold',
        depth: 101,
        scrollFactor: 0
    });

    // 3. Skyscraper Rating & Reputation Tier
    const initTier = getReputationTier();
    sessionState.ratingText = createCrispText(scene, 120, 20, `⭐ ${buildingState.buildingRating.toFixed(1)} / 5.0\n${initTier.label}`, {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: initTier.color,
        fontStyle: 'bold',
        align: 'left',
        depth: 101,
        scrollFactor: 0
    });

    // 4. Service Combo Multiplier Text
    sessionState.serviceComboText = createCrispText(scene, 185, 20, '', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#ff9f43',
        fontStyle: 'bold',
        align: 'left',
        depth: 101,
        scrollFactor: 0
    });
    sessionState.serviceComboText.setVisible(false);

    // 5. Action Buttons (Missions, HQ, Audio, Dev)
    const missionsBtn = scene.add.rectangle(242, 36, 44, 40, 0x238636, 0.9).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });
    missionsBtn.setStrokeStyle(1.2, 0x2ea043);
    createCrispText(scene, 242, 36, '📋\nTASKS', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5,
        depth: 102,
        scrollFactor: 0
    });
    missionsBtn.on('pointerdown', () => {
        playSound('click');
        openMissionsModal(scene);
    });

    // HQ Button
    const hqBtn = scene.add.rectangle(292, 36, 50, 40, 0x1f6feb, 0.9).setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });
    hqBtn.setStrokeStyle(1.2, 0x58a6ff);
    createCrispText(scene, 292, 36, `🏢\nLv.${playerState.skyscraperLevel}`, {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5,
        depth: 102,
        scrollFactor: 0
    });
    hqBtn.on('pointerdown', () => {
        playSound('click');
        openHQManagementModal(scene);
    });

    // Sound Toggle Button with minimum 40x40 touch hit target
    const soundTouchBounds = getTouchBounds(24, 24, 40);
    const soundContainer = scene.add.container(338, 36).setDepth(102).setScrollFactor(0);
    const soundBg = scene.add.rectangle(0, 0, soundTouchBounds.hitWidth, soundTouchBounds.hitHeight, 0x000000, 0.001)
        .setInteractive(soundTouchBounds.hitArea, Phaser.Geom.Rectangle.Contains, { useHandCursor: true });

    sessionState.soundToggleBtn = createCrispText(scene, 0, 0, sessionState.isAudioMuted ? '🔇' : '🔊', {
        fontSize: 18,
        origin: 0.5
    });

    soundContainer.add([soundBg, sessionState.soundToggleBtn]);

    soundBg.on('pointerdown', () => {
        sessionState.isAudioMuted = !sessionState.isAudioMuted;
        sessionState.soundToggleBtn.setText(sessionState.isAudioMuted ? '🔇' : '🔊');
        if (!sessionState.isAudioMuted) playSound('click');
        saveGameData();
    });

    // Mission / Goals Banner (Pinned sub-header)
    const objBg = scene.add.rectangle(180, 74, 344, 22, 0x0f172a, 0.95).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });
    objBg.setStrokeStyle(1, 0x14b8a6);
    sessionState.objectiveBannerText = createCrispText(scene, 180, 74, getMissionBannerString(), {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#5eead4',
        fontStyle: 'bold',
        origin: 0.5,
        depth: 101,
        scrollFactor: 0
    });

    objBg.on('pointerdown', () => {
        playSound('click');
        openMissionsModal(scene);
    });

    // Active Random Event Pinned Banner
    const eventBannerBg = scene.add.rectangle(180, 98, 344, 20, 0x18181b, 0.95).setScrollFactor(0);
    eventBannerBg.setStrokeStyle(1.2, 0xf59e0b);
    sessionState.eventBannerText = createCrispText(scene, 180, 98, '', {
        category: 'SECONDARY_LABEL',
        fontSize: 10.5,
        color: '#facc15',
        fontStyle: 'bold',
        origin: 0.5,
        scrollFactor: 0
    });
    sessionState.eventBannerContainer = scene.add.container(0, 0, [eventBannerBg, sessionState.eventBannerText]).setDepth(120).setVisible(false);

    // Development Mode Badge Button (Isolated)
    createDevButton(scene);

    createBottomUpgradePanel(scene);
}

// Wire up HUD updater callbacks across all modules
registerSaveHUD(updateHUD);
registerModalHUD(updateHUD);
registerUpgradeHUD(updateHUD);
registerDevHUDUpdater(updateHUD);
registerStairsHUD(updateHUD);
registerBuildingHUD(updateHUD);
registerShopHUD(updateHUD);
registerPassengerHUD(updateHUD);
registerAdHUD(updateHUD);

// Wire up Mission progress callbacks
registerMissionProgressUpdater(updateMissionProgress);
registerShopMission(updateMissionProgress);
registerPassengerMission(updateMissionProgress);

// Wire up Rating modification from stairs walkout
registerModifyRating(modifyBuildingRating);
