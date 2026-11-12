# GALDORA Build006 scope

Design source: https://app.notion.com/p/414568384ec3819a8794e717e080dac6

2026-11-12 user approved Build005 improvements and requested next development.
Build006 implements the first branching vertical slice: Stage1 then one of two
short Stage2 routes. This is a two-stage trial, NOT the complete nine-stage game.
Route selection is deliberately untimed for the mobile prototype; the full-game
10-second selector remains future work. Preserve lives, power, shield, burst and
score across stages. Preserve responsive input, interpolation, short pacing,
fair boss warnings and the existing defeat sequence. No new purchased assets or
external services. Publish to existing docs/ GitHub Pages after tests.

Build007: user requested no-scroll in-screen route selection and direct Stage2
practice. Selector is inside .screen; each route has a direct manual trial button.
Trial begins with 3 lives, LV2 and shield1; no high-score writes. Normal Stage1
and earned carryover are unchanged. Mobile/landscape layout uses compact controls.
