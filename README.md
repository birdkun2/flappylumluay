# FLAPPY LUMLUAY

A small, static Phaser game starring Lumluay. No backend, accounts, APIs, or external fonts/audio.

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

Background uses alternating mirrored, uniformly scaled copies to join matching edges indefinitely without stretching. Source sheets are optimized without resizing during the asset build; the shaft/background still tile at runtime.

No audio in v1. A scene `score` event is available for future sound effects.


## Lossless size optimization

`npm run dev` and `npm run build` automatically generate optimized assets and a lean Phaser engine. `sharp` is a build-only dependency; no additional runtime dependency is shipped.

- `scripts/optimize-assets.mjs` keeps configured source rectangles (plus an 8-pixel sampling gutter) in lossless WebP sheets, without resizing, palette reduction, or lossy encoding. Sheet dimensions and frame coordinates stay unchanged; unused regions become transparent. It decodes every output and verifies byte-for-byte RGBA equality, including transparent pixels. A mismatch fails the build.
- Original PNGs remain in `public/assets/` and the project root. Only `.generated/public/` is copied to `dist`; original source sheets are not downloaded by players.
- Crop definitions remain in `src/game/config.js`. Restart `npm run dev` after changing crops or source artwork to rebuild the optimized sheets.
- `src/game/phaser-entry.js` uses Phaser core plus the Container, TileSprite, and Rectangle factories. Both Canvas and WebGL rendering remain available. Unused physics, particles, tilemaps, and sound are omitted. Add the appropriate Phaser module there if a future feature needs it.
- `.generated/` is disposable build output and is ignored by Git. Deploy exactly as before; no GitHub Pages settings need changing.

Measured release size: approximately **3.38 MB**, down from **8.19 MB** (about **59% smaller**), before HTTP compression. Maximum-effort lossless encoding can take roughly a minute during startup/build; it does not add runtime work or affect gameplay.
