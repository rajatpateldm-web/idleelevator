// Mechanic Entity Factory & Animation
import { floorY } from '../config/floors.js';
import { elevatorState } from '../state/elevatorState.js';

export function createMechanicEntity(scene, floor) {
    const mechSprite = scene.add.image(0, 0, 'tex_mechanic');
    const wrench = scene.add.text(10, -4, '🔧', { fontSize: '10px' }).setOrigin(0.5);

    const progBg = scene.add.rectangle(0, -22, 28, 5, 0x222a38);
    const progBar = scene.add.rectangle(-14, -22, 0, 5, 0x3498db).setOrigin(0, 0.5);
    const label = scene.add.text(0, -32, 'Repairing...', { fontSize: '8px', color: '#f1c40f', fontStyle: 'bold' }).setOrigin(0.5);

    const container = scene.add.container(-30, floorY[floor] + 16, [
        mechSprite, wrench, progBg, progBar, label
    ]).setDepth(20);

    return { container, wrench, progBar, label };
}
