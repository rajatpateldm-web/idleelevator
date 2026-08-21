// Shop Entity Visual Slot Builder
import { buildingState } from '../state/buildingState.js';

export function createShopSlotVisual(scene, floor, shop) {
    const shopBg = scene.add.rectangle(0, 0, 105, 48, shop.active ? 0x1c2330 : 0x2d1818, 0.9);
    shopBg.setStrokeStyle(1.2, shop.active ? 0x3b465a : 0xe74c3c);

    let titleText, subText, timerText;

    if (shop.active) {
        titleText = scene.add.text(-46, -18, shop.name, { fontSize: '7.5px', color: '#58a6ff', fontStyle: 'bold' });
        subText = scene.add.text(-46, -6, shop.desc, { fontSize: '6.5px', color: '#8b949e' });
        timerText = scene.add.text(-46, 6, `⏱ ${shop.contractTime}s | +${shop.rent}💰/6s`, { fontSize: '6.5px', color: '#2ecc71', fontStyle: 'bold' });
    } else {
        titleText = scene.add.text(0, -10, '🛑 VACANT UNIT', { fontSize: '8.5px', color: '#ff4757', fontStyle: 'bold' }).setOrigin(0.5);
        subText = scene.add.text(0, 6, '👉 TAP TO ADVERTISE', { fontSize: '7px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);
        timerText = scene.add.text(0, 0, '').setVisible(false);
    }

    return { shopBg, titleText, subText, timerText };
}
