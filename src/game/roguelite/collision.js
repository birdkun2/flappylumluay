import { CONFIG as C } from '../config.js';
import { obstacleParts } from '../obstacles.js';
export function rogueCollision(player, pair, scale = 1) {
  const rectangles = [...obstacleParts('top', 0, pair.gap - pair.gapSize / 2), ...obstacleParts('bottom', pair.gap + pair.gapSize / 2, C.GROUND_Y)];
  return rectangles.some(({ y, height, width, inset }) => height > 0
    && player.x + C.HITBOX_WIDTH * scale / 2 > pair.x - (width - inset * 2) / 2
    && player.x - C.HITBOX_WIDTH * scale / 2 < pair.x + (width - inset * 2) / 2
    && player.y + C.HITBOX_HEIGHT * scale / 2 > y
    && player.y - C.HITBOX_HEIGHT * scale / 2 < y + height);
}
