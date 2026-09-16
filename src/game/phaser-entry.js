// Phaser's supported core entry omits unused physics / tilemaps / particles.
// Add only the extra factories and math helpers this game actually uses.
import Phaser from 'phaser/src/phaser-core.js';
import 'phaser/src/gameobjects/container/ContainerFactory.js';
import 'phaser/src/gameobjects/tilesprite/TileSpriteFactory.js';
import 'phaser/src/gameobjects/shape/rectangle/RectangleFactory.js';
import Clamp from 'phaser/src/math/Clamp.js';
import Linear from 'phaser/src/math/Linear.js';

Phaser.Math.Clamp = Clamp;
Phaser.Math.Linear = Linear;
export default Phaser;
