// Centralized UI Configuration & Readability System

export const UI_FONT_POLICIES = {
    PRIMARY: { min: 14, max: 16 },
    PRIMARY_BUTTON: { min: 12, max: 14 },
    BODY_MODAL: { min: 12, max: 14 },
    SECONDARY_LABEL: { min: 11, max: 12 },
    ABSOLUTE_MINIMUM: 10
};

/**
 * Calculates a responsive font size based on category or base size with enforced policy minimums.
 */
export function responsiveFontSize(baseSize, category = null) {
    let target = baseSize;
    if (category && UI_FONT_POLICIES[category]) {
        target = Math.max(baseSize, UI_FONT_POLICIES[category].min);
    } else {
        target = Math.max(baseSize, UI_FONT_POLICIES.ABSOLUTE_MINIMUM);
    }
    return `${Math.round(target)}px`;
}

/**
 * Helper to ensure touch targets meet the ~40x40px logical hit area requirement.
 */
export function getTouchBounds(width, height, minTouchSize = 40) {
    const effectiveWidth = Math.max(width, minTouchSize);
    const effectiveHeight = Math.max(height, minTouchSize);
    return {
        width,
        height,
        hitWidth: effectiveWidth,
        hitHeight: effectiveHeight,
        hitArea: new Phaser.Geom.Rectangle(
            -(effectiveWidth - width) / 2,
            -(effectiveHeight - height) / 2,
            effectiveWidth,
            effectiveHeight
        )
    };
}

/**
 * Scales spacing proportionally to maintain clean visual margins.
 */
export function responsiveSpacing(baseValue) {
    return Math.round(baseValue);
}

/**
 * Ensures icon/emoji sizes maintain readable proportions.
 */
export function responsiveIconSize(baseSize) {
    return `${Math.max(baseSize, 12)}px`;
}

/**
 * Creates a Phaser.Text object with high resolution, proper padding, and standardized font properties.
 */
export function createCrispText(scene, x, y, text, styleOptions = {}) {
    const category = styleOptions.category || null;
    let rawFontSize = styleOptions.fontSize;
    if (typeof rawFontSize === 'string' && rawFontSize.endsWith('px')) {
        rawFontSize = parseFloat(rawFontSize);
    } else if (typeof rawFontSize !== 'number') {
        rawFontSize = 12;
    }

    const calculatedSize = responsiveFontSize(rawFontSize, category);

    const textStyle = {
        fontSize: calculatedSize,
        fontFamily: styleOptions.fontFamily || 'Arial, sans-serif',
        color: styleOptions.color || '#ffffff',
        fontStyle: styleOptions.fontStyle || 'normal',
        align: styleOptions.align || 'left',
        wordWrap: styleOptions.wordWrap || null,
        padding: styleOptions.padding || { x: 4, y: 4 }, // Padding prevents emoji and italic font clipping
        resolution: styleOptions.resolution || Math.max(2, window.devicePixelRatio || 1)
    };

    if (styleOptions.stroke) {
        textStyle.stroke = styleOptions.stroke;
        textStyle.strokeThickness = styleOptions.strokeThickness || 2;
    }

    const textObj = scene.add.text(x, y, text, textStyle);

    if (styleOptions.origin !== undefined) {
        if (typeof styleOptions.origin === 'number') {
            textObj.setOrigin(styleOptions.origin);
        } else if (Array.isArray(styleOptions.origin)) {
            textObj.setOrigin(styleOptions.origin[0], styleOptions.origin[1]);
        }
    }

    if (styleOptions.depth !== undefined) {
        textObj.setDepth(styleOptions.depth);
    }

    if (styleOptions.scrollFactor !== undefined) {
        textObj.setScrollFactor(styleOptions.scrollFactor);
    }

    return textObj;
}
