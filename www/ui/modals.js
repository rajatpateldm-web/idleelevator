// Modal Dialogs & Overlay Controllers
import { BUSINESS_TYPES } from '../config/businesses.js';
import { FLOOR_DEFINITIONS } from '../config/floors.js';
import { ARCHETYPES, ELEVATOR_MODELS, MISSION_TEMPLATES, RANDOM_EVENTS } from '../config/passengers.js';
import { CAPACITY_VALUES, SPEED_VALUES } from '../config/upgrades.js';
import { BREAKDOWN_BALANCE } from '../config/breakdown.js';
import { TIMING_BALANCE } from '../config/timing.js';
import { buildingState } from '../state/buildingState.js';
import { elevatorState } from '../state/elevatorState.js';
import { playerState } from '../state/playerState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from './floatingText.js';
import { saveGameData, createMissionInstance, initDefaultMissions, collectOfflineEarnings, registerOfflineModalOpener } from '../save/saveManager.js';
import { showRewardedAdForInstantRepair, showRewardedAdForPRRatingBoost, claim2xOfflineAdReward, registerHideBreakdownModal, registerHideAdModal } from '../ads/adManager.js';
import { getReputationDebtImpact } from '../systems/reputationSystem.js';
import { updateElevatorCarSkin } from '../entities/elevator.js';
import { renderFloorStructure, registerOpenAdvertisingModal } from '../world/building.js';
import { createFloorButtons, registerOpenBreakdownModal as registerFloorButtonBreakdown } from './floorButtons.js';
import { updateUpgradeCards } from './upgradePanel.js';
import { startStandardRepair, registerOpenBreakdownModal as registerBreakdownSystemModal } from '../systems/breakdownSystem.js';
import { signTenantContract } from '../systems/shopSystem.js';
import { spawnCelebrityPassenger } from '../systems/passengerSystem.js';

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

import { createCrispText, getTouchBounds } from '../config/uiConfig.js';

// ─── 1. Missions Modal ───────────────────────────────────────────────

export function openMissionsModal(scene) {
    if (sessionState.missionsModalContainer) sessionState.missionsModalContainer.destroy();
    initDefaultMissions();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.8).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 324, 430, 0x111827).setStrokeStyle(2, 0x14b8a6);

    const title = createCrispText(scene, 180, centerY - 185, '📜 ACTIVE MISSIONS', {
        category: 'PRIMARY',
        fontSize: 15,
        color: '#5eead4',
        fontStyle: 'bold',
        origin: 0.5
    });

    const subTitle = createCrispText(scene, 180, centerY - 165, 'Complete real elevator operations to earn instant rewards!', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#94a3b8',
        origin: 0.5
    });

    const missionElements = [];

    sessionState.activeMissions.forEach((m, index) => {
        const itemY = centerY - 105 + (index * 95);
        const cardBg = scene.add.rectangle(180, itemY, 296, 84, 0x1f2937).setStrokeStyle(1.2, m.completed ? 0x10b981 : 0x374151);

        const mTitle = createCrispText(scene, 42, itemY - 30, `${index + 1}. ${m.desc}`, {
            category: 'BODY_MODAL',
            fontSize: 12,
            color: '#f8fafc',
            fontStyle: 'bold'
        });

        const mProgressText = createCrispText(scene, 42, itemY - 12, `Progress: ${m.progress} / ${m.target}`, {
            category: 'SECONDARY_LABEL',
            fontSize: 11,
            color: '#cbd5e1'
        });

        const barBg = scene.add.rectangle(110, itemY + 6, 136, 8, 0x111827).setStrokeStyle(1, 0x4b5563);
        const pct = Math.min(1.0, m.progress / m.target);
        const barFill = scene.add.rectangle(42, itemY + 6, 136 * pct, 8, m.completed ? 0x10b981 : 0x0ea5e9).setOrigin(0, 0.5);

        const rewardLabel = createCrispText(scene, 42, itemY + 22, `Reward: +${m.rewardCoins} 💰 +${m.rewardTips || 0} 💎`, {
            category: 'SECONDARY_LABEL',
            fontSize: 11,
            color: '#facc15',
            fontStyle: 'bold'
        });

        const isReadyToClaim = m.completed && !m.claimed;
        const claimBtn = scene.add.rectangle(264, itemY + 6, 68, 40, isReadyToClaim ? 0x059669 : 0x374151).setInteractive({ useHandCursor: isReadyToClaim }).setStrokeStyle(1, isReadyToClaim ? 0x34d399 : 0x4b5563);
        const claimText = createCrispText(scene, 264, itemY + 6, isReadyToClaim ? 'CLAIM' : 'ACTIVE', {
            category: 'PRIMARY_BUTTON',
            fontSize: 12,
            color: isReadyToClaim ? '#ffffff' : '#9ca3af',
            fontStyle: 'bold',
            origin: 0.5
        });

        if (isReadyToClaim) {
            claimBtn.on('pointerdown', () => {
                claimMissionReward(scene, index);
            });
        }

        missionElements.push(cardBg, mTitle, mProgressText, barBg, barFill, rewardLabel, claimBtn, claimText);
    });

    const closeBtn = createCrispText(scene, 180, centerY + 185, '[ CLOSE MISSIONS ]', {
        category: 'PRIMARY_BUTTON',
        fontSize: 13,
        color: '#ef4444',
        fontStyle: 'bold',
        origin: 0.5
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
        playSound('click');
        hideMissionsModal();
    });

    sessionState.missionsModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, title, subTitle, ...missionElements, closeBtn
    ]).setDepth(200);
}

export function hideMissionsModal() {
    if (sessionState.missionsModalContainer) {
        sessionState.missionsModalContainer.destroy();
        sessionState.missionsModalContainer = null;
    }
}

export function claimMissionReward(scene, index) {
    const mission = sessionState.activeMissions[index];
    if (!mission || !mission.completed || mission.claimed) return;

    mission.claimed = true;
    playerState.coins += mission.rewardCoins;
    playerState.tips += (mission.rewardTips || 0);
    playerState.totalCoinsEarnedLifetime += mission.rewardCoins;

    playSound('coin');
    showFloatingText(scene, 180, 110, `🎉 Claimed: +${mission.rewardCoins} 💰 +${mission.rewardTips || 0} 💎!`, '#2ecc71');

    const nextTmplIdx = Math.floor(Math.random() * MISSION_TEMPLATES.length);
    sessionState.activeMissions[index] = createMissionInstance(nextTmplIdx);

    saveGameData();
    if (onHUDUpdateCallback) onHUDUpdateCallback();

    if (sessionState.missionsModalContainer) {
        openMissionsModal(scene);
    }
}

// ─── 2. HQ & Skyscraper Management Modal ──────────────────────────────

export function openHQManagementModal(scene) {
    if (sessionState.hqModalContainer) sessionState.hqModalContainer.destroy();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.8).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 320, 430, 0x161b22).setStrokeStyle(2, 0x58a6ff);

    const title = createCrispText(scene, 180, centerY - 185, `🏢 SKYSCRAPER MANAGEMENT`, {
        category: 'PRIMARY',
        fontSize: 15,
        color: '#58a6ff',
        fontStyle: 'bold',
        origin: 0.5
    });

    const subTitle = createCrispText(scene, 180, centerY - 165, `Building Tier: Level ${playerState.skyscraperLevel} | Tokens: 🏆 ${playerState.prestigeTokens}`, {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#f39c12',
        origin: 0.5
    });

    const statsBox = scene.add.rectangle(180, centerY - 75, 290, 84, 0x0d1117).setStrokeStyle(1, 0x30363d);
    const statsHeader = createCrispText(scene, 180, centerY - 106, '📊 SKYSCRAPER VITAL STATS', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#8b949e',
        fontStyle: 'bold',
        origin: 0.5
    });

    const stat1 = createCrispText(scene, 42, centerY - 92, `• Total Served: ${playerState.totalPassengersServedLifetime} (⭐ ${playerState.specialPassengersTransported} Specials)`, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: '#c9d1d9'
    });

    const stat2 = createCrispText(scene, 42, centerY - 77, `• Best Service Streak: 🔥 x${playerState.maxServiceComboLifetime} Combo | Rating: ⭐ ${buildingState.buildingRating.toFixed(1)}`, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: '#c9d1d9'
    });

    const stat3 = createCrispText(scene, 42, centerY - 62, `• Elevator Capacity: ${elevatorState.elevatorCapacity} | Speed: ${elevatorState.moveDuration}ms`, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: '#c9d1d9'
    });

    const stat4 = createCrispText(scene, 42, centerY - 47, `• Multipliers: ${sessionState.investorBoostTimeRemaining > 0 ? '⚡ 1.5x Surge' : '1.0x Normal'} ${sessionState.serviceCombo >= 2 ? `| 🔥 +${Math.min(40, sessionState.serviceCombo * 4)}% Combo` : ''}`, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: '#10b981',
        fontStyle: 'bold'
    });

    const curModel = ELEVATOR_MODELS[playerState.currentElevatorModelIndex] || ELEVATOR_MODELS[0];
    const elevatorBox = scene.add.rectangle(180, centerY + 5, 290, 50, 0x1a2332).setStrokeStyle(1, 0x388bfd);
    const elevHeader = createCrispText(scene, 180, centerY - 12, `🛗 LIFT MODEL: ${curModel.name} (+${Math.round(curModel.bonusTipPct * 100)}% Tips)`, {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#58a6ff',
        fontStyle: 'bold',
        origin: 0.5
    });

    const prevModelBtn = createCrispText(scene, 45, centerY + 9, '◀ PREV', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#facc15',
        fontStyle: 'bold',
        origin: [0, 0.5]
    }).setInteractive({ useHandCursor: true });

    const nextModelBtn = createCrispText(scene, 315, centerY + 9, 'NEXT ▶', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#facc15',
        fontStyle: 'bold',
        origin: [1, 0.5]
    }).setInteractive({ useHandCursor: true });

    const modelStatus = createCrispText(scene, 180, centerY + 9, playerState.prestigeTokens >= curModel.minPrestige ? '✅ ACTIVE' : `🔒 Needs 🏆${curModel.minPrestige} Tokens`, {
        category: 'SECONDARY_LABEL',
        fontSize: 10.5,
        color: playerState.prestigeTokens >= curModel.minPrestige ? '#2ecc71' : '#e74c3c',
        fontStyle: 'bold',
        origin: 0.5
    });

    prevModelBtn.on('pointerdown', () => {
        playSound('click');
        playerState.currentElevatorModelIndex = (playerState.currentElevatorModelIndex - 1 + ELEVATOR_MODELS.length) % ELEVATOR_MODELS.length;
        updateElevatorCarSkin();
        saveGameData();
        openHQManagementModal(scene);
    });

    nextModelBtn.on('pointerdown', () => {
        playSound('click');
        playerState.currentElevatorModelIndex = (playerState.currentElevatorModelIndex + 1) % ELEVATOR_MODELS.length;
        updateElevatorCarSkin();
        saveGameData();
        openHQManagementModal(scene);
    });

    const tokenReward = Math.max(1, (buildingState.unlockedFloors.length - 2) + Math.floor(elevatorState.capacityLevel / 2) + Math.floor(elevatorState.speedLevel / 2));
    const canPrestige = buildingState.unlockedFloors.length >= 5 || elevatorState.capacityLevel >= 4;
    const prestigeBg = scene.add.rectangle(180, centerY + 85, 290, 78, canPrestige ? 0x2e1065 : 0x181e26).setStrokeStyle(1.5, canPrestige ? 0xa855f7 : 0x3b4457);
    const prestigeTitle = createCrispText(scene, 180, centerY + 53, '🏗️ REDEVELOP BUILDING (PRESTIGE)', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: canPrestige ? '#c084fc' : '#94a3b8',
        fontStyle: 'bold',
        origin: 0.5
    });

    const prestigeDesc = createCrispText(scene, 180, centerY + 73, canPrestige
        ? `Receive: 🏆 +${tokenReward} Management Tokens\n(+${tokenReward * 5}% Speed/Rent, +${tokenReward * 3}% Tips)`
        : 'Requirement: Floor 5 Unlocked or Capacity Lv. 4+', {
        category: 'BODY_MODAL',
        fontSize: 10,
        color: canPrestige ? '#f1c40f' : '#cbd5e1',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    const prestigeBtn = scene.add.rectangle(180, centerY + 105, 180, 24, canPrestige ? 0x7e22ce : 0x334155).setInteractive({ useHandCursor: canPrestige }).setStrokeStyle(1, 0xffffff, 0.4);
    const prestigeBtnText = createCrispText(scene, 180, centerY + 105, canPrestige ? `[ REDEVELOP (🏆 +${tokenReward}) ]` : '🔒 REDEVELOP LOCKED', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        fontStyle: 'bold',
        origin: 0.5
    });

    if (canPrestige) {
        prestigeBtn.on('pointerdown', () => {
            playSound('build');
            executeSkyscraperPrestige(scene, tokenReward);
            hideHQModal();
        });
    }

    const closeBtn = createCrispText(scene, 180, centerY + 175, '[ CLOSE MANAGEMENT ]', {
        category: 'PRIMARY_BUTTON',
        fontSize: 13,
        color: '#e74c3c',
        fontStyle: 'bold',
        origin: 0.5
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
        playSound('click');
        hideHQModal();
    });

    sessionState.hqModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, title, subTitle,
        statsBox, statsHeader, stat1, stat2, stat3, stat4,
        elevatorBox, elevHeader, prevModelBtn, nextModelBtn, modelStatus,
        prestigeBg, prestigeTitle, prestigeDesc, prestigeBtn, prestigeBtnText,
        closeBtn
    ]).setDepth(200);
}

export function hideHQModal() {
    if (sessionState.hqModalContainer) {
        sessionState.hqModalContainer.destroy();
        sessionState.hqModalContainer = null;
    }
}

export function executeSkyscraperPrestige(scene, tokensEarned = 1) {
    playerState.skyscraperLevel++;
    playerState.prestigeTokens += tokensEarned;
    playerState.coins = 150 * playerState.prestigeTokens;
    playerState.tips = 15 * playerState.prestigeTokens;
    buildingState.unlockedFloors = [0, 1, 2];
    elevatorState.capacityLevel = 1;
    elevatorState.speedLevel = 1;
    elevatorState.elevatorCapacity = CAPACITY_VALUES[0];
    elevatorState.moveDuration = SPEED_VALUES[0];
    buildingState.buildingRating = 4.0;

    Object.keys(buildingState.shops).forEach(f => {
        const floorNum = parseInt(f, 10);
        if (floorNum === 1) {
            buildingState.shops[1].active = true;
            buildingState.shops[1].contractTime = 300;
        } else if (floorNum === 2) {
            buildingState.shops[2].active = true;
            buildingState.shops[2].contractTime = 450;
        } else {
            buildingState.shops[floorNum].active = false;
            buildingState.shops[floorNum].contractTime = 0;
        }
    });

    if (onHUDUpdateCallback) onHUDUpdateCallback();
    updateUpgradeCards();
    saveGameData();

    if (scene && scene.add) {
        playSound('ding');
        const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
        showFloatingText(scene, 180, elevY, `🏆 Redeveloped! +${tokensEarned} Management Tokens (Total: ${playerState.prestigeTokens})`, '#a855f7');
        createFloorButtons(scene);
        Object.keys(FLOOR_DEFINITIONS).map(Number).filter(f => f > 0).forEach(f => {
            renderFloorStructure(scene, f);
        });
    }
}

// ─── 3. Breakdown Modal ───────────────────────────────────────────────

export function openBreakdownModal(scene) {
    if (sessionState.breakdownModalContainer) sessionState.breakdownModalContainer.destroy();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.7).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 290, 190, 0x202633).setStrokeStyle(2, 0xe74c3c);

    const header = createCrispText(scene, 180, centerY - 65, '⚠️ LIFT MALFUNCTION', {
        category: 'PRIMARY',
        fontSize: 15,
        color: '#ff4757',
        fontStyle: 'bold',
        origin: 0.5
    });

    const desc = createCrispText(scene, 180, centerY - 40, 'Lift reached wear limit!\nFix now before ratings crash!', {
        category: 'BODY_MODAL',
        fontSize: 12,
        color: '#cbd5e1',
        align: 'center',
        origin: 0.5
    });

    const coinRepairBtn = scene.add.rectangle(125, centerY + 30, 110, 44, 0x27ae60).setInteractive({ useHandCursor: true }).setStrokeStyle(1.2, 0xffffff, 0.3);
    const coinRepairText = createCrispText(scene, 125, centerY + 30, `🔧 STANDARD\n${BREAKDOWN_BALANCE.STANDARD_REPAIR_COST} 💰 (${BREAKDOWN_BALANCE.STANDARD_REPAIR_DURATION_SEC}s)`, {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    coinRepairBtn.on('pointerdown', () => {
        playSound('click');
        if (playerState.coins >= BREAKDOWN_BALANCE.STANDARD_REPAIR_COST) {
            playerState.coins -= BREAKDOWN_BALANCE.STANDARD_REPAIR_COST;
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            hideBreakdownModal();
            startStandardRepair(scene);
        } else {
            showFloatingText(scene, 125, centerY + 65, `Need ${BREAKDOWN_BALANCE.STANDARD_REPAIR_COST} 💰!`, '#e74c3c');
        }
    });

    const adRepairBtn = scene.add.rectangle(235, centerY + 30, 95, 44, 0xd35400).setInteractive({ useHandCursor: true }).setStrokeStyle(1.2, 0xffffff, 0.3);
    const adRepairText = createCrispText(scene, 235, centerY + 30, '⚡ FAST FIX\nWatch Ad (0s)', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    adRepairBtn.on('pointerdown', () => {
        showRewardedAdForInstantRepair(scene);
    });

    sessionState.breakdownModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, header, desc, coinRepairBtn, coinRepairText, adRepairBtn, adRepairText
    ]).setDepth(200);
}

export function hideBreakdownModal() {
    if (sessionState.breakdownModalContainer) {
        sessionState.breakdownModalContainer.destroy();
        sessionState.breakdownModalContainer = null;
    }
}

// ─── 4. Advertising & Leasing Modal ────────────────────────────────────

export function openAdvertisingModal(scene, floor) {
    if (sessionState.adModalContainer) sessionState.adModalContainer.destroy();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const floorDef = FLOOR_DEFINITIONS[floor] || FLOOR_DEFINITIONS[1];
    const stdTier = (floorDef.advertisingTiers && floorDef.advertisingTiers.Standard) || { name: 'Standard Tenant', rent: 2, cost: 20, duration: 300 };
    const premTier = (floorDef.advertisingTiers && floorDef.advertisingTiers.Premium) || { name: 'Premium Tenant', rent: 6, cost: 50, duration: 450 };

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.75).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 310, 275, 0x202633).setStrokeStyle(2, 0x388bfd);

    const header = createCrispText(scene, 180, centerY - 115, `📢 LEASE FLOOR ${floor}: ${floorDef.name}`, {
        category: 'PRIMARY',
        fontSize: 14,
        color: '#58a6ff',
        fontStyle: 'bold',
        origin: 0.5
    });

    const desc = createCrispText(scene, 180, centerY - 95, `Rating: ⭐ ${buildingState.buildingRating.toFixed(1)} / 5.0`, {
        category: 'SECONDARY_LABEL',
        fontSize: 11.5,
        color: '#f39c12',
        fontStyle: 'bold',
        origin: 0.5
    });

    const opt1BT = stdTier.businessType ? BUSINESS_TYPES[stdTier.businessType] : null;
    const opt1BTLabel = opt1BT ? ` ${opt1BT.label}` : '';
    const opt1Cost = stdTier.cost;
    const opt1Rent = stdTier.rent;
    const opt1Bg = scene.add.rectangle(180, centerY - 55, 270, 44, 0x238636).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xffffff, 0.3);
    const opt1Line2 = opt1BT ? opt1BT.desc : `${stdTier.name} (+${opt1Rent} 💰/6s, 5m)`;
    const opt1Text = createCrispText(scene, 180, centerY - 55, `📰 LOCAL FLYERS (${opt1Cost} 💰) —${opt1BTLabel}\n${opt1Line2}`, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: 260 },
        origin: 0.5
    });

    opt1Bg.on('pointerdown', () => {
        playSound('click');
        if (playerState.coins >= opt1Cost) {
            playerState.coins -= opt1Cost;
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            signTenantContract(scene, floor, 'Standard');
            hideAdModal();
        } else {
            showFloatingText(scene, 180, centerY - 55, `Need ${opt1Cost} 💰!`, '#e74c3c');
        }
    });

    const isEligibleForPremium = buildingState.buildingRating >= TIMING_BALANCE.PREMIUM_CAMPAIGN_MIN_RATING;
    // Reputation Debt: apply offer availability multiplier as a stochastic gate.
    // Debt 0-2: always available. Debt 9-10: only 35% chance of showing as available.
    const { offerPenaltyMult } = getReputationDebtImpact();
    const isPremiumAvailableThisOpen = isEligibleForPremium && (Math.random() < offerPenaltyMult);
    const opt2BT = premTier.businessType ? BUSINESS_TYPES[premTier.businessType] : null;
    const opt2BTLabel = opt2BT ? ` ${opt2BT.label}` : '';
    const opt2Cost = premTier.cost;
    const opt2Rent = premTier.rent;
    const opt2Bg = scene.add.rectangle(180, centerY - 5, 270, 44, isPremiumAvailableThisOpen ? 0x8957e5 : 0x484f58).setInteractive({ useHandCursor: isPremiumAvailableThisOpen }).setStrokeStyle(1, 0xffffff, 0.3);
    const opt2Line2 = opt2BT ? opt2BT.desc : `${premTier.name} (+${opt2Rent} 💰/6s, 7.5m)`;
    let opt2Label;
    if (!isEligibleForPremium) {
        opt2Label = `🔒 DIGITAL CAMPAIGN (Needs ${TIMING_BALANCE.PREMIUM_CAMPAIGN_MIN_RATING}+ ⭐)\nRestore Rating to Unlock`;
    } else if (!isPremiumAvailableThisOpen) {
        opt2Label = `⚠️ DIGITAL CAMPAIGN (Unavailable)\nReputation Debt: Service quality too low`;
    } else {
        opt2Label = `📱 DIGITAL CAMPAIGN (${opt2Cost} 💰) —${opt2BTLabel}\n${opt2Line2}`;
    }
    const opt2Text = createCrispText(scene, 180, centerY - 5, opt2Label, {
        category: 'BODY_MODAL',
        fontSize: 10.5,
        color: isPremiumAvailableThisOpen ? '#ffffff' : '#a0aec0',
        align: 'center',
        fontStyle: 'bold',
        wordWrap: { width: 260 },
        origin: 0.5
    });

    if (isPremiumAvailableThisOpen) {
        opt2Bg.on('pointerdown', () => {
            playSound('click');
            if (playerState.coins >= opt2Cost) {
                playerState.coins -= opt2Cost;
                if (onHUDUpdateCallback) onHUDUpdateCallback();
                signTenantContract(scene, floor, 'Premium');
                hideAdModal();
            } else {
                showFloatingText(scene, 180, centerY - 5, `Need ${opt2Cost} 💰!`, '#e74c3c');
            }
        });
    }

    const prAdBg = scene.add.rectangle(180, centerY + 45, 270, 40, 0xd35400).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xffffff, 0.3);
    const prAdText = createCrispText(scene, 180, centerY + 45, '🌟 PR STUNT (Watch Ad)\nReset Rating to 5.0 ⭐ + VIP Crowd', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    prAdBg.on('pointerdown', () => {
        showRewardedAdForPRRatingBoost(scene);
    });

    const closeBtn = createCrispText(scene, 180, centerY + 102, '[ CLOSE ]', {
        category: 'PRIMARY_BUTTON',
        fontSize: 12,
        color: '#e74c3c',
        fontStyle: 'bold',
        origin: 0.5
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
        playSound('click');
        hideAdModal();
    });

    sessionState.adModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, header, desc, opt1Bg, opt1Text, opt2Bg, opt2Text, prAdBg, prAdText, closeBtn
    ]).setDepth(200);
}

export function hideAdModal() {
    if (sessionState.adModalContainer) {
        sessionState.adModalContainer.destroy();
        sessionState.adModalContainer = null;
    }
}

// ─── 5. Offline Earnings Modal ────────────────────────────────────────

export function openOfflineEarningsModal(scene, data) {
    if (sessionState.offlineModalContainer) sessionState.offlineModalContainer.destroy();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.85).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 320, 430, 0x161b22).setStrokeStyle(2, 0x388bfd);

    const title = createCrispText(scene, 180, centerY - 175, '🏢 WELCOME BACK!', {
        category: 'PRIMARY',
        fontSize: 15,
        color: '#58a6ff',
        fontStyle: 'bold',
        origin: 0.5
    });

    const subTitle = createCrispText(scene, 180, centerY - 152, 'Your skyscraper kept operating while you were away.', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#8b949e',
        origin: 0.5
    });

    const cardBg = scene.add.rectangle(180, centerY - 60, 280, 130, 0x0d1117).setStrokeStyle(1.2, 0x30363d);
    const timeText = createCrispText(scene, 180, centerY - 110, `⏱️ Away for: ${data.timeStr}`, {
        category: 'SECONDARY_LABEL',
        fontSize: 11.5,
        color: '#f39c12',
        fontStyle: 'bold',
        origin: 0.5
    });

    const stat1 = createCrispText(scene, 62, centerY - 82, `👥 ${data.passengers.toLocaleString()} passengers served`, {
        category: 'BODY_MODAL',
        fontSize: 11.5,
        color: '#c9d1d9',
        fontStyle: 'bold'
    });

    const stat2 = createCrispText(scene, 62, centerY - 58, `💰 +${data.coins.toLocaleString()} coins collected`, {
        category: 'BODY_MODAL',
        fontSize: 11.5,
        color: '#f1c40f',
        fontStyle: 'bold'
    });

    const stat3 = createCrispText(scene, 62, centerY - 34, `💎 +${data.tips} bonus tips received`, {
        category: 'BODY_MODAL',
        fontSize: 11.5,
        color: '#00d2d3',
        fontStyle: 'bold'
    });

    const collectBtn = scene.add.rectangle(180, centerY + 45, 270, 44, 0x238636).setStrokeStyle(1.2, 0x2ea043).setInteractive({ useHandCursor: true });
    const collectText = createCrispText(scene, 180, centerY + 45, `[ COLLECT ]\n+${data.coins.toLocaleString()} 💰  +${data.tips} 💎`, {
        category: 'PRIMARY_BUTTON',
        fontSize: 12,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    collectBtn.on('pointerdown', () => {
        collectOfflineEarnings(scene, 1);
    });

    const adBtn = scene.add.rectangle(180, centerY + 105, 270, 48, 0x8957e5).setStrokeStyle(1.2, 0xa371f7).setInteractive({ useHandCursor: true });
    const adText = createCrispText(scene, 180, centerY + 105, `🎬 [ 2X REWARD ] (Watch Ad)\n+${(data.coins * 2).toLocaleString()} 💰  +${data.tips * 2} 💎`, {
        category: 'PRIMARY_BUTTON',
        fontSize: 12,
        color: '#ffffff',
        align: 'center',
        fontStyle: 'bold',
        origin: 0.5
    });

    adBtn.on('pointerdown', () => {
        claim2xOfflineAdReward(scene);
    });

    sessionState.offlineModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, title, subTitle, cardBg, timeText, stat1, stat2, stat3, collectBtn, collectText, adBtn, adText
    ]).setDepth(250);
}

export function hideOfflineModal() {
    if (sessionState.offlineModalContainer) {
        sessionState.offlineModalContainer.destroy();
        sessionState.offlineModalContainer = null;
    }
}

// ─── 6. Random Events & Dev Testing Modal ──────────────────────────────

export function triggerRandomEvent(scene, eventId) {
    if (!scene || !RANDOM_EVENTS[eventId]) return;
    const evt = RANDOM_EVENTS[eventId];

    sessionState.activeRandomEvent = evt;
    sessionState.randomEventTimeRemaining = evt.duration;

    playSound('ding');
    showFloatingText(scene, 180, 110, `🚨 EVENT: ${evt.title}!`, evt.color);

    if (eventId === 'celebrity_visit') {
        spawnCelebrityPassenger(scene);
    }

    updateRandomEventBanner(scene);
}

export function stopRandomEvent(scene) {
    if (!sessionState.activeRandomEvent) return;
    const endedEvt = sessionState.activeRandomEvent;
    sessionState.activeRandomEvent = null;
    sessionState.randomEventTimeRemaining = 0;

    if (scene) {
        showFloatingText(scene, 180, 110, `Event Ended: ${endedEvt.title}`, '#94a3b8');
        updateRandomEventBanner(scene);
    }
}

export function handleRandomEventTick(scene) {
    if (sessionState.activeRandomEvent && sessionState.randomEventTimeRemaining > 0) {
        sessionState.randomEventTimeRemaining--;
        if (sessionState.randomEventTimeRemaining <= 0) {
            stopRandomEvent(scene);
        } else {
            updateRandomEventBanner(scene);
        }
    }
}

export function updateRandomEventBanner(scene) {
    if (!sessionState.eventBannerContainer || !sessionState.eventBannerText) return;

    if (sessionState.activeRandomEvent && sessionState.randomEventTimeRemaining > 0) {
        sessionState.eventBannerContainer.setVisible(true);
        sessionState.eventBannerText.setText(`${sessionState.activeRandomEvent.title} (${sessionState.randomEventTimeRemaining}s) - ${sessionState.activeRandomEvent.desc}`);
        sessionState.eventBannerText.setColor(sessionState.activeRandomEvent.color);
    } else {
        sessionState.eventBannerContainer.setVisible(false);
    }
}

export function openDevEventsModal(scene) {
    if (sessionState.devEventsModalContainer) sessionState.devEventsModalContainer.destroy();

    const currentCamY = scene.cameras.main.scrollY;
    const centerY = currentCamY + 320;

    const overlay = scene.add.rectangle(180, centerY, 360, 640, 0x000000, 0.8).setInteractive();
    const modalBg = scene.add.rectangle(180, centerY, 320, 420, 0x111827).setStrokeStyle(2, 0xf59e0b);

    const title = createCrispText(scene, 180, centerY - 180, '🎲 TEST RANDOM EVENTS', {
        category: 'PRIMARY',
        fontSize: 15,
        color: '#f59e0b',
        fontStyle: 'bold',
        origin: 0.5
    });

    const subTitle = createCrispText(scene, 180, centerY - 160, 'Developer tools: Manually trigger any random event', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#94a3b8',
        origin: 0.5
    });

    const eventKeys = Object.keys(RANDOM_EVENTS);
    const elements = [];

    eventKeys.forEach((key, index) => {
        const evt = RANDOM_EVENTS[key];
        const itemY = centerY - 115 + (index * 58);
        const cardBg = scene.add.rectangle(180, itemY, 290, 50, 0x1f2937).setStrokeStyle(1.2, Phaser.Display.Color.HexStringToColor(evt.color).color).setInteractive({ useHandCursor: true });

        const evtTitle = createCrispText(scene, 45, itemY - 14, evt.title, {
            category: 'BODY_MODAL',
            fontSize: 12,
            color: evt.color,
            fontStyle: 'bold'
        });

        const evtDesc = createCrispText(scene, 45, itemY + 2, `${evt.desc} (${evt.duration}s)`, {
            category: 'SECONDARY_LABEL',
            fontSize: 10.5,
            color: '#cbd5e1'
        });

        const triggerBtn = scene.add.rectangle(275, itemY, 60, 32, 0x374151).setStrokeStyle(1, 0x9ca3af);
        const triggerText = createCrispText(scene, 275, itemY, 'START', {
            category: 'PRIMARY_BUTTON',
            fontSize: 11,
            color: '#ffffff',
            fontStyle: 'bold',
            origin: 0.5
        });

        cardBg.on('pointerdown', () => {
            triggerRandomEvent(scene, evt.id);
            hideDevEventsModal();
        });

        elements.push(cardBg, evtTitle, evtDesc, triggerBtn, triggerText);
    });

    const cancelY = centerY + 145;
    const cancelBtn = scene.add.rectangle(180, cancelY, 180, 32, 0x7f1d1d).setStrokeStyle(1, 0xef4444).setInteractive({ useHandCursor: true });
    const cancelText = createCrispText(scene, 180, cancelY, '⏹️ STOP CURRENT EVENT', {
        category: 'PRIMARY_BUTTON',
        fontSize: 11,
        color: '#ffffff',
        fontStyle: 'bold',
        origin: 0.5
    });

    cancelBtn.on('pointerdown', () => {
        stopRandomEvent(scene);
        hideDevEventsModal();
    });

    const closeBtn = createCrispText(scene, 180, centerY + 190, '[ CLOSE DEV MENU ]', {
        category: 'PRIMARY_BUTTON',
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'bold',
        origin: 0.5
    }).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
        playSound('click');
        hideDevEventsModal();
    });

    sessionState.devEventsModalContainer = scene.add.container(0, 0, [
        overlay, modalBg, title, subTitle, ...elements, cancelBtn, cancelText, closeBtn
    ]).setDepth(210);
}

export function hideDevEventsModal() {
    if (sessionState.devEventsModalContainer) {
        sessionState.devEventsModalContainer.destroy();
        sessionState.devEventsModalContainer = null;
    }
}

// Connect modal openers/closers
registerOpenAdvertisingModal(openAdvertisingModal);
registerBreakdownSystemModal(openBreakdownModal);
registerFloorButtonBreakdown(openBreakdownModal);
registerHideBreakdownModal(hideBreakdownModal);
registerHideAdModal(hideAdModal);
registerOfflineModalOpener(openOfflineEarningsModal);
