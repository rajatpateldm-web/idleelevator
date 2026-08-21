// Procedural Solid Sprite Texture Builder
import { ARCHETYPES } from '../config/passengers.js';

export function generateSolidTextures(scene) {
    ARCHETYPES.forEach(arch => {
        const key = 'tex_' + arch.type;
        if (scene.textures.exists(key)) return;

        const g = scene.make.graphics({ x: 0, y: 0, add: false });

        // Shoes
        g.fillStyle(0x111118, 1);
        g.fillRect(3, 26, 4, 3);
        g.fillRect(9, 26, 4, 3);

        // Pants / Legs
        g.fillStyle(arch.pants, 1);
        g.fillRect(3, 18, 4, 8);
        g.fillRect(9, 18, 4, 8);

        // Shirt / Torso
        g.fillStyle(arch.shirt, 1);
        g.fillRect(2, 9, 12, 9);
        g.lineStyle(1, 0x111118, 0.4);
        g.strokeRect(2, 9, 12, 9);

        // Head / Skin
        g.fillStyle(arch.skin, 1);
        g.fillRect(4, 2, 8, 7);

        // Hair
        g.fillStyle(arch.hair, 1);
        g.fillRect(3, 0, 10, 3);

        // Eyes
        g.fillStyle(0x111118, 1);
        g.fillRect(5, 4, 2, 2);
        g.fillRect(9, 4, 2, 2);

        g.generateTexture(key, 16, 30);
        g.destroy();
    });

    // Mechanic Texture
    if (!scene.textures.exists('tex_mechanic')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x111118, 1);
        g.fillRect(3, 26, 4, 3);
        g.fillRect(9, 26, 4, 3);
        g.fillStyle(0x2c3e50, 1);
        g.fillRect(3, 18, 4, 8);
        g.fillRect(9, 18, 4, 8);
        g.fillStyle(0xf39c12, 1); // Hi-vis vest
        g.fillRect(2, 9, 12, 9);
        g.fillStyle(0xffdbac, 1);
        g.fillRect(4, 2, 8, 7);
        g.fillStyle(0xf1c40f, 1); // Yellow hardhat
        g.fillRect(2, 0, 12, 3);
        g.fillStyle(0x111118, 1);
        g.fillRect(5, 4, 2, 2);
        g.fillRect(9, 4, 2, 2);
        g.generateTexture('tex_mechanic', 16, 30);
        g.destroy();
    }
}
