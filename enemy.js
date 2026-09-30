let enemies = [];
const ENEMY_ACTIVE_RADIUS = 20;
const ENEMY_CHASE_RADIUS = 8;
const ENEMY_CAP = 10;
let lastChunkKey = null;
let movesSinceSpawnCheck = 0;

// Land enemies stay on land, sea monsters stay in water.
function enemyCanEnter(domain, tile) {
  if (domain === 'sea') return tile.sailable;
  return tile.walkable && tile.type !== 'cave' && tile.type !== 'harbor';
}

function tileFreeForEnemy(nx, ny, self) {
  if (nx === player.x && ny === player.y) return false;
  if (findNpcAt(nx, ny)) return false;
  return !enemies.some(o => o !== self && o.x === nx && o.y === ny);
}

function addEnemy(x, y, domain, seed) {
  enemies.push({
    x, y, spawnX: x, spawnY: y, domain,
    sprite: domain === 'sea' ? 'seamonster' : 'enemy',
    variantSeed: seed
  });
}

function refreshEnemies() {
  const cx = Math.floor(player.x / CHUNK_SIZE), cy = Math.floor(player.y / CHUNK_SIZE);
  const key = cx + ',' + cy;
  if (key === lastChunkKey) return;
  lastChunkKey = key;

  enemies = enemies.filter(e =>
    Math.abs(e.x - player.x) < ENEMY_ACTIVE_RADIUS && Math.abs(e.y - player.y) < ENEMY_ACTIVE_RADIUS
  );

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const f = getChunkFeatures(cx + dx, cy + dy);
      const groups = [[f.enemySpawns, 'land'], [f.seaSpawns, 'sea']];
      for (const [list, domain] of groups) {
        for (const spawn of list) {
          if (!enemies.some(e => e.spawnX === spawn.x && e.spawnY === spawn.y)) {
            addEnemy(spawn.x, spawn.y, domain, Math.floor(hash2D(spawn.x, spawn.y, 7777) * 1000));
          }
        }
      }
    }
  }
}

// Keeps the world lively: a new enemy appears nearby every few steps.
// When you are in a boat, the new enemy is a sea monster.
function trySpawnRandomEncounter() {
  movesSinceSpawnCheck++;
  if (movesSinceSpawnCheck < 4) return;
  movesSinceSpawnCheck = 0;
  if (enemies.length >= ENEMY_CAP) return;
  if (Math.random() > 0.5) return;

  const domain = player.inBoat ? 'sea' : 'land';
  for (let attempt = 0; attempt < 14; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = randInt(6, 12);
    const ex = player.x + Math.round(Math.cos(angle) * dist);
    const ey = player.y + Math.round(Math.sin(angle) * dist);
    if (enemyCanEnter(domain, getTile(ex, ey)) && tileFreeForEnemy(ex, ey, null)) {
      addEnemy(ex, ey, domain, Math.floor(Math.random() * 1000));
      break;
    }
  }
}

function stepEnemies() {
  for (const e of enemies) {
    const dist = Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y));
    if (dist > ENEMY_CHASE_RADIUS) continue;

    let dx = Math.sign(player.x - e.x);
    let dy = Math.sign(player.y - e.y);
    if (Math.random() < 0.3) { dx = 0; dy = 0; }
    else if (dx !== 0 && dy !== 0) { if (Math.random() < 0.5) dx = 0; else dy = 0; }

    const nx = e.x + dx, ny = e.y + dy;
    if ((dx !== 0 || dy !== 0) && enemyCanEnter(e.domain, getTile(nx, ny)) && tileFreeForEnemy(nx, ny, e)) {
      e.x = nx; e.y = ny;
    }
  }
}
