// Daily Building Cycle Engine
//
// Responsibilities:
//   - Tracks current day number (persisted) and current phase (not persisted)
//   - Advances phases on a 1-second tick (fed from game.js countdown loop via registerDayTick)
//   - Emits phase-change, day-start, day-closing, and day-complete callbacks
//   - Exposes read-only API for demandSystem and future systems to query
//
// What this system does NOT do:
//   - Does NOT directly modify passengers, tenants, elevator, rating, or economy
//   - Does NOT apply traffic multipliers (Phase 2)
//   - Does NOT create its own scene timers (integrates into existing 1s countdown tick)

import { DAY_PHASES, DAY_USE_DEV_DURATIONS, DAY_PHASE_COUNT } from '../config/dayConfig.js';
import { isDevModeActive } from '../config/devConfig.js';

// ─── Internal State ───────────────────────────────────────────────────────────

const _dayState = {
    currentDay: 1,          // persisted
    currentPhaseIndex: 0,   // not persisted
    phaseElapsedSeconds: 0, // not persisted
    isActive: false
};

// ─── Event Callbacks ──────────────────────────────────────────────────────────

const _callbacks = {
    onDayStarted:   [],  // ()
    onPhaseChanged: [],  // (phase, dayNumber)
    onDayClosing:   [],  // (dayNumber)
    onDayCompleted: []   // (dayNumber)
};

function _emit(eventName, ...args) {
    for (const fn of _callbacks[eventName]) {
        try { fn(...args); } catch (e) {
            console.error(`[DAY] Error in ${eventName} callback:`, e);
        }
    }
}

// ─── Phase Resolution ─────────────────────────────────────────────────────────

function _getPhaseDuration(phase) {
    return DAY_USE_DEV_DURATIONS ? phase.devDuration : phase.prodDuration;
}

function _currentPhaseObj() {
    return DAY_PHASES[_dayState.currentPhaseIndex] || DAY_PHASES[0];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Current calendar day number (starts at 1, increments each full cycle). */
export function getCurrentDay() {
    return _dayState.currentDay;
}

/** Current phase object from DAY_PHASES, or null if day not active. */
export function getCurrentPhase() {
    if (!_dayState.isActive) return null;
    return _currentPhaseObj();
}

/** Fraction 0.0–1.0 through the current phase. */
export function getPhaseProgress() {
    if (!_dayState.isActive) return 0;
    const duration = _getPhaseDuration(_currentPhaseObj());
    return Math.min(1.0, _dayState.phaseElapsedSeconds / duration);
}

/** Seconds remaining in the current phase. */
export function getPhaseRemainingTime() {
    if (!_dayState.isActive) return 0;
    const duration = _getPhaseDuration(_currentPhaseObj());
    return Math.max(0, duration - _dayState.phaseElapsedSeconds);
}

/** Whether the day cycle is running. */
export function isDayActive() {
    return _dayState.isActive;
}

/** Returns a snapshot of the full day state (for save or debugging). */
export function getDayState() {
    const phase = _currentPhaseObj();
    return {
        currentDay: _dayState.currentDay,
        currentPhaseId: phase ? phase.id : null,
        currentPhaseIndex: _dayState.currentPhaseIndex,
        phaseElapsedSeconds: _dayState.phaseElapsedSeconds,
        phaseRemainingSeconds: getPhaseRemainingTime(),
        phaseProgress: getPhaseProgress(),
        isActive: _dayState.isActive
    };
}

/** Advances to the next day, resets phase to MORNING, and fires day-start callbacks. */
export function startNextDay() {
    if (_dayState.isActive) {
        // Only allow startNextDay from CLOSING completion; guard against double calls
        return;
    }
    _dayState.currentPhaseIndex = 0;
    _dayState.phaseElapsedSeconds = 0;
    _dayState.isActive = true;

    const phase = _currentPhaseObj();
    if (isDevModeActive()) {
        console.log(`[DAY] Day ${_dayState.currentDay} started`);
        console.log(`[DAY] Phase: ${phase.id}`);
    }

    _emit('onDayStarted');
    _emit('onPhaseChanged', phase, _dayState.currentDay);
}

// ─── Callback Registration ────────────────────────────────────────────────────

/** Called when any new day begins (including day 1). */
export function onDayStarted(fn) {
    if (typeof fn === 'function') _callbacks.onDayStarted.push(fn);
}

/** Called on every phase transition including day start. Receives (phase, dayNumber). */
export function onPhaseChanged(fn) {
    if (typeof fn === 'function') _callbacks.onPhaseChanged.push(fn);
}

/** Called when the CLOSING phase begins. Receives (dayNumber). */
export function onDayClosing(fn) {
    if (typeof fn === 'function') _callbacks.onDayClosing.push(fn);
}

/** Called when CLOSING phase completes and day is fully done. Receives (completedDayNumber). */
export function onDayCompleted(fn) {
    if (typeof fn === 'function') _callbacks.onDayCompleted.push(fn);
}

// ─── Tick Integration ─────────────────────────────────────────────────────────
// Called once per second by game.js's existing COUNTDOWN_TICK_MS loop.
// Does NOT create its own scene.time.addEvent.

export function tickDayCycle() {
    if (!_dayState.isActive) return;

    _dayState.phaseElapsedSeconds++;

    const phase = _currentPhaseObj();
    const duration = _getPhaseDuration(phase);

    if (_dayState.phaseElapsedSeconds < duration) {
        // Still within this phase — nothing to do
        return;
    }

    // Phase complete: advance
    const completedPhaseId = phase.id;
    const nextIndex = _dayState.currentPhaseIndex + 1;

    if (nextIndex >= DAY_PHASE_COUNT) {
        // All phases done — day complete
        const completedDay = _dayState.currentDay;
        _dayState.isActive = false;
        _dayState.phaseElapsedSeconds = 0;
        _dayState.currentPhaseIndex = 0;
        _dayState.currentDay++;

        if (isDevModeActive()) {
            console.log(`[DAY] Day ${completedDay} completed`);
        }

        _emit('onDayCompleted', completedDay);

        // Auto-start next day immediately (seamless progression)
        startNextDay();
    } else {
        // Advance to next phase
        _dayState.currentPhaseIndex = nextIndex;
        _dayState.phaseElapsedSeconds = 0;

        const nextPhase = _currentPhaseObj();

        if (isDevModeActive()) {
            console.log(`[DAY] Phase: ${nextPhase.id}`);
        }

        // Fire CLOSING callback before the generic phase-changed callback
        if (nextPhase.id === 'CLOSING') {
            _emit('onDayClosing', _dayState.currentDay);
        }

        _emit('onPhaseChanged', nextPhase, _dayState.currentDay);
    }
}

// ─── Persistence Helpers ──────────────────────────────────────────────────────
// Save: read _dayState.currentDay via getCurrentDay()
// Load: call restoreDayNumber(n) during loadSavedData

/** Sets the persisted day counter on load. Does not start the cycle. */
export function restoreDayNumber(dayNumber) {
    if (typeof dayNumber === 'number' && dayNumber >= 1) {
        _dayState.currentDay = dayNumber;
    }
}

// Dev Mode Helpers exposed to window for manual/automated browser testing
if (typeof window !== 'undefined') {
    window.__daySystemDev = {
        fastForward: (seconds) => {
            _dayState.phaseElapsedSeconds += seconds;
            // Let the regular tick process the boundary transition if it exceeds duration
        },
        setPhase: (phaseId) => {
            const idx = DAY_PHASES.findIndex(p => p.id === phaseId);
            if (idx !== -1) {
                _dayState.currentPhaseIndex = idx;
                _dayState.phaseElapsedSeconds = 0;
                // Emit event so other modules (like HUD) update immediately
                _emit('onPhaseChanged', DAY_PHASES[idx], _dayState.currentDay);
            }
        }
    };
}

