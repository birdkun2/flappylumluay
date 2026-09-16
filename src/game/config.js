export const STATE = Object.freeze({ BOOT: 'BOOT', TITLE: 'TITLE', READY: 'READY', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' });

export const CONFIG = Object.freeze({
  WIDTH: 432, HEIGHT: 768, GROUND_Y: 712,
  GRAVITY: 1150, FLAP_VELOCITY: -365, MAX_FALL_SPEED: 640,
  OBSTACLE_SPEED: 145, OBSTACLE_GAP: 218, SPAWN_INTERVAL: 1650,
  DIFFICULTY_INCREMENT: 7, MAX_SPEED: 194,
  PLAYER_SCALE: 0.19, PLAYER_X: 140, PLAYER_Y: 344,
  HITBOX_WIDTH: 39, HITBOX_HEIGHT: 43,
  OBSTACLE_WIDTH: 92, OBSTACLE_INSET: 9, SHAFT_WIDTH: 43,
  GAP_MIN: 212, GAP_MAX: 490, MAX_GAP_CHANGE: 85,
  BACKGROUND_SPEED: 22, RESTART_DELAY: 850,
});

// Original image coordinates, in pixels. Never divide this sheet into equal cells.
// Character: 2172 × 724. Each pose retains its native aspect ratio.
export const CHARACTER_FRAMES = {
  idle: [22, 195, 339, 370],
  flap: [377, 162, 320, 396],
  glide: [711, 211, 344, 351],
  fall: [1070, 230, 363, 330],
  tired: [1440, 211, 346, 382],
  hit: [1792, 174, 360, 410],
};

// All obstacle art measurements, in original 1536 × 1024 image pixels.
// Ends are uniformly scaled to OBSTACLE_WIDTH and NEVER scaled to height.
// The separate user-supplied pattern repeats only inside the middle shaft.
export const OBSTACLE_ART = {
  frames: {
    hangingCap: [876, 9, 348, 46],
    hangingTip: [920, 575, 258, 131],
    standingCap: [338, 18, 300, 222],
    standingBase: [257, 828, 460, 188],
  },
  shaftPattern: {
    texture: 'shaftPattern', frame: 'repeat',
    // One diamond column and one full vertical repeat in the 887 × 1774 PNG.
    crop: [0, 14, 443, 554],
  },
  top: { cap: 'hangingCap', end: 'hangingTip' },
  bottom: { cap: 'standingCap', end: 'standingBase' },
  seamOverlap: 1, // Logical pixels hidden underneath each decorative join.
  shaftHitboxInset: 3,
};
export const ASSETS = {
  character: 'character.png', background: 'background.png',
  obstacle: 'obstacle.png', logo: 'logo.png', shaftPattern: 'shaft-pattern.png',
};
// Exclude the baked-in underground strip; the coded ground meets this horizon.
export const BACKGROUND_FRAME = [0, 0, 2172, 620];
