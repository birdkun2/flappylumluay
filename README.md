# FLAPPY LUMLUAY

A small, static Phaser game starring Lumluay. No backend, accounts, APIs, or external fonts or audio downloads.

## Run locally

Use Node.js 24 LTS (minimum 22.12).

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Click, tap, or press **Space** to start and flap. Holding Space does not repeat. After a short game-over guard, the same controls restart. Switching away pauses a live run; the next input resumes it. Best score is stored locally when the browser permits it.

## Build and check

```sh
npm run check
npm test
npm run build
npm run preview
```

Deploy the contents of `dist/`. Preview through HTTP; do not open `index.html` as a `file://` URL. Vite uses `base: './'`, and Phaser loads assets relative to that base, so repository subpaths need no name hard-coding.

## Publish to GitHub Pages

1. Create a GitHub repository and push this project, including `package-lock.json` and `.github/workflows/deploy.yml`, to its `main` branch. Do not commit `node_modules` or `dist`.
2. In the repository, open **Settings â†’ Pages â†’ Build and deployment â†’ Source** and select **GitHub Actions**.
3. Open **Actions â†’ Deploy Flappy Lumluay â†’ Run workflow** (or push another commit to `main`).
4. Wait for the workflow to succeed. Open the deployed URL shown by the workflow or Settings â†’ Pages, normally `https://YOUR-NAME.github.io/YOUR-REPOSITORY/`.

If your branch has another name, change `branches: [main]` in the workflow. Later pushes rebuild and deploy automatically. The workflow follows the [official Pages Actions approach](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Important files and tuning

- `src/game/config.js`: all gameplay values, asset names, and explicit crop rectangles `[x, y, width, height]`.
- `src/game/BootScene.js`: asset loading, frame registration, flight animation.
- `src/game/GameScene.js`: title, ready transition, gameplay, game over, input, rendering.
- `src/game/rules.js`: collision, scoring, difficulty, safe gap generation, storage.
- `public/assets/`: byte-for-byte copies of the supplied artwork. Original root PNGs are untouched.

Tune `GRAVITY`, `FLAP_VELOCITY`, `OBSTACLE_SPEED`, `OBSTACLE_GAP`, `SPAWN_INTERVAL`, `DIFFICULTY_INCREMENT`, `MAX_SPEED`, and `PLAYER_SCALE` in config. Hitboxes are independent of changing poses. Logical canvas is 432 Ã— 768 and scales proportionally to fit phones and desktops.

### Artwork notes

Inspected originals: character and background **2172 Ã— 724**; obstacle and logo **1536 Ã— 1024**. Character has six unevenly spaced poses with transparent padding; its crops are explicitly named idle/flap/glide/fall/tired/hit. Normal flight uses the first three at 9 FPS; falling and death use dedicated frames. Logo has an opaque cream background, intentionally presented as a framed title card.

Obstacles are assembled by `src/game/obstacles.js` from three pieces: a fixed top cap, a tiled gold-patterned shaft, and a fixed bottom tip/base. Hanging and standing pillars use their own decorative ends. Only the shaft viewport changes with pillar height; the ends keep their aspect ratio and size. The shaft uses the supplied `shaft-pattern.png`; its motif repeats vertically without stretching. Inset rectangular collision bodies follow each piece. Physics, gap size, spawn timing, scoring, and speed progression are unchanged.

Decorative end crops live in **`OBSTACLE_ART.frames` in `src/game/config.js`**. The middle pattern crop is **`OBSTACLE_ART.shaftPattern.crop`**, as `[x, y, width, height]`, currently `[0, 14, 443, 554]` from the 887 ? 1774 image. The same object selects the ends for `top` and `bottom`, sets `seamOverlap`, and sets `shaftHitboxInset`. `CONFIG.OBSTACLE_WIDTH` and `CONFIG.SHAFT_WIDTH` control the displayed widths. Crops are registered in BootScene; rendering and collision share the same part layout so edits stay aligned. The original PNG remains untouched.

Background uses alternating mirrored, uniformly scaled copies to join matching edges indefinitely without stretching. Original PNG sheets are loaded directly; the shaft/background tile at runtime.

Quiet synthesized mew and pow effects play on flap and impact in both modes. The title-screen SOUND toggle persists in flappy-lumluay-sound. Effects use Web Audio after interaction and require no audio downloads. Tuning lives in src/game/soundEffects.js.


## Assets and startup

`npm run dev` starts Vite directly, and `npm run build` runs the standard Vite build. There is no image conversion or separate Phaser engine build before either command.

Images load directly from `public/assets/` as PNG files. Frame rectangles are registered from `src/game/config.js`, with no generated manifest. Vite copies the original images into `dist/assets/`. The game uses the installed Phaser package directly.

## Mode selection and Roguelite unlock

Title opens a mode menu. Normal preserves the original gameplay and quick restart. Use the Modes button (or Escape) to leave a run. Menus support mouse, touch, Tab, Enter and Space; Escape goes back. Roguelite starts its own run only after unlocking.

`src/game/progress.js` owns mode availability and persistence. The existing `flappy-lumluay-best` key is explicitly the Normal best, so old scores need no migration. A new best is saved during scoring; a single run of at least 100 unlocks Roguelite permanently from that score. Scores are not added across runs. `flappy-lumluay-roguelite-celebrated` records only whether the celebration has been shown. It appears after game over, or on returning to the menu if still pending; `roguelite-unlocked` is a sound-ready scene event. If browser storage is unavailable, progress survives within the current session only.

For manual testing, use a separate browser profile to protect your real score. In that profile's developer console, set `localStorage.setItem('flappy-lumluay-best', '63')` and refresh to check the locked card and 63/100 progress. Set it to `'100'` and refresh to check both selectable modes and Roguelite gameplay. Remove `flappy-lumluay-roguelite-celebrated` in the test profile to check the celebration once, then refresh to confirm it does not repeat. These are test save edits, not player-facing unlock controls.

Automated progress tests cover legacy saves, the 99/100 boundary, non-cumulative scores, persistent unlocks, progress clamping, one-time celebration, and unavailable storage. Roguelite gameplay is described below.

## Playable Roguelite

Normal's physics, collision, generation, difficulty and quick restart remain in GameScene and rules.js. RogueliteScene reuses the existing artwork, backdrop and input setup but owns a separate gameplay loop. No treasure chests are included. Permanent shop purchases raise the run level cap and replenish reroll/skip allowances.

- Tuning: src/game/roguelite/rogueliteConfig.js. Initial speed 210 (Normal 145), cruising speed increases up to 340, gap 186 (Normal 218), ordinary spacing 260 with a 230 minimum. Temporary shocks subtract exactly 100, so the lowest effective speed is 110. Challenge advances every 30 score, capped at six stages: 2 pixels less gap/spacing per stage, and modestly more needle patterns later.
- Patterns: tunnel, staircase up/down, wave, tight corridor, long corridor, needle, and recovery. Regular sequences contain 3-6 pairs; recovery contains 2. Long corridors contain 12 level pairs spaced 42 pixels apart, joining their 43-pixel shafts into a continuous wall. Their final pair restores ordinary outgoing spacing before the next pattern. Centers move at most 40 pixels per pair and stay between 230 and 475. Hard patterns never follow each other; a recovery is forced after three other patterns. Recovery/Lucky Path adjust the sequence chosen after a hard section, so the wider section follows that section spatially.
- Spatial spawning preserves exact distances, including fractional frame overshoot, through speed changes. Warnings count down for 2 active gameplay seconds before a 15-25% speed increase; permanent speed never decreases. Cooldown is 10-20 seconds, extended by Calm Rhythm. New warnings wait for the pattern's opening 2 seconds; newly selected hard patterns are blocked for 4 seconds after a shift. A separate random shock clock (18-30 seconds, suspended during other speed events) suddenly subtracts 100 speed for exactly 5 active gameplay seconds, then restores the exact pre-shock cruising speed. The HUD counts down to restoration. Shocks cannot overlap speed-up warnings. Pausing or choosing an upgrade freezes all clocks.
- Start at LV 1 and gain one level every 20 score, choosing one of three distinct blessings on each level-up. The initial cap is LV 10 (nine blessing opportunities, at scores 20-180). No more blessing screens appear at the cap; score and shop earnings continue. Selection weights are Common 65 / Rare 28 / Epic 7, renormalized for available rarities. Maxed blessings are excluded. If fewer than three remain, bounded temporary gifts fill the slots. Effects apply through UpgradeSystem.choose, independently of the UI, leaving a future reward-source integration point.
- Common: Light Body (gravity -5%, max 3), Strong Flap (+4%, max 3), Wider Path (+8 gap, max 2), Calm Rhythm (+3 seconds cooldown, max 3). Rare: Small Body (-8% hitbox, max 2), Shield (one charge, at most 3 purchases), Recovery (wider recovery after hard sections), Stable Wings (terminal fall speed/tilt reduction, max 2). Epic: Guardian Charm (one shield at each future 30 score), Lucky Path (more recovery), Flow State (next spawned gap +14 after 5 clean passes), Feather Step (every fourth flap +10%). Epic blessings have one stack.
- Shields hold at most one charge and give 1.25 seconds of protection after a hit; ground hits bounce back into play. Game over retains only a blessing summary and clears the run effects. Restart resets patterns, speed, upgrades and shields.
- Roguelite best is stored separately as flappy-lumluay-roguelite-best; it cannot alter Normal best or unlock progress.

Verification: npm run check, npm test, npm run build. Roguelite tests exercise 10,000 seeded obstacle pairs, transition bounds, recovery rules, speed-up warning timing, temporary shock timing/restoration, speed clamps, unique/capped choices, effects, collision and save separation. Browser checks cover 15/30/45/60/75/90 milestones, full freeze, shield consumption, keyboard/mouse/touch choice without an extra flap, restart resets and Normal isolation.

## Roguelite home, levels and shop

Selecting Roguelite opens its home/shop before starting a run. Each newly earned Roguelite score point immediately adds one spendable point; the run tracks already credited score to prevent duplicate awards. Normal scores and historical personal bests are not converted into currency. Wallet and purchases persist together in flappy-lumluay-roguelite-shop; if storage is unavailable they remain usable for the session.

Shop tuning and run level logic live in src/game/roguelite/metaProgress.js. Increase MAX LV by one for 50 points, then 100, 150, etc. Purchase one additional reroll per run for 100 points, up to 10; purchase one additional skip per run for 50 points, up to 10. Both allowances reset to the purchased amount each new run. A reroll consumes one charge and changes the three choices (avoiding previous choices when the available pool permits). Skip consumes one charge and forfeits that level's blessing. Neither changes the earned level. Choosing or skipping uses the existing 2-second preparation countdown. Run effects still reset every run.
