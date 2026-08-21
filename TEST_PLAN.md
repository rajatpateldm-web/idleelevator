# Elevator Idle - Browser & System Test Plan

This document defines the functional test checklist and verification protocol for the Elevator Idle game.

---

## 1. Core Systems

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **COR-01** | Initial Game Boot | Open `http://localhost:8080` in browser | Game canvas loads centered at 360x640, HUD and ground lobby visible | [ ] Pass |
| **COR-02** | Zero Console Errors | Open browser DevTools Console on startup | Zero uncaught exceptions, 404s, or broken module import errors | [ ] Pass |
| **COR-03** | Fresh Game State | Clear `localStorage` and reload | Starts with 0 coins, 0 tips, Rating 3.5⭐, Floors 0-2 unlocked | [ ] Pass |
| **COR-04** | Save Persistence | Earn coins/tips, wait 5s for auto-save, reload | Exact coin, tip, rating, and floor state restored from `elevator_idle_save` | [ ] Pass |
| **COR-05** | Save Versioning Migration | Load legacy save without `saveVersion` | Migrates to `saveVersion: 1` seamlessly without data loss | [ ] Pass |
| **COR-06** | Audio Unlocking | Click/tap anywhere on game canvas | Web Audio context unlocks; sound effects play on actions | [ ] Pass |

---

## 2. Elevator System

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **ELV-01** | Floor Button Dispatch | Click `F1`, `F2`, or `G` floor buttons | Elevator car closes doors, moves smoothly via tween, arrives at target floor | [ ] Pass |
| **ELV-02** | Vertical Cable Sync | Observe elevator during transit | Elevator cable dynamically resizes from roof (Y=100) to car position | [ ] Pass |
| **ELV-03** | Door Mechanism | Observe elevator at floor stop | Left and right doors slide open; close prior to departure | [ ] Pass |
| **ELV-04** | Passenger Boarding | Move elevator to Floor 0 with queued passengers | Up to car capacity board; passenger figures reposition inside lift | [ ] Pass |
| **ELV-05** | Multi-Passenger Transit | Carry multiple passengers to different floors | Car stops and disembarks passengers only at their respective target floors | [ ] Pass |
| **ELV-06** | Capacity Enforcement | Queue 4 passengers with Lv.1 Capacity (2 max) | Exactly 2 board; remaining 2 wait in queue; capacity LED lights green/red | [ ] Pass |
| **ELV-07** | Capacity Upgrade | Purchase Capacity upgrade in bottom panel | Elevator capacity increases (2 -> 3 -> 4...); HUD/LED reflects upgrade | [ ] Pass |
| **ELV-08** | Speed Upgrade | Purchase Speed upgrade in bottom panel | Elevator move duration decreases (850ms -> 720ms -> 610ms...); car moves faster | [ ] Pass |

---

## 3. Passenger Lifecycle

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **PAS-01** | Spawner Loop | Wait 3.4s at ground lobby | Passenger entity spawns on left and walks to queue or coffee kiosk | [ ] Pass |
| **PAS-02** | Lobby Queue Stacking | Allow multiple passengers to spawn | Passengers queue linearly behind elevator entrance with target floor tags | [ ] Pass |
| **PAS-03** | Patience Decay & Bar | Observe queued passenger over time | Green patience bar decays; turns orange/red as wait time decreases | [ ] Pass |
| **PAS-04** | Staircase Walkout | Let passenger patience expire to 0 | Angry emoji displays; passenger walks down stairs to exit; Rating -0.10⭐ | [ ] Pass |
| **PAS-05** | Destination Arrival | Move passenger to their target floor | Passenger walks from elevator into the commercial shop unit | [ ] Pass |
| **PAS-06** | Commercial Dwell | Observe passenger inside shop | Dwells for business duration (7-10s); destination tag flips to 'G' | [ ] Pass |
| **PAS-07** | Return Ride & Payout | Transport return passenger down to Floor 0 | Passenger exits lobby; awards ride coins, tip roll, rating bonus, combo +1 | [ ] Pass |
| **PAS-08** | Special Archetypes | Observe VIP / Celebrity / Rusher / Investor | Displays distinct textures, custom badges, tip multipliers, and surge bonuses | [ ] Pass |

---

## 4. Economy & Progression

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **ECO-01** | Coin Accumulation | Complete rides, rent ticks, kiosk sales | Coin balance increments accurately with floating `+X 💰` text | [ ] Pass |
| **ECO-02** | Tip Accumulation | Transport happy passengers with high patience | Tips awarded based on archetype ranges; tip audio chime plays | [ ] Pass |
| **ECO-03** | Passive Rent Collection | Observe leased shop floors every 6s | Floating `+X 💰 Rent` appears; total coins increment by shop rent value | [ ] Pass |
| **ECO-04** | Upgrade Deductions | Click Upgrade Capacity or Speed with sufficient coins | Coins deducted; upgrade level increments; save updated | [ ] Pass |
| **ECO-05** | Insufficient Funds | Click Upgrade with insufficient coins | Upgrade blocked; red error feedback `Need X 💰` displays | [ ] Pass |
| **ECO-06** | Floor Construction | Click locked floor construction banner with required coins | Deducts coins; unlocks floor; builds shop slot; adds new floor call button | [ ] Pass |
| **ECO-07** | Offline Idle Earnings | Leave game for >45s and reload | "Welcome Back" modal appears with estimated passengers, coins, and tips | [ ] Pass |

---

## 5. Building, Commercial Shops & Rating

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **BLD-01** | Vacant Slot Interaction | Click "Vacant Commercial Unit" on unlocked floor | Advertising & Leasing modal opens with Standard and Digital tiers | [ ] Pass |
| **BLD-02** | Lease Signing | Purchase Standard Flyer tenant contract | Shop activates with business type, 6s rent timer, and commercial visuals | [ ] Pass |
| **BLD-03** | Rating Requirement | Attempt Digital Campaign with Rating < 2.5⭐ | Digital Campaign button locked with `Needs 2.5+ ⭐` notice | [ ] Pass |
| **BLD-04** | Reputation Scaling | Complete successful rides vs. walkouts | Rating increments on happy trips; decays on walkouts; clamped 1.0–5.0⭐ | [ ] Pass |
| **BLD-05** | Tenant Departure | Drop rating to 1.0⭐ past grace period | Tenant departs due to low rating; slot reverts to vacant | [ ] Pass |

---

## 6. Automation, Wear & Breakdown

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **AUT-01** | Operator Hire | Click `👷 HIRE` (40 💰) in bottom panel | Operator activates for 30s; auto-dispatches lift to waiting queues | [ ] Pass |
| **AUT-02** | Operator Priority AI | Queues on Ground and Floor 2 with Operator ON | Operator prioritizes floor with largest waiting queue or onboard destinations | [ ] Pass |
| **AUT-03** | Elevator Wear Limit | Transport 25–35 passengers | Breakdown triggers; alarm sounds; banner `⚠️ OUT OF ORDER` flashes | [ ] Pass |
| **AUT-04** | Standard Coin Repair | Click Standard Repair (25 💰, 18s) in modal | Mechanic walks to elevator with animated wrench; repairs in 18s | [ ] Pass |
| **AUT-05** | Lift Restoration | Allow repair countdown to reach 0 | Elevator restored to operational state; wear counter resets to 0 | [ ] Pass |

---

## 7. Advertisements & Rewarded Fallbacks

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **ADS-01** | Browser Boost Fallback | Click `🎬 BOOST` in browser mode | Fallback triggers without error; awards `+60s` Operator automation | [ ] Pass |
| **ADS-02** | Instant Repair Fallback | Click `⚡ FAST FIX (Watch Ad)` during breakdown | Instantly completes repair; mechanic exits; elevator restored immediately | [ ] Pass |
| **ADS-03** | PR Stunt Rating Reset | Click `PR Stunt (Watch Ad)` in Advertising modal | Restores Skyscraper Rating to `5.0 ⭐` and spawns immediate bonus visitor | [ ] Pass |
| **ADS-04** | 2X Offline Doubler | Click `Watch Ad (2X)` on Offline Earnings modal | Doubles collected offline coins & tips and credits player balance | [ ] Pass |
| **ADS-05** | Android Native AdMob | Run on Android device with Capacitor | AdMob rewarded video loads and triggers native reward callback on complete | [ ] Pass |

---

## 8. Development Mode (Sandbox Tools)

| Test ID | Test Case | Action / Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| **DEV-01** | Dev Mode Toggle | Set `DEV_CONFIG.ENABLED = true` or `?dev=true` | Compact `🛠️ DEV MODE` button appears in top HUD | [ ] Pass |
| **DEV-02** | Dev Mode Isolation | Set `DEV_CONFIG.ENABLED = false` and remove `?dev` | Dev button and panel are completely hidden from UI | [ ] Pass |
| **DEV-03** | Economy Controls | Click `+100 Coins` / `+100 Tips` in Dev Panel | Instantly credits 100 coins/tips and updates HUD | [ ] Pass |
| **DEV-04** | Passenger Controls | Click `Spawn VIP` / `Clear All` in Dev Panel | Spawns VIP entity or flushes all active passengers immediately | [ ] Pass |
| **DEV-05** | Elevator Controls | Click `Move F2` / `Fill Elevator` in Dev Panel | Dispatches elevator or fills car to max capacity instantly | [ ] Pass |
| **DEV-06** | Save & Time Controls | Click `Sim +10 Min` / `Export Save` | Advances simulation by 10m or exports save JSON to clipboard/console | [ ] Pass |
