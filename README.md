# GALDORA

Original side-scrolling shooter, in development.

**Play:** https://frontier-l-cmd.github.io/GALDORA/

## Build 002 · Stage One

This is a playable development milestone, not the finished game or final Stage 1 artwork/balance.

- A 180-second approach in six authored sections, followed by the Sky Warden encounter.
- Five enemy behaviors: wave, straight flight, telegraphed locked-target rush, stopping shooter, and item carrier.
- Carrier drops: triangular shot chip (levels 1–3) and hexagonal shield chip (up to three shields).
- Three lives, two-second invulnerability after a miss, one shot level lost on a miss, chain scoring, and five-second burst power.
- Independently destructible boss wings, three health phases, and a locked-lane beam with a 1.5-second warning. Boss retreat after 120 seconds gives no boss kill/speed reward.
- Optional original synthesized effects. Manual-run high scores save locally when browser storage is available. Demo and boss previews cannot enter records.
- Initial adaptive touch UI: virtual stick, automatic shooting, burst/pause buttons, portrait/landscape arrangement, safe-area padding. Keyboard controls remain available.

## Controls

Start with **出撃する** or Enter. The initial attract demo is automatic and invincible.

| Action | Keyboard | Touch UI |
| --- | --- | --- |
| Move | Arrows / WASD | Left stick |
| Shoot | Hold Z | Automatic |
| Burst | X with full meter | BURST |
| Pause / resume | P / Esc | Pause button |
| Restart stage | Enter / start button | Start button |

Touch UI is selected by a coarse pointer or touch interaction. The **タッチ操作UI** checkbox can also select it manually. Blur and hidden tabs pause play. The boss-preview button is an unranked, invincible test mode.

## Implementation

320×224 Canvas 2D, fixed 60 Hz simulation, deterministic seeded effects, bounded enemy/bullet/effect/item pools. No external runtime dependencies, accounts, analytics, or network requests during play. `docs/index.html` contains readable game modules and the eight runtime PNGs in one self-contained page. GitHub Pages continues using the existing `/docs` publication route.

Useful motion systems were adapted from the author's SECTOR NOVA 2: frame-based timeline/formation expansion, aimed/fan angle math, short-tap retention and focus-safe input, warning-to-active attack states, locked-target rush sequencing, bounded gesture-unlocked audio, and failure-tolerant score storage. Coordinates, graphics, stage data, pool handling and game rules are specific to GALDORA.

## Verification and remaining work

Logic regression checks cover the full course, deterministic replay, item/miss rules, pool caps, boss phases/parts/beam timing/retreat, and duplicate kill rewards. Mock interface checks cover keys, pointer cancellation, simultaneous stick/burst pointers, audio limits, storage failure and responsive sizing. Actual Chrome operation checks are separate from those mocks.

**Not yet validated on physical phones or tablets.** Touch feel, multi-touch browser differences, Safari, gamepads, frame-time profiling and audio listening still need validation. The graphics are the original pilot set with clearer status/attack/item rendering, not the final art pass.

Remaining scope includes final Stage 1 visual/balance work, music, full five-level main weapon and subweapon systems, difficulties, route selection, the other eight stages and the complete campaign.
