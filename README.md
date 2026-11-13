# GALDORA

Original side-scrolling shooter, in development.

**Play:** https://frontier-l-cmd.github.io/GALDORA/

## Build 008 · Branch boss patterns

- AMBER adds telegraphed wing crossfire; COBALT adds a moving bullet gate with a marked safe lane. Existing boss sprites are still provisional and shared.
- New volleys wait for previous bullets to clear, then recover. Stage 1 and boss HP are unchanged.
- Use **空域ボスだけ** / **遺構ボスだけ** for direct unranked boss trials. In-game route selection and full-route debug remain available.
- Automated simulation, warning/cleanup, renderer and interface checks pass. Real-device feel and human difficulty still need playtesting.

## Build 005 · Stage One

A playable development milestone, not the finished game or final Stage 1 artwork/balance.

### Changes in this build

- Presentation interpolates between fixed 60 Hz simulation steps. Half-world-pixel placement and a fixed 640×448 canvas backing make motion finer without changing the 320×224 world, ship speed, collision rules or attack timing. The backing does not grow with device pixel ratio.
- Player, enemy, projectile and fragment presentation uses bounded reusable pose records. Restarts, pause, focus changes, recycled pool slots and teleports reset or snap their histories instead of leaving trails or jumps.
- A lethal boss hit now starts a 2.7-second finale: reactor failures, falling/tilting armor, detached wings, a final explosion and dispersing fragments. The result panel appears only after the body and debris have disappeared.
- Hostile objects are cleared during the finale. The player cannot take a post-kill hit. Kill rewards are granted once, with the speed bonus calculated at the lethal hit rather than after the animation. Previously destroyed wings do not reappear or score twice.
- Four optional synthesized defeat cues accompany the sequence. BGM yields during the defeat and the clear sting waits for the result. Pause/restart and mute clean up the audio.
- **撃破演出をプレビュー** previews the finale immediately without recording a high score.

Build 004's 90-second approach, destroyable wreckage, generated pickup designs, improved touch response and shortened boss fight remain in place. The approved attack warnings, bullet speeds, recovery windows and boss HP are unchanged in Build 005.

### Current playable scope

- Six authored 15-second approach sections, then Sky Warden.
- Five enemy behaviors: wave, straight flight, locked-target rush, stopping shooter and item carrier.
- Destroyable drifting wreckage with advance edge warnings and open travel lanes.
- Shot chips (levels 1–3), shield chips (up to three shields), three lives, post-hit invulnerability, chain scoring and burst power.
- Independently destructible boss wings and three health phases. Retreat after 60 seconds grants no boss kill or speed reward and does not play the kill finale.
- Manual-run high scores saved locally when browser storage is available. Demo, preview and practice are unranked.
- Adaptive touch controls: proportional stick, automatic fire, burst/pause buttons, portrait/landscape layout and safe-area padding. Keyboard controls remain available.

## Controls

Start with **出撃する** or Enter. The initial attract demo is automatic and invincible.

| Action | Keyboard | Touch UI |
| --- | --- | --- |
| Move | Arrows / WASD | Left stick |
| Shoot | Hold Z | Automatic |
| Burst | X with full meter | BURST |
| Pause / resume | P / Esc | Pause button |
| Restart | Enter / start | Start button |

Touch UI is selected by coarse pointer or touch interaction; **タッチ操作UI** also selects it manually. Leaving the tab pauses play. The ship's small bright center marks its collision center.

## Build and test

The repository now includes the editable modules, HTML template and focused regression tests, alongside the self-contained published page.

Requires Node.js with ES module support. No package installation is needed.

```sh
npm test
npm run bundle
```

`npm test` prepares the ten runtime PNG files from the checked-in `docs/index.html` archive if they are absent, then runs simulation/renderer, boss-finale, presentation, mock-interface and mock-audio checks. `npm run bundle` writes `docs/index.html` and `GALDORA-pilot.html` from `src/`, `index.html` and the prepared assets. To inspect the modular development page, prepare assets and serve the repository with a local static HTTP server. The bundled page can also be opened directly.

GitHub Pages continues to publish `/docs`. Existing assets are not overwritten by the extraction command, so edits in `assets/` are retained when bundling.

## Implementation

Canvas 2D, fixed 60 Hz simulation, deterministic seeded effects and bounded entity/audio pools. No external runtime dependencies, accounts, analytics or network requests during play. `docs/index.html` includes twelve readable game modules, the original synthesized score and ten runtime PNGs.

Useful systems were adapted from the author's SECTOR NOVA 2: frame-based timeline/formation expansion, aimed/fan angle math, short-tap retention and focus-safe input, warning-to-active attack states, locked-target rush sequencing, bounded gesture-unlocked audio and failure-tolerant score storage. Coordinates, art, stage data, pool handling, music and game rules are specific to GALDORA.

## Verification and remaining work

Build 005 checks pass:

- Full-course deterministic simulation/renderer regression: 19,134 simulated frames, 651 rendered samples, finite draw coordinates, balanced canvas transforms and ten PNG assets. This uses an invincible automated controller, not a human clear or a difficulty test.
- Ten boss-finale cases covering 1,661 fixed steps: timing, duplicate lethal hits, safe cleanup, one-time scoring, broken wings, retreat, restart, pause and unchanged balance values.
- Simulated 30/60/90/120/144 Hz display schedules preserve identical game physics; fractional presentation, pool reuse, history bounds and reset cases pass.
- Mock interface checks cover two pointers, cancellation, resize, blur, fixed canvas backing, FPS display, defeat input gating and restart.
- Mock WebAudio checks cover defeat cues, throttling, the 12-voice cap, mute, lifecycle cleanup, unavailable audio and independent BGM control. These do not establish subjective sound quality.

The bundled build was also operated in cloud Chrome: finale preview to result, keyboard movement/pause, touch-control selection and stick/pause input. Deterministic visual fixtures confirmed separated wings, absent boss body after the final explosion, and no early result panel. This is separate from automated simulation testing.

**Build 005 has not been validated on physical phones or tablets.** Actual mobile smoothness, Safari, simultaneous physical touches, frame-time stability and listening quality still need device testing. Interpolation improves visual sampling but can add up to one 60 Hz tick (16.7 ms) of display delay; it is not a measured input-latency improvement. The fixed backing resolution bounds rendering cost, but does not guarantee every device's frame rate.

Remaining scope includes final Stage 1 visuals and balance, music refinement, full five-level main weapon and subweapon systems, difficulty options, route selection, the other eight stages and the complete campaign.

## Build006 — branching trial (2026-11-12)

After Stage1, choose AMBER SKYWAY (open sky/formations) or COBALT RUINS
(wreckage/sentries). Each has a 60-second approach. Lives, equipment, burst and
score carry over; clearing Stage2 ends this two-stage trial. Route selection has
no timer and supports buttons/touch/keyboard focus. Stage2 bosses reuse existing
art and the approved attack balance; unique bosses and the full nine-stage
campaign are still future work. High scores use a new campaign-specific key.

`npm test` covers legacy movement/audio/defeat plus route carryover, arrival,
completion, invalid transitions, and UI selection/restart.

## Build007 — direct route practice / in-screen selection
Stage2 routes have direct manual trial buttons (3 lives, LV2, shield1, unranked).
Normal play still starts Stage1 and preserves earned equipment. The route chooser
is now overlaid within the game screen, avoiding a page scroll after the boss.
