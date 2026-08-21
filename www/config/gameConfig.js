// Game Configuration & Dimensions
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;
export const WORLD_HEIGHT = 1040;
export const BG_COLOR = '#13161c';

export function createGameConfig(sceneConfig) {
    return {
        type: Phaser.AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        resolution: window.devicePixelRatio || 1,
        backgroundColor: BG_COLOR,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        scene: sceneConfig
    };
}
