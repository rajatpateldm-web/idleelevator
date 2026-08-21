# Elevator Idle Development Rules

## Project

This is a Phaser 3 mobile idle game.

Target viewport:
360 x 640

## Architecture

Do not put new gameplay systems into game.js.

game.js is only the application entry point.

Gameplay belongs in systems/.
Configuration belongs in config/.
UI belongs in ui/.
Entities belong in entities/.

## Editing Rules

Never replace an entire source file unless explicitly requested.

Prefer targeted edits.

Before changing a system, inspect its existing implementation.

Do not modify unrelated systems.

Do not remove working functionality.

## Testing

After modifying gameplay:

1. Run the browser version.
2. Check console errors.
3. Test the changed feature.
4. Test the immediate systems it interacts with.

## Save System

Existing saves must remain compatible.

Never change save keys without migration logic.

## Ads

Do not modify AdMob configuration unless explicitly requested.

Browser mode must continue using the existing ad fallback.

## Game Design

The game is an idle skyscraper management game.

The elevator is the central mechanic.

New systems should support:
- progression
- retention
- player decisions
- replayability

## Agent Execution Limits

For normal tasks:

- Work only on the requested task.
- Do not repeatedly re-check the same files.
- Do not repeatedly run the same test.
- Do not perform a full-project audit unless explicitly requested.
- Do not refactor unrelated code.
- Do not create subagents unless parallel work is clearly necessary.
- Do not continue working after the requested task is complete.
- After completing the requested task, stop and report the result.

If a task becomes significantly larger than expected:
1. Stop.
2. Explain what expanded the scope.
3. Ask for confirmation before continuing.

If a command, browser test, or subagent appears stuck:
- Do not repeatedly retry it.
- Stop the current operation.
- Report the suspected cause.

## Change Protocol

Before modifying code:

1. Read AGENTS.md.
2. Read PROJECT_STATE.md.
3. Identify the smallest set of files required for the task.
4. Inspect those files and their direct dependencies.
5. State the planned changes briefly.
6. Do not inspect unrelated files unless a dependency requires it.

During implementation:

1. Make the smallest safe change.
2. Do not rewrite entire files unless explicitly requested.
3. Do not rename existing variables/functions unnecessarily.
4. Do not change unrelated systems.
5. Preserve existing save compatibility.
6. Preserve existing Android/AdMob functionality.
7. Avoid introducing duplicate state.
8. Avoid creating new global variables.
9. Reuse existing systems instead of creating parallel implementations.

After implementation:

1. Run the browser version.
2. Check the browser console.
3. Test the changed feature.
4. Test the systems directly connected to it.
5. Fix regressions caused by the change.
6. Update PROJECT_STATE.md if project state changed.
7. Update CHANGELOG.md only for meaningful completed changes.

## Stop Conditions

Stop and ask for confirmation instead of making a large change if:

- The requested change requires rewriting a major system.
- Existing save data would become incompatible.
- Multiple unrelated systems need to be changed.
- The architecture needs to change.
- A requested feature conflicts with an existing mechanic.
- The correct behavior is ambiguous.

Never silently make a large architectural decision.

## Response Format

At the end of every task, always provide a summary in exactly this format:

- Files changed
- What changed
- Tests performed
- Any remaining issue