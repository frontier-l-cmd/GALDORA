# GALDORA

GALDORA game development and browser preview.

## Play pilot 001

https://frontier-l-cmd.github.io/GALDORA/

A short, original horizontal-shooter art and motion prototype. This is not the complete game.

- Click **出撃する** to start manual play.
- Move: arrow keys or WASD. Hold Z: fire. X: burst when the gauge is full.
- P / Escape: pause or resume. Enter: restart.
- The initial demo mode flies automatically and is invincible. Uncheck it for manual play.
- **ボスの動きを見る** jumps to the boss.

## Current scope

320×224 Canvas 2D, fixed 60Hz simulation, three player poses, one enemy, a bird-machine boss with separate wings, two-layer backgrounds, a shortened 30-second approach, and a clear screen. The graphics are original AI-generated artwork prepared to a shared palette of at most 64 colors and at most 16 colors per actor.

The deployable game is self-contained in `docs/index.html`, including its JavaScript and PNG data. No build step, server, or external runtime dependency is required.

Useful timeline and aimed/fan bullet logic was adapted from this account's [SECTOR NOVA 2](https://github.com/frontier-l-cmd/Sector-Nova2/tree/305ac1b6cd90f4c6a3ee139153b8f5443be09eea/sector-nova-2/src). The new game uses its own horizontal layout, artwork, capped pools, and seeded simulation.

## Not finished yet

The full nine-stage campaign, route selection, weapon growth, difficulty settings, saved records, BGM, mobile controls, and gamepad support are not implemented in this pilot. Art contrast, scrolling seams, balance, and sound still need refinement. Chrome was tested; other browsers and devices remain to be checked.
