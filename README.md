# GALDORA

Original side-scrolling shooter, in development.

**Play:** https://frontier-l-cmd.github.io/GALDORA/

## Build 004 · Stage One

This is a playable development milestone, not the finished game or final Stage 1 artwork/balance.

### Changes in this build

- The approach is shortened from 180 to 90 seconds, with six authored 15-second sections rather than simply doubling the enemy density.
- Destroyable drifting wreckage creates route and shooting choices. Each arrival has a 1.5-second edge warning. The layout leaves at least a 75-pixel continuous safe band; wrecks take four normal hits and cannot trap the player in an unavoidable wall.
- Boss core HP is halved from 360 to 180, wings from 40 to 22, and retreat timeout from 120 to 60 seconds. The approved attack sequence, aim warnings, bullet speeds and recovery windows are unchanged.
- Touch movement is more responsive: a small continuous radial deadzone replaces the former 20% axis deadzone, and touch top speed is 30% higher. PC speed is unchanged. Pointer gestures reuse their initial layout geometry and unchanged HUD values are no longer rewritten each frame.
- The page displays actual average rendering FPS, roughly once per second, to help identify device-specific performance. This is not a touch-latency measurement.
- Pickup art is now derived from two genuinely generated original concepts: a gold triangular reactor and a cyan hexagonal shield core. The prepared 20×20 sprites use the existing palette and binary transparency.
- Practice results are correctly labeled PRACTICE / UNRANKED.

### Current playable scope

- A 90-second approach in six authored sections, followed by Sky Warden.
- Five enemy behaviors: wave, straight flight, telegraphed locked-target rush, stopping shooter and item carrier.
- Carrier drops: shot chip (levels 1–3) and shield chip (up to three shields).
- Three lives, two-second invulnerability after a miss, one shot level lost on a miss, chain scoring and five-second burst power.
- Independently destructible boss wings and three health phases. Boss retreat after 60 seconds gives no boss kill/speed reward.
- Manual-run high scores save locally when browser storage is available. Demo, preview and practice cannot enter records.
- Adaptive touch UI: virtual stick, automatic shooting, burst/pause buttons, portrait/landscape arrangement and safe-area padding. Keyboard controls remain available.

## Controls

Start with **出撃する** or Enter. The initial attract demo is automatic and invincible.

| Action | Keyboard | Touch UI |
| --- | --- | --- |
| Move | Arrows / WASD | Left stick, with proportional movement |
| Shoot | Hold Z | Automatic |
| Burst | X with full meter | BURST |
| Pause / resume | P / Esc | Pause button |
| Restart stage | Enter / start button | Start button |

Touch UI is selected by a coarse pointer or touch interaction. **タッチ操作UI** also selects it manually. Blur and hidden tabs pause play. The small bright center of the ship shows its collision center. Boss aim locks before firing: move away from the shown trajectory rather than circling continuously.

## Implementation

320×224 Canvas 2D, fixed 60 Hz simulation, deterministic seeded effects, bounded entity and audio pools. No external runtime dependencies, accounts, analytics or network requests during play. `docs/index.html` contains readable game modules, original synthesized score and ten runtime PNGs in one self-contained page. GitHub Pages uses the existing `/docs` publication route.

Useful motion systems were adapted from the author's SECTOR NOVA 2: frame-based timeline/formation expansion, aimed/fan angle math, short-tap retention and focus-safe input, warning-to-active attack states, locked-target rush sequencing, bounded gesture-unlocked audio and failure-tolerant score storage. Coordinates, graphics, stage data, pool handling, music and game rules are specific to GALDORA.

## Verification and remaining work

Build 004 automated checks passed: 36 logic cases / 38,599 checked simulation frames; 10 obstacle/tempo cases; 196 mock interface assertions; 261 renderer samples; 36,913 deterministic music/lifecycle checks; ten PNG palette/size/alpha checks. These counts are different types of checks, not user-play sessions.

A reactive simulation cleared 27 boss scenarios at Lv1, zero shields and no invincibility with no misses, across nine starting positions and three phases. In a separate same-controller, no-burst comparison, boss completion changed from 73.27 to 39.55 seconds at Lv1, 36.40 to 19.60 at Lv2, and 31.97 to 16.45 at Lv3. This supports the existence of dodge paths; it does not prove human difficulty or mobile comfort. Actual Chrome manual input and real WebAudio checks are performed separately. Two 12-second music passages rendered without clipped or nonfinite samples; live stage/boss/pause/disable transitions cleaned up correctly. Subjective music listening is still pending.

**Build 004 has not yet been validated on physical phones or tablets.** The changes respond to user phone-play feedback on Build 003; mock and cloud Chrome results do not establish the new on-device feel. Touch feel, multi-touch browser differences, Safari, gamepads, frame-time profiling and audio listening still need validation. The Stage 1 background, enemies and boss remain pilot artwork. Simulated 30/60/90/120/144 Hz display schedules preserve 60 simulation updates per second. Mock tests also verify that 240 pointer moves perform no repeated layout read, and an unchanged paused HUD performs no repeated property/attribute writes (1080 in the old version versus zero in the same 120-frame harness). Balance still needs player feedback.

Remaining scope includes final Stage 1 visuals and balance, music refinement, full five-level main weapon and subweapon systems, difficulties, route selection, the other eight stages and the complete campaign.
