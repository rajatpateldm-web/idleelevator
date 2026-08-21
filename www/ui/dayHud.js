// Day/Clock HUD — Phase Indicator Strip
//
// Placement: Fixed screen strip at y=112, below the event banner (y=98).
//   Top bar: y=10–62  | Mission banner: y=63–85  | Event banner: y=88–108 (conditional)
//   Day HUD: y=103–121  ← always visible, scrollFactor=0, non-interactive
//
// Updates: fed by the existing 1s COUNTDOWN_TICK_MS loop in game.js via tickDayHUD().
// No new timers are created.

import { createCrispText } from '../config/uiConfig.js';
import {
    getCurrentDay,
    getCurrentPhase,
    getPhaseRemainingTime,
    getPhaseProgress,
    isDayActive
} from '../systems/daySystem.js';

// ─── Internal refs (kept module-local) ───────────────────────────────────────

let _hudContainer = null;
let _dayLabel   = null; // "DAY 1"
let _phaseLabel = null; // "🌅 Morning"
let _timeLabel  = null; // "00:59"
let _bar        = null; // progress bar fill
let _barBg      = null; // progress bar background
let _scene      = null;

// Layout constants
const HUD_Y      = 112; // screen-space y, scrollFactor:0
const HUD_H      = 18;
const HUD_W      = 344;
const BAR_W_MAX  = 100; // max width of progress bar in logical px
const DEPTH      = 115; // above event banner (120) but below modals (200)

// ─── Format helpers ───────────────────────────────────────────────────────────

function _formatTime(seconds) {
    const s = Math.max(0, Math.round(seconds));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function createDayHUD(scene) {
    _scene = scene;

    // Background pill
    const bg = scene.add.rectangle(180, HUD_Y, HUD_W, HUD_H, 0x0d1117, 0.92)
        .setDepth(DEPTH - 1).setScrollFactor(0);
    bg.setStrokeStyle(1, 0x21262d);

    // Day number label — left-anchored
    _dayLabel = createCrispText(scene, 8, HUD_Y, 'DAY 1', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#58a6ff',
        fontStyle: 'bold',
        origin: [0, 0.5],
        depth: DEPTH,
        scrollFactor: 0
    });

    // Phase label — centre
    _phaseLabel = createCrispText(scene, 136, HUD_Y, '🌅 Morning', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#f1c40f',
        fontStyle: 'bold',
        origin: [0.5, 0.5],
        depth: DEPTH,
        scrollFactor: 0
    });

    // Countdown — right side
    _timeLabel = createCrispText(scene, 252, HUD_Y, '01:00', {
        category: 'SECONDARY_LABEL',
        fontSize: 11,
        color: '#cbd5e1',
        fontStyle: 'bold',
        origin: [0.5, 0.5],
        depth: DEPTH,
        scrollFactor: 0
    });

    // Progress bar background
    _barBg = scene.add.rectangle(305, HUD_Y, BAR_W_MAX, 7, 0x1e293b)
        .setDepth(DEPTH).setScrollFactor(0);
    _barBg.setStrokeStyle(1, 0x334155);

    // Progress bar fill (origin left-aligned so width expansion goes right)
    _bar = scene.add.rectangle(255, HUD_Y, 0, 5, 0x38bdf8)
        .setOrigin(0, 0.5).setDepth(DEPTH + 1).setScrollFactor(0);

    _hudContainer = scene.add.container(0, 0, [bg, _dayLabel, _phaseLabel, _timeLabel, _barBg, _bar])
        .setDepth(DEPTH).setScrollFactor(0);

    // Initial render
    _refreshDisplay();
}

// ─── Tick (called from game.js countdown loop once/second) ────────────────────

export function tickDayHUD() {
    if (!_hudContainer) return;
    _refreshDisplay();
}

// ─── Internal display refresh ─────────────────────────────────────────────────

function _refreshDisplay() {
    if (!isDayActive()) {
        if (_phaseLabel) _phaseLabel.setText('—');
        if (_timeLabel)  _timeLabel.setText('00:00');
        if (_bar)        _bar.width = 0;
        return;
    }

    const day   = getCurrentDay();
    const phase = getCurrentPhase();
    const rem   = getPhaseRemainingTime();
    const prog  = getPhaseProgress();

    if (_dayLabel)   _dayLabel.setText(`DAY ${day}`);

    if (phase) {
        const phaseStr = `${phase.emoji} ${phase.label}`;
        if (_phaseLabel) {
            _phaseLabel.setText(phaseStr);
            // Colour shift for closing phase
            _phaseLabel.setColor(phase.id === 'CLOSING' ? '#a78bfa' : '#f1c40f');
        }
    }

    if (_timeLabel)  _timeLabel.setText(_formatTime(rem));

    if (_bar) {
        // Bar origin is left-edge at x=255, max right edge at 255+BAR_W_MAX=355
        const fillW = Math.round(BAR_W_MAX * prog);
        _bar.width = fillW;
        // Colour: green → amber → purple as phase matures
        if (prog < 0.5) {
            _bar.fillColor = 0x38bdf8;  // sky blue — early phase
        } else if (prog < 0.8) {
            _bar.fillColor = 0xfbbf24;  // amber — mid phase
        } else {
            _bar.fillColor = 0xf87171;  // red — phase almost done
        }
    }
}
