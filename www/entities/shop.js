// Shop Entity Visual Slot Builder
import { BUSINESS_TYPES } from '../config/businesses.js';
import { FLOOR_DEFINITIONS } from '../config/floors.js';

export function createShopSlotVisual(scene, floor, shop) {
    const btId = shop.businessType;
    const bt = btId && BUSINESS_TYPES[btId] ? BUSINESS_TYPES[btId] : null;
    const floorDef = FLOOR_DEFINITIONS[floor];

    let strokeColor = shop.active ? 0x3b82f6 : 0xe74c3c;
    let bgColor = shop.active ? 0x131a26 : 0x221215;
    let titleColor = '#60a5fa';

    if (shop.active && bt) {
        if (bt.id === 'CAFE') { strokeColor = 0xf59e0b; titleColor = '#fbbf24'; bgColor = 0x241a10; }
        else if (bt.id === 'SHOPPING') { strokeColor = 0xf97316; titleColor = '#fb923c'; bgColor = 0x261912; }
        else if (bt.id === 'OFFICE') { strokeColor = 0x38bdf8; titleColor = '#7dd3fc'; bgColor = 0x0f2334; }
        else if (bt.id === 'GYM') { strokeColor = 0x10b981; titleColor = '#34d399'; bgColor = 0x0e261a; }
        else if (bt.id === 'ENTERTAINMENT') { strokeColor = 0xa855f7; titleColor = '#c084fc'; bgColor = 0x241334; }
        else if (bt.id === 'LUXURY') { strokeColor = 0xfacc15; titleColor = '#fde047'; bgColor = 0x292510; }
    }

    const shopBg = scene.add.rectangle(0, 0, 106, 50, bgColor, 0.94);
    shopBg.setStrokeStyle(1.4, strokeColor);

    let titleText, subText, timerText, activityLight;

    if (shop.active) {
        titleText = scene.add.text(-47, -18, shop.name, { fontSize: '7.5px', color: titleColor, fontStyle: 'bold' });
        subText = scene.add.text(-47, -6, shop.desc, { fontSize: '6.5px', color: '#94a3b8' });
        timerText = scene.add.text(-47, 6, `⏱ ${shop.contractTime}s | +${shop.rent}💰/6s`, { fontSize: '6.5px', color: '#4ade80', fontStyle: 'bold' });
        
        activityLight = scene.add.circle(46, -17, 3, strokeColor, 0.9);
        scene.tweens.add({
            targets: activityLight,
            alpha: 0.3,
            yoyo: true,
            repeat: -1,
            duration: 900
        });
    } else {
        titleText = scene.add.text(0, -11, `🛑 F${floor} VACANT UNIT`, { fontSize: '8px', color: '#f87171', fontStyle: 'bold' }).setOrigin(0.5);
        subText = scene.add.text(0, 6, '👉 TAP TO ADVERTISE', { fontSize: '7px', color: '#fbbf24', fontStyle: 'bold' }).setOrigin(0.5);
        timerText = scene.add.text(0, 0, '').setVisible(false);
        activityLight = scene.add.circle(46, -17, 2, 0xef4444, 0.4);
    }

    return { shopBg, titleText, subText, timerText, activityLight };
}

