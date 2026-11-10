# GALDORA

Original side-scrolling shooter, in development.

**Play:** https://frontier-l-cmd.github.io/GALDORA/

## Build 003 · Stage One

This is a playable development milestone, not the finished game or final Stage 1 artwork/balance.

### Changes in this build

- Boss attacks now take turns. A fixed aim warning precedes a slower 3/3/5-shot fan; wing fire uses separately warned horizontal lanes. Once bullets leave, there is a full second of recovery before another attack. Beam warnings clear leftover bullets and keep their 1.5-second warning.
- The ship remains visible during invulnerability, with blinking brackets and a small bright collision-center marker.
- Shot and shield pickups now have distinct machined-metal triangular and hexagonal silhouettes, beveled edges and bright cores.
- Revised original player art in three banking poses.
- A manual **ボス戦を練習（手動）** button starts a normal, vulnerable Lv1 / no-shield encounter. Practice is unranked. The separate preview remains automatic and invincible.
- Touch steering now responds to stick displacement rather than snapping to full speed. Touch layout reserves more vertical room for controls.
- Optional, separate original stage/boss BGM and effects switches. Music pauses and stops with the game. Audio is off until enabled.

### Current playable scope

- A 180-second approach in six authored sections, followed by Sky Warden.
- Five enemy behaviors: wave, straight flight, telegraphed locked-target rush, stopping shooter and item carrier.
- Carrier drops: shot chip (levels 1–3) and shield chip (up to three shields).
- Three lives, two-second invulnerability after a miss, one shot level lost on a miss, chain scoring and five-second burst power.
- Independently destructible boss wings and three health phases. Boss retreat after 120 seconds gives no boss kill/speed reward.
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

320×224 Canvas 2D, fixed 60 Hz simulation, deterministic seeded effects, bounded entity and audio pools. No external runtime dependencies, accounts, analytics or network requests during play. `docs/index.html` contains readable game modules, original synthesized score and eight runtime PNGs in one self-contained page. GitHub Pages uses the existing `/docs` publication route.

Useful motion systems were adapted from the author's SECTOR NOVA 2: frame-based timeline/formation expansion, aimed/fan angle math, short-tap retention and focus-safe input, warning-to-active attack states, locked-target rush sequencing, bounded gesture-unlocked audio and failure-tolerant score storage. Coordinates, graphics, stage data, pool handling, music and game rules are specific to GALDORA.

## Verification and remaining work

Build 003 automated checks passed: 36 logic cases / 76,963 checked simulation frames; 148 mock interface assertions; 252 renderer samples; 36,913 deterministic music/lifecycle checks; eight PNG palette/size/alpha checks. These counts are different types of checks, not user-play sessions.

A reactive simulation cleared 27 boss scenarios at Lv1, zero shields and no invincibility with no misses, across nine starting positions and three phases. This supports the existence of dodge paths; it does not prove human difficulty or mobile comfort. Actual Chrome manual input and real WebAudio checks are performed separately. Two 12-second music passages rendered without clipped or nonfinite samples; live stage/boss/pause/disable transitions cleaned up correctly. Subjective music listening is still pending.

**Not yet validated on physical phones or tablets.** Touch feel, multi-touch browser differences, Safari, gamepads, frame-time profiling and audio listening still need validation. The Stage 1 background, enemies and boss remain pilot artwork. Balance still needs player feedback.

Remaining scope includes final Stage 1 visuals and balance, music refinement, full five-level main weapon and subweapon systems, difficulties, route selection, the other eight stages and the complete campaign.
