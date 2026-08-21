# Changelog

> Entries are based solely on what is verifiable in the current source files.
> No historical timestamps are available — this documents the current state only.

---

## Current

### Working Systems (v0.4.0)
- Elevator movement between floors (0–5) with animated door open/close
- Responsive UI & Readability System (`www/config/uiConfig.js`): centralized crisp text rendering and font scaling policies (10px–16px baseline defaults) across HUD, Upgrade Cards, Floor Buttons, and Modals
- Standardized minimum 40x40 logical pixel touch targets for buttons and interactive controls across mobile viewports
- High-DPI screen resolution scaling via Phaser renderer devicePixelRatio configuration
- Passenger spawning, patience timers, and queue management per floor
- Staircase walkout animation when patience expires
- Shop tenants with passive rent, contract timers, and grace periods
- Building rating (1.0–5.0) with rise/fall based on passenger satisfaction
- Capacity and speed upgrades (5 levels each)
- Operator automation (timed boost, toggled via ad or browser fallback)
- Breakdown and repair system (manual timer + instant-repair ad option)
- Service combo multiplier (streak bonus on consecutive served passengers)
- Investor income boost (temporary 1.5× fare multiplier)
- Random events system (5 event types, evaluated every 75 s at 45% chance)
- Active missions system (3 concurrent slots, auto-refreshes on claim)
- Offline earnings calculation (capped at 8 hours, shown on return)
- HQ Management modal with lifetime stats and prestige system
- Elevator car model skins (4 models, gated by prestige tokens)
- Procedural audio engine (Web Audio API, 8 sound types)
- Auto-save every 5 seconds via localStorage
- Browser ad fallback (all ad paths work without AdMob present)

### Known Limitations
- Passenger queue can occasionally desync after boarding
- Floors 6-10 defined in progression architecture but not yet populated with unique graphics
- Mission system still being iterated
- Offline ad doubling falls back to 2x immediately in browser

---

## Architecture

- Single-file Phaser 3 game — all systems live in www/game.js (~3100 lines)
- Game configured at 360x640 (mobile portrait), scaled with Phaser.Scale.FIT
- Camera world height: 1040px; scrolls between floors via free touch drag
- Capacitor (@capacitor/core v8, @capacitor/android v8) wraps the web app for Android
- @capacitor-community/admob v8 used for monetisation
- App ID: com.rkpdev.elevatoridle; web dir: www/
- Floor layout defined in FLOOR_DEFINITIONS data object (floors 0–5)
- Business behaviour centralised in BUSINESS_TYPES data object (6 types)
- Passenger archetypes defined in ARCHETYPES array (9 types: 3 standard, 6 special)

---

## Gameplay

### Passengers
- 3 standard archetypes: Shopper, Student, Senior
- 6 special archetypes: VIP, Celebrity, Executive, Investor, Tourist, Rusher
- Special passengers gated by minRating and spawned with rarity weights
- Patience bars displayed per passenger; colour shifts green → orange → red
- Walkout via staircase animation when patience hits 0
- Investor passengers grant a 1.5x income surge for a fixed duration
- Rusher passengers give high reward only if served while patience > 50%
- Tourist passengers assigned a random destination floor

### Elevator
- Moves between 6 floors (0–5); floor Y coordinates fixed in floorY map
- Animated cable, left/right sliding doors, and capacity LED
- Capacity: 2–8 passengers (5 upgrade levels, costs: 50→150→400→1000→2500)
- Speed: 850–280ms travel time (5 upgrade levels, costs: 50→120→300→750→1800)
- 4 cosmetic car models (Standard, Glass Express, Executive Gold, Quantum Penthouse)
  - Models gated by prestige token count (0/1/2/3)
  - Bonus tip percentage: 0% / 15% / 35% / 60%
- Breakdown triggers after every 25–35 passengers; blocks all movement

### Economy
- Coins earned per trip; base fare modified by business type multipliers
- Tips earned on delivery; rate modified by passenger type and rating
- Investor boost: +50% fare surge for a timed period
- Service combo: each consecutive served passenger adds bonus (up to +40% at x10)
- Offline earnings: coins and tips accrue while away (60% efficiency for rent, 8h cap)
- Prestige multiplier: each prestige token adds +20% permanent coins & tips

### Shops
- 5 tenant slots (floors 1–5); floors 3–5 locked until purchased
- Floor unlock costs: Floor 3 = 800 coins, Floor 4 = 2000 coins, Floor 5 = 4500 coins
- Each floor has a Standard and Premium ad-upgrade tier
- 6 business types: Cafe, Shopping, Office, Gym, Entertainment, Luxury
- Each type has distinct visitorFrequency, coinMultiplier, tipMultiplier, rentMultiplier, ratingImpact
- Contracts have configurable contractTime and gracePeriod; rent collected every 6 s
- Shop state (active, contractTime, businessType) persisted in save data

### Rating
- Building rating range: 1.0–5.0 (default start: 3.5)
- Increases per successful delivery (amount varies by passenger type)
- Drops on walkouts; low rating blocks VIP/Celebrity spawns
- Ad: watch rewarded video to restore rating to 5.0 instantly

### Upgrades
- Capacity: 5 levels (values: 2/3/4/5/6/8 passengers)
- Speed: 5 levels (values: 850/720/600/480/380/280ms)
- Both shown in a pinned bottom upgrade panel with live cost display

### Breakdown
- Random threshold of 25–35 passengers triggers breakdown
- Shows "OUT OF ORDER" banner and modal
- Options: timed manual repair or instant repair via rewarded ad

### Operator
- Auto-operates elevator for a timed duration
- Activated by watching a rewarded ad (+60 s boost)
- Browser fallback: +60 s granted directly without ad
- Status shown in HUD (Auto: ON / OFF)

---

## UI

- Pinned top HUD: coins, tips, rating, operator status, sound toggle
- Mission banner sub-header (pinned, tappable, shows first active mission progress)
- Active random event banner (pinned, shown only during event)
- Dev random event trigger button (top-left, for testing)
- Missions modal: 3 slots with progress bars, CLAIM / ACTIVE buttons
- HQ Management modal: lifetime stats, elevator model selector, prestige button
- Offline earnings modal: away time summary, COLLECT and 2x ad buttons
- Shop ad modal: ad tiers per floor shown as purchasable cards
- Breakdown modal: timed repair + instant-repair ad option
- Floor buttons: per-floor call buttons visible when passengers are queued
- Floating text system: contextual pop-up feedback for events and rewards
- Procedural pixel-art passenger sprites generated at runtime (16x30px)
- Mechanic sprite (hi-vis vest + yellow hardhat) for repair animations
- Free touch-scroll: vertical camera pan between floors

---

## Ads

- AdMob integration via @capacitor-community/admob v8
- App publisher ID: ca-app-pub-7809965112838039
- Single rewarded ad unit used for all placements: 5774818818
- Ad placements:
  1. Operator boost (+60 s automation)
  2. Instant elevator repair
  3. Rating restore to 5.0
  4. 2x offline earnings multiplier
- isTesting: false — live ads in production
- Browser fallback: all ad paths grant the reward immediately without showing an ad

---

## Save System

- Storage key: elevator_idle_save (localStorage)
- Auto-save every 5 seconds; also saved on ad reward, upgrade, and prestige
- Fields persisted:
  - coins, tips, buildingRating, isAudioMuted
  - unlockedFloors, capacityLevel, speedLevel
  - skyscraperLevel, prestigeTokens
  - totalPassengersServedLifetime, totalCoinsEarnedLifetime
  - specialPassengersTransported, maxServiceComboLifetime
  - currentElevatorModelIndex
  - lastSavedTimestamp (used for offline earnings calculation)
  - activeMissions (3-element array), consecutiveNoWalkout
  - shops (per-floor: name, desc, active, contractTime, rent, tier, businessType)
- Load guard: buildingRating clamped to minimum 1.5 on load
- Missing fields fall back to defaults (no hard failures)
- activeMissions validated as a 3-element array on load; re-initialised if invalid
