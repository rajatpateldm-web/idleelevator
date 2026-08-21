// Passenger Entity Factory & Animations
import { floorY } from '../config/floors.js';
import { passengerState } from '../state/passengerState.js';

export function createPassengerEntity(scene, archetype, targetFloor, tenantPatienceMult = 1.0) {
    const charSprite = scene.add.image(0, 0, 'tex_' + archetype.type);

    const isKiosk = targetFloor === 0;
    const tagBg = scene.add.rectangle(0, -24, isKiosk ? 26 : 22, 13, 0x0a0f1d, 1.0);
    tagBg.setStrokeStyle(1.5, isKiosk ? 0x2ecc71 : 0x388bfd);

    const targetTag = scene.add.text(0, -24, isKiosk ? '☕' : `F${targetFloor}`, {
        fontSize: '9.5px',
        color: isKiosk ? '#2ecc71' : '#58a6ff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    const barBg = scene.add.rectangle(0, -34, 24, 4, 0x21262d);
    const patienceBar = scene.add.rectangle(-12, -34, 24, 4, 0x2ecc71).setOrigin(0, 0.5);

    const angryEmoji = scene.add.text(0, -46, '😡', { fontSize: '13px' }).setOrigin(0.5).setVisible(false);

    let specialBadge = null;
    let specialBadgeBg = null;
    if (archetype.isSpecial && archetype.badge) {
        specialBadgeBg = scene.add.rectangle(0, -46, 52, 11, 0x0f172a, 0.95).setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(archetype.badgeColor).color);
        specialBadge = scene.add.text(0, -46, archetype.badge, {
            fontSize: '6.5px',
            color: archetype.badgeColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    const elements = [charSprite, tagBg, targetTag, barBg, patienceBar, angryEmoji];
    if (specialBadgeBg && specialBadge) {
        elements.push(specialBadgeBg, specialBadge);
    }

    const passenger = scene.add.container(390, floorY[0] + 16, elements);

    const effectivePatience = Math.max(4.0, Math.round(archetype.patience * tenantPatienceMult * 10) / 10);

    passenger.archetype = archetype;
    passenger.targetFloor = targetFloor;
    passenger.currentFloor = 0;
    passenger.destination = targetFloor === 0 ? 'kiosk' : 'up';
    passenger.tenantPatienceMult = tenantPatienceMult;
    passenger.maxPatience = effectivePatience;
    passenger.patience = effectivePatience;
    passenger.patienceBar = patienceBar;
    passenger.targetTag = targetTag;
    passenger.tagBg = tagBg;
    passenger.barBg = barBg;
    passenger.angryEmoji = angryEmoji;
    passenger.specialBadge = specialBadge;
    passenger.specialBadgeBg = specialBadgeBg;
    passenger.isWaiting = false;
    passenger.isWalkingOut = false;
    passenger.setDepth(12);

    return passenger;
}

export function animateWalkTo(scene, entity, targetX, targetY, onComplete) {
    scene.tweens.killTweensOf(entity);

    const distance = Math.abs(entity.x - targetX);
    const speedMultiplier = entity.archetype ? entity.archetype.speed : 1.0;
    const duration = Math.max(150, (distance / (65 * speedMultiplier)) * 1000);

    const bobTween = scene.tweens.add({
        targets: entity,
        y: targetY - 3,
        yoyo: true,
        repeat: Math.floor(duration / 180),
        duration: 90
    });

    scene.tweens.add({
        targets: entity,
        x: targetX,
        duration: duration,
        ease: 'Linear',
        onComplete: () => {
            bobTween.stop();
            entity.y = targetY;
            entity.x = targetX;
            if (onComplete) onComplete();
        }
    });
}

export function getQueuePositionX(floor, index) {
    return 215 + index * 26;
}

export function updateQueueDisplay(floor) {
    if (!passengerState.floorQueues[floor]) return;
    passengerState.floorQueues[floor].forEach((p, index) => {
        if (!p.isWalkingOut && p.isWaiting) {
            p.scene.tweens.add({
                targets: p,
                x: getQueuePositionX(floor, index),
                duration: 200
            });
        }
    });
}
