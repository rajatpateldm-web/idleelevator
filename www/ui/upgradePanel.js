// Bottom Upgrade & Automation Dashboard Panel
import { MAX_CAPACITY_LEVEL, CAPACITY_COSTS, CAPACITY_VALUES, MAX_SPEED_LEVEL, SPEED_COSTS, SPEED_VALUES } from '../config/upgrades.js';
import { OPERATOR_BALANCE } from '../config/operator.js';
import { elevatorState } from '../state/elevatorState.js';
import { playerState, deductCoins, deductTips } from '../state/playerState.js';
import { sessionState } from '../state/sessionState.js';
import { playSound } from '../audio/audioManager.js';
import { showFloatingText } from './floatingText.js';
import { saveGameData } from '../save/saveManager.js';
import { showRewardedAdForBoost } from '../ads/adManager.js';

let onHUDUpdateCallback = null;
export function registerHUDUpdater(fn) {
    onHUDUpdateCallback = fn;
}

export function createBottomUpgradePanel(scene) {
    const bar = scene.add.rectangle(180, 588, 344, 82, 0x202633, 0.95).setDepth(100).setScrollFactor(0);
    bar.setStrokeStyle(1.5, 0x3b4457);

    createCustomPinnedButton(scene, 52, 588, '👷 HIRE', `${OPERATOR_BALANCE.HIRE_COIN_COST} 💰 (${OPERATOR_BALANCE.HIRE_DURATION_SEC}s)`, 0x238636, () => {
        const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
        if (deductCoins(OPERATOR_BALANCE.HIRE_COIN_COST)) {
            sessionState.operatorTimeLeft += OPERATOR_BALANCE.HIRE_DURATION_SEC;
            sessionState.isOperatorActive = true;
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            playSound('coin');
            showFloatingText(scene, 52, elevY, `+${OPERATOR_BALANCE.HIRE_DURATION_SEC}s Operator!`, '#2ecc71');
        } else {
            showFloatingText(scene, 52, elevY, `Need ${OPERATOR_BALANCE.HIRE_COIN_COST} 💰`, '#e74c3c');
        }
    });

    createCustomPinnedButton(scene, 136, 588, '🎬 BOOST', `Ad (+${OPERATOR_BALANCE.BOOST_DURATION_SEC}s)`, 0xbd561d, () => {
        showRewardedAdForBoost(scene);
    });

    sessionState.capBtnObj = createUpgradeProgressButton(scene, 222, 588, '📦 CAP', elevatorState.capacityLevel, MAX_CAPACITY_LEVEL, CAPACITY_COSTS[elevatorState.capacityLevel - 1], 0x1f6feb, () => {
        const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
        if (elevatorState.capacityLevel >= MAX_CAPACITY_LEVEL) {
            showFloatingText(scene, 222, elevY, 'Max Level Reached!', '#f39c12');
            return;
        }
        const cost = CAPACITY_COSTS[elevatorState.capacityLevel - 1];
        if (deductTips(cost)) {
            elevatorState.capacityLevel++;
            elevatorState.elevatorCapacity = CAPACITY_VALUES[elevatorState.capacityLevel - 1];
            updateUpgradeCards();
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            playSound('tip');
            showFloatingText(scene, 222, elevY, `Capacity Lv.${elevatorState.capacityLevel} (${elevatorState.elevatorCapacity} Cap)`, '#58a6ff');
        } else {
            showFloatingText(scene, 222, elevY, `Need ${cost} 💎!`, '#e74c3c');
        }
    });

    sessionState.speedBtnObj = createUpgradeProgressButton(scene, 306, 588, '⚡ SPEED', elevatorState.speedLevel, MAX_SPEED_LEVEL, SPEED_COSTS[elevatorState.speedLevel - 1], 0x8957e5, () => {
        const elevY = elevatorState.elevatorContainer ? elevatorState.elevatorContainer.y : 320;
        if (elevatorState.speedLevel >= MAX_SPEED_LEVEL) {
            showFloatingText(scene, 306, elevY, 'Max Level Reached!', '#f39c12');
            return;
        }
        const cost = SPEED_COSTS[elevatorState.speedLevel - 1];
        if (deductTips(cost)) {
            elevatorState.speedLevel++;
            elevatorState.moveDuration = SPEED_VALUES[elevatorState.speedLevel - 1];
            updateUpgradeCards();
            if (onHUDUpdateCallback) onHUDUpdateCallback();
            saveGameData();
            playSound('tip');
            showFloatingText(scene, 306, elevY, `Speed Lv.${elevatorState.speedLevel}!`, '#bc8cff');
        } else {
            showFloatingText(scene, 306, elevY, `Need ${cost} 💎!`, '#e74c3c');
        }
    });
}

export function createUpgradeProgressButton(scene, x, y, title, level, maxLevel, cost, color, callback) {
    const bg = scene.add.rectangle(x, y, 76, 62, color).setDepth(101).setScrollFactor(0);
    bg.setStrokeStyle(1.2, 0xffffff, 0.4);

    const titleText = scene.add.text(x, y - 18, `${title} Lv.${level}`, {
        fontSize: '9.5px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const costLabel = level >= maxLevel ? 'MAX' : `${cost} 💎`;
    const costText = scene.add.text(x, y - 4, costLabel, {
        fontSize: '9px',
        color: '#f0f6fc',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const progBg = scene.add.rectangle(x, y + 14, 58, 6, 0x161b22).setDepth(102).setScrollFactor(0);
    progBg.setStrokeStyle(1, 0x3d475a);

    const pct = level / maxLevel;
    const progFill = scene.add.rectangle(x - 29, y + 14, 58 * pct, 6, 0x2ecc71).setOrigin(0, 0.5).setDepth(103).setScrollFactor(0);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
        playSound('click');
        bg.setScale(0.92);
        scene.time.delayedCall(100, () => bg.setScale(1));
        callback();
    });

    return { bg, titleText, costText, progFill, maxLevel };
}

export function updateUpgradeCards() {
    if (sessionState.capBtnObj) {
        sessionState.capBtnObj.titleText.setText(`📦 CAP Lv.${elevatorState.capacityLevel}`);
        const capCost = elevatorState.capacityLevel >= MAX_CAPACITY_LEVEL ? 'MAX' : `${CAPACITY_COSTS[elevatorState.capacityLevel - 1]} 💎`;
        sessionState.capBtnObj.costText.setText(capCost);
        sessionState.capBtnObj.progFill.width = 58 * (elevatorState.capacityLevel / MAX_CAPACITY_LEVEL);
    }
    if (sessionState.speedBtnObj) {
        sessionState.speedBtnObj.titleText.setText(`⚡ SPEED Lv.${elevatorState.speedLevel}`);
        const spdCost = elevatorState.speedLevel >= MAX_SPEED_LEVEL ? 'MAX' : `${SPEED_COSTS[elevatorState.speedLevel - 1]} 💎`;
        sessionState.speedBtnObj.costText.setText(spdCost);
        sessionState.speedBtnObj.progFill.width = 58 * (elevatorState.speedLevel / MAX_SPEED_LEVEL);
    }
}

export function createCustomPinnedButton(scene, x, y, title, subtitle, color, callback) {
    const bg = scene.add.rectangle(x, y, 76, 62, color).setDepth(101).setScrollFactor(0);
    bg.setStrokeStyle(1.2, 0xffffff, 0.4);

    const titleText = scene.add.text(x, y - 10, title, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    const subText = scene.add.text(x, y + 12, subtitle, {
        fontSize: '9.5px',
        color: '#f0f6fc'
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
        playSound('click');
        bg.setScale(0.92);
        scene.time.delayedCall(100, () => bg.setScale(1));
        callback();
    });

    return { bg, titleText, subText };
}
