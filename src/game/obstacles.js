import { CONFIG as C, OBSTACLE_ART as ART } from './config.js';

// The same three rectangles drive rendering and forgiving collision bodies.
// Height changes affect only the shaft. Tiny future heights clip at the outer
// screen edge rather than shrinking or distorting the gap-facing decoration.
export function obstacleParts(kind, startY, endY) {
  const { cap, end } = ART[kind];
  const heightFor = frame => ART.frames[frame][3] * C.OBSTACLE_WIDTH / ART.frames[frame][2];
  const capHeight = heightFor(cap);
  const endHeight = heightFor(end);
  const capY = kind === 'top' ? Math.min(startY, endY - endHeight - capHeight) : startY;
  const endStart = kind === 'bottom' ? Math.max(endY - endHeight, startY + capHeight) : endY - endHeight;
  return [
    { frame: cap, y: capY, height: capHeight, width: C.OBSTACLE_WIDTH, inset: C.OBSTACLE_INSET },
    { frame: 'shaft', y: capY + capHeight, height: Math.max(0, endStart - capY - capHeight), width: C.SHAFT_WIDTH, inset: ART.shaftHitboxInset },
    { frame: end, y: endStart, height: endHeight, width: C.OBSTACLE_WIDTH, inset: C.OBSTACLE_INSET },
  ];
}

export function drawObstacle(scene, container, kind, startY, endY) {
  const parts = obstacleParts(kind, startY, endY);
  const shaft = parts[1];
  // Draw behind both ends. TileSprite changes its viewport height, not scaleY.
  if (shaft.height > 0) {
    const pattern = ART.shaftPattern;
    container.add(scene.add.tileSprite(0, shaft.y - ART.seamOverlap,
      shaft.width, shaft.height + ART.seamOverlap * 2, pattern.texture, pattern.frame)
      .setOrigin(0.5, 0).setTileScale(shaft.width / pattern.crop[2]));
    // Keep side outlines inside the shaft and tuck their ends under the caps.
    for (const x of [-shaft.width / 2, shaft.width / 2 - ART.shaftBorderWidth]) {
      container.add(scene.add.rectangle(x, shaft.y - ART.seamOverlap,
        ART.shaftBorderWidth, shaft.height + ART.seamOverlap * 2, ART.shaftBorderColor)
        .setOrigin(0, 0));
    }
  }
  for (const part of [parts[0], parts[2]]) {
    container.add(scene.add.image(0, part.y, 'obstacle', part.frame)
      .setOrigin(0.5, 0).setScale(part.width / ART.frames[part.frame][2]));
  }
}
