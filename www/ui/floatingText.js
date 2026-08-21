// Floating Feedback Text Utility

export function showFloatingText(scene, x, y, text, color) {
    if (!scene || !scene.add) return;
    const float = scene.add.text(x, y, text, {
        fontSize: '11px',
        color: color,
        fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(150);

    scene.tweens.add({
        targets: float,
        y: y - 25,
        alpha: 0,
        duration: 900,
        ease: 'Power1',
        onComplete: () => float.destroy()
    });
}
