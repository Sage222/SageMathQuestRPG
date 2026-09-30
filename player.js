const player = {
  x: SPAWN_X, y: SPAWN_Y,
  hp: 20, maxHp: 20, xp: 0, gold: 0,
  steps: 0, enemiesSlain: 0,
  level: 1, correctStreak: 0,
  inBoat: false,
  moving: false,
  variantSeed: Math.floor(Math.random() * 1000)
};

const clearedCaves = new Set();

function tryMove(dx, dy) {
  if (player.moving || inBattle || dialogueOpen) return;
  const nx = player.x + dx, ny = player.y + dy;

  const npc = findNpcAt(nx, ny);
  if (npc) { talkTo(npc); return; }

  const enemyHere = enemies.find(e => e.x === nx && e.y === ny);
  if (enemyHere) { startBattle(enemyHere); return; }

  const tile = getTile(nx, ny);
  if (tile.walkable) {
    player.inBoat = false;      // stepping onto land or a bridge: leave the boat
  } else if (tile.sailable) {
    player.inBoat = true;       // stepping onto water: become a boat automatically
  } else {
    return;
  }

  player.x = nx;
  player.y = ny;
  player.steps++;
  player.moving = true;
  setTimeout(() => { player.moving = false; }, 120);

  onPlayerMoved();

  const caveKey = nx + ',' + ny;
  if (tile.type === 'cave' && !clearedCaves.has(caveKey)) {
    startBattle({ guardian: true, caveKey: caveKey, domain: 'land', x: nx, y: ny });
  }
}
