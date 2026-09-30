// Procedural world generation: everything is derived from (x, y) using
// deterministic noise, so the 1000x1000 map never needs to be stored.

const CHUNK_SIZE = 40;
const SPAWN_X = 492;
const SPAWN_Y = 492;
const SPAWN_SAFE_RADIUS = 4;
const SPAWN_CLEAR_RADIUS = 14;
const BORDER_WIDTH = 5;
const LAKE_THRESHOLD = 0.78;
const chunkFeatureCache = new Map();

const WANDERER_LINES = [
  "Lovely weather for a walk, don't you think?",
  "I heard strange noises from the old castle at night...",
  "Solve enough riddles and you'll be unstoppable, hero!",
  "Watch out for monsters near the rivers.",
  "Some caves hide a guardian AND a pile of treasure.",
  "Numbers are the true magic of this land, you know.",
  "Ten correct answers in a row levels you up. Keep going!",
  "Step onto the water and you'll sail off in a boat. Handy!",
  "The castle healers will patch you up for free.",
  "Follow the roads and you'll always find the next castle.",
];
const BOATMAN_LINES = [
  "Ahoy! The fish are biting today.",
  "Sea monsters lurk in the deep water. Keep your wits sharp!",
  "I sail these lakes every day. Never gets old.",
  "If you see a harbour, the harbour master can heal you.",
  "My boat has never sunk. Well... not fully.",
];
const GUARD_LINES = [
  "Halt! ...Oh, it's you. Welcome, traveler.",
  "The castle walls keep the monsters out. Mostly.",
  "I've counted the stones in this wall 4,096 times. Did you know 64 x 64 = 4,096?",
  "Careful of the creatures beyond the walls.",
];
const HEALER_LINES = [
  "You look tired, hero. Rest a moment.",
  "A healer's work is never done. Let me patch you up.",
  "Drink this. It tastes awful, but it works!",
];
const HARBOR_LINES = [
  "Welcome to the harbour! Rest here, then sail on.",
  "Fresh sea air heals all wounds. Sit a while.",
  "Boats come and go, but I stay put. Let me heal you.",
];

function hash2D(x, y, seed) {
  let h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x, y, seed, scale) {
  const sx = x / scale, sy = y / scale;
  const x0 = Math.floor(sx), y0 = Math.floor(sy);
  const x1 = x0 + 1, y1 = y0 + 1;
  const fx = sx - x0, fy = sy - y0;
  const v00 = hash2D(x0, y0, seed);
  const v10 = hash2D(x1, y0, seed);
  const v01 = hash2D(x0, y1, seed);
  const v11 = hash2D(x1, y1, seed);
  const ix0 = v00 + (v10 - v00) * fx;
  const ix1 = v01 + (v11 - v01) * fx;
  return ix0 + (ix1 - ix0) * fy;
}

function fractalNoise(x, y, seed) {
  let value = 0, amp = 0.6, freq = 1, total = 0;
  for (let i = 0; i < 4; i++) {
    value += smoothNoise(x * freq, y * freq, seed, 40) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value / total;
}

function getElevation(x, y) { return fractalNoise(x, y, WORLD_SEED); }
function getMoisture(x, y) { return fractalNoise(x, y, WORLD_SEED + 999); }
function getRiverValue(x, y) { return smoothNoise(x, y, WORLD_SEED + 555, 60); }
function getLakeValue(x, y) { return smoothNoise(x, y, WORLD_SEED + 321, 26); }

// Always-open start area. It also keeps the OLD start point (500,500) open and
// joined to the new one, so a leftover file from an older version can't trap you.
function inStartArea(x, y) {
  if (Math.abs(x - SPAWN_X) <= SPAWN_SAFE_RADIUS && Math.abs(y - SPAWN_Y) <= SPAWN_SAFE_RADIUS) return true;
  if (Math.abs(x - 500) <= 4 && Math.abs(y - 500) <= 4) return true;
  if (y >= SPAWN_Y - 1 && y <= SPAWN_Y + 1 && x >= SPAWN_X && x <= 500) return true;
  if (x >= 499 && x <= 501 && y >= SPAWN_Y && y <= 500) return true;
  return false;
}

function computeBiome(x, y) {
  if (x < BORDER_WIDTH || y < BORDER_WIDTH || x >= WORLD_SIZE - BORDER_WIDTH || y >= WORLD_SIZE - BORDER_WIDTH) {
    return 'mountain';
  }
  if (inStartArea(x, y)) return 'plains';

  const elevation = getElevation(x, y);
  if (elevation > 0.665) return 'mountain';
  if (getLakeValue(x, y) > LAKE_THRESHOLD) return 'water';

  const river = getRiverValue(x, y);
  if (Math.abs(river - 0.5) < 0.008 && elevation < 0.75) return 'river';
  if (elevation < 0.27) return 'water';
  if (getMoisture(x, y) > 0.6) return 'forest';
  return 'plains';
}

// Biome lookups are cached (1 byte per tile, ~1 MB total) so the minimap and
// renderer stay fast even though terrain comes from layered noise.
const BIOME_NAMES = ['plains', 'forest', 'mountain', 'water', 'river'];
const biomeCache = new Uint8Array(WORLD_SIZE * WORLD_SIZE);

function getBiome(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) return 'mountain';
  const idx = y * WORLD_SIZE + x;
  const v = biomeCache[idx];
  if (v) return BIOME_NAMES[v - 1];
  const b = computeBiome(x, y);
  biomeCache[idx] = BIOME_NAMES.indexOf(b) + 1;
  return b;
}

// walkable = on foot. sailable = the player automatically becomes a boat.
const WALKABLE = { plains: true, forest: true, river: false, water: false, mountain: false, castle: false, cave: true, harbor: true, road: true, bridge: true };
const SAILABLE = { water: true, river: true };

function hashChunk(cx, cy, salt) {
  return hash2D(cx * 991 + salt, cy * 997 + salt, WORLD_SEED);
}

function chunkPoint(cx, cy, i, salt) {
  return {
    x: cx * CHUNK_SIZE + Math.floor(hash2D(cx * 131 + i * 17 + salt, cy * 137 + i * 29, WORLD_SEED + 1) * CHUNK_SIZE),
    y: cy * CHUNK_SIZE + Math.floor(hash2D(cx * 149 + i * 31, cy * 151 + i * 13 + salt, WORLD_SEED + 2) * CHUNK_SIZE)
  };
}

function inInterior(x, y) {
  const m = BORDER_WIDTH + 2;
  return x >= m && y >= m && x < WORLD_SIZE - m && y < WORLD_SIZE - m;
}
function nearSpawn(x, y, r) { return Math.abs(x - SPAWN_X) <= r && Math.abs(y - SPAWN_Y) <= r; }
function inCastle(c, x, y) { return !!c && x >= c.x && x <= c.x + 1 && y >= c.y && y <= c.y + 1; }
function lineByHash(arr, x, y) { return arr[Math.floor(hash2D(x, y, 17) * arr.length)]; }
function makeNpc(x, y, line, opts) {
  return Object.assign({
    x, y, line, heal: false, sprite: 'npc',
    variantSeed: Math.floor(hash2D(x, y, 88) * 1000)
  }, opts || {});
}

// ---------- Castles (cached separately so roads can find them cheaply) ----------
const castleCache = new Map();

function getCastle(cx, cy) {
  const key = cx + ',' + cy;
  if (castleCache.has(key)) return castleCache.get(key);
  let castle = null;
  if (cx >= 0 && cy >= 0 && hashChunk(cx, cy, 11) < 0.16) {
    for (let i = 0; i < 8 && !castle; i++) {
      const p = chunkPoint(cx, cy, i, 300);
      if (p.x - cx * CHUNK_SIZE > CHUNK_SIZE - 5 || p.y - cy * CHUNK_SIZE > CHUNK_SIZE - 5) continue;
      if (!inInterior(p.x, p.y) || nearSpawn(p.x, p.y, SPAWN_CLEAR_RADIUS)) continue;
      const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(d => getBiome(p.x + d[0], p.y + d[1]) === 'plains');
      if (ok) castle = { x: p.x, y: p.y };
    }
  }
  castleCache.set(key, castle);
  return castle;
}

// ---------- Roads between castles ----------
// Each castle is linked to its 2 nearest castles (within ROAD_MAX_DIST tiles).
// Roads are Z-shaped paths between paved rings around the castles. Over water
// they become bridges, and over mountains they become passes.
const ROAD_MAX_DIST = 200;
const ROAD_LINKS = 2;
const ROAD_SCAN_CHUNKS = 6;
const CHUNKS_PER_SIDE = Math.ceil(WORLD_SIZE / CHUNK_SIZE);
const roadTiles = new Set();
const roadChunkDone = new Uint8Array(CHUNKS_PER_SIDE * CHUNKS_PER_SIDE);
const roadEdgeBuilt = new Set();
const castleLinkCache = new Map();

function castleKey(c) { return c.x + ',' + c.y; }

function nearbyCastles(cx, cy, R) {
  const out = [];
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -R; dy <= R; dy++) {
      const c = getCastle(cx + dx, cy + dy);
      if (c) out.push(c);
    }
  }
  return out;
}

function getCastleLinks(c) {
  const k = castleKey(c);
  if (castleLinkCache.has(k)) return castleLinkCache.get(k);
  const ccx = Math.floor(c.x / CHUNK_SIZE), ccy = Math.floor(c.y / CHUNK_SIZE);
  const others = nearbyCastles(ccx, ccy, 5)
    .filter(o => o !== c)
    .map(o => ({ o, d: Math.hypot(o.x - c.x, o.y - c.y) }))
    .filter(e => e.d <= ROAD_MAX_DIST)
    .sort((a, b) => a.d - b.d || a.o.x - b.o.x || a.o.y - b.o.y);
  const links = others.slice(0, ROAD_LINKS).map(e => e.o);
  castleLinkCache.set(k, links);
  return links;
}

function addRoadTile(x, y) {
  if (!inInterior(x, y)) return;
  const castle = getCastle(Math.floor(x / CHUNK_SIZE), Math.floor(y / CHUNK_SIZE));
  if (inCastle(castle, x, y)) return;
  roadTiles.add(y * WORLD_SIZE + x);
}
function roadH(y, x0, x1) { const s = Math.sign(x1 - x0) || 1; for (let x = x0; x !== x1 + s; x += s) addRoadTile(x, y); }
function roadV(x, y0, y1) { const s = Math.sign(y1 - y0) || 1; for (let y = y0; y !== y1 + s; y += s) addRoadTile(x, y); }

// A small paved ring around every linked castle, so roads always reach it.
const roadRingBuilt = new Set();
function buildRing(c) {
  const k = castleKey(c);
  if (roadRingBuilt.has(k)) return;
  roadRingBuilt.add(k);
  for (let x = c.x - 1; x <= c.x + 2; x++) {
    for (let y = c.y - 1; y <= c.y + 2; y++) {
      if (!inCastle(c, x, y)) addRoadTile(x, y);
    }
  }
}

// The road leaves the castle from a corner of the ring, facing its target.
function roadAnchor(a, target) {
  const dx = target.x - a.x, dy = target.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx > 0 ? a.x + 2 : a.x - 1, y: dy >= 0 ? a.y + 2 : a.y - 1 };
  }
  return { x: dx >= 0 ? a.x + 2 : a.x - 1, y: dy > 0 ? a.y + 2 : a.y - 1 };
}

function buildRoad(a, b) {
  buildRing(a); buildRing(b);
  const p = roadAnchor(a, b), q = roadAnchor(b, a);
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) {
    const midX = Math.floor((p.x + q.x) / 2);
    roadH(p.y, p.x, midX); roadV(midX, p.y, q.y); roadH(q.y, midX, q.x);
  } else {
    const midY = Math.floor((p.y + q.y) / 2);
    roadV(p.x, p.y, midY); roadH(midY, p.x, q.x); roadV(q.x, midY, q.y);
  }
}

function ensureRoads(cx, cy) {
  const idx = cy * CHUNKS_PER_SIDE + cx;
  if (roadChunkDone[idx]) return;
  roadChunkDone[idx] = 1;
  for (const a of nearbyCastles(cx, cy, ROAD_SCAN_CHUNKS)) {
    for (const b of getCastleLinks(a)) {
      const ka = castleKey(a), kb = castleKey(b);
      const ek = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      if (!roadEdgeBuilt.has(ek)) { roadEdgeBuilt.add(ek); buildRoad(a, b); }
    }
  }
}

function getChunkFeatures(cx, cy) {
  const key = cx + ',' + cy;
  if (chunkFeatureCache.has(key)) return chunkFeatureCache.get(key);

  const f = { castle: null, caves: [], harbor: null, npcs: [], enemySpawns: [], seaSpawns: [], wanderers: [], boats: [] };
  const rnd = (salt) => hashChunk(cx, cy, salt);

  // Castle (from the cached getCastle), with a guard and a healer just outside its paved ring
  f.castle = getCastle(cx, cy);
  if (f.castle) {
    const c = f.castle;
    const spots = [[-2, 0], [3, 1], [-2, 1], [3, 0], [-2, -2], [3, 3]]
      .map(d => ({ x: c.x + d[0], y: c.y + d[1] }))
      .filter(s => WALKABLE[getBiome(s.x, s.y)]);
    if (spots[0]) f.npcs.push(makeNpc(spots[0].x, spots[0].y, lineByHash(GUARD_LINES, spots[0].x, spots[0].y)));
    if (spots[1]) f.npcs.push(makeNpc(spots[1].x, spots[1].y, lineByHash(HEALER_LINES, spots[1].x, spots[1].y), { heal: true }));
  }

  // Harbour: a dock tile on the shore, harbour master behind it, a boat moored in the water
  if (rnd(201) < 0.55) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < 30 && !f.harbor; i++) {
      const p = chunkPoint(cx, cy, i, 400);
      if (!inInterior(p.x, p.y) || nearSpawn(p.x, p.y, SPAWN_CLEAR_RADIUS)) continue;
      if (getBiome(p.x, p.y) !== 'plains' || inCastle(f.castle, p.x, p.y)) continue;
      const start = Math.floor(hash2D(p.x, p.y, 5) * 4);
      for (let k = 0; k < 4; k++) {
        const d = dirs[(start + k) % 4];
        const w = { x: p.x + d[0], y: p.y + d[1] };
        const b = { x: p.x - d[0], y: p.y - d[1] };
        if (getBiome(w.x, w.y) === 'water' && WALKABLE[getBiome(b.x, b.y)] && !inCastle(f.castle, b.x, b.y)) {
          f.harbor = { x: p.x, y: p.y };
          f.npcs.push(makeNpc(b.x, b.y, lineByHash(HARBOR_LINES, b.x, b.y), { heal: true }));
          f.npcs.push(makeNpc(w.x, w.y, "All aboard! Just walk into the water and you'll sail off.", { sprite: 'sailboat' }));
          break;
        }
      }
    }
  }

  // Caves: entrances in the foot of mountains that you can actually walk up to
  const wantCaves = (rnd(111) < 0.4 ? 1 : 0) + (rnd(112) < 0.15 ? 1 : 0);
  for (let c = 0; c < wantCaves; c++) {
    for (let i = 0; i < 60; i++) {
      const p = chunkPoint(cx, cy, i + c * 60, 500);
      if (!inInterior(p.x, p.y) || getBiome(p.x, p.y) !== 'mountain') continue;
      const reachable = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => WALKABLE[getBiome(p.x + d[0], p.y + d[1])]);
      if (reachable) { f.caves.push({ x: p.x, y: p.y }); break; }
    }
  }

  // Land enemies (at least one attempt per chunk)
  const enemyCount = Math.floor(rnd(44) * 4) + 1;
  for (let i = 0; i < enemyCount; i++) {
    const p = chunkPoint(cx, cy, i, 600);
    const b = getBiome(p.x, p.y);
    if ((b === 'plains' || b === 'forest') && !inCastle(f.castle, p.x, p.y)) f.enemySpawns.push(p);
  }

  // Sea monsters in deep water
  const seaCount = Math.floor(rnd(45) * 3);
  for (let s = 0; s < seaCount; s++) {
    for (let i = 0; i < 10; i++) {
      const p = chunkPoint(cx, cy, i + s * 10, 700);
      if (getBiome(p.x, p.y) === 'water') { f.seaSpawns.push(p); break; }
    }
  }

  // Wandering villagers (1-3 per chunk)
  const wandererCount = 1 + Math.floor(rnd(155) * 3);
  for (let i = 0; i < wandererCount; i++) {
    const p = chunkPoint(cx, cy, i, 800);
    const b = getBiome(p.x, p.y);
    if ((b === 'plains' || b === 'forest') && !inCastle(f.castle, p.x, p.y)) {
      f.wanderers.push({ x: p.x, y: p.y, domain: 'land', sprite: 'wanderer', line: lineByHash(WANDERER_LINES, p.x, p.y) });
    }
  }

  // Sailing boats
  const boatCount = Math.floor(rnd(160) * 2);
  for (let s = 0; s < boatCount; s++) {
    for (let i = 0; i < 10; i++) {
      const p = chunkPoint(cx, cy, i + s * 10, 900);
      if (getBiome(p.x, p.y) === 'water') {
        f.boats.push({ x: p.x, y: p.y, domain: 'sea', sprite: 'sailboat', line: lineByHash(BOATMAN_LINES, p.x, p.y) });
        break;
      }
    }
  }

  chunkFeatureCache.set(key, f);
  return f;
}

function getTile(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_SIZE || y >= WORLD_SIZE) {
    return { type: 'mountain', walkable: false, sailable: false, isCastleOrigin: false };
  }
  const cx = Math.floor(x / CHUNK_SIZE), cy = Math.floor(y / CHUNK_SIZE);
  const f = getChunkFeatures(cx, cy);

  if (f.castle && inCastle(f.castle, x, y)) {
    return { type: 'castle', walkable: false, sailable: false, isCastleOrigin: (x === f.castle.x && y === f.castle.y) };
  }
  if (f.harbor && f.harbor.x === x && f.harbor.y === y) {
    return { type: 'harbor', walkable: true, sailable: false, isCastleOrigin: false };
  }
  for (const c of f.caves) {
    if (c.x === x && c.y === y) return { type: 'cave', walkable: true, sailable: false, isCastleOrigin: false };
  }

  ensureRoads(cx, cy);
  if (roadTiles.has(y * WORLD_SIZE + x)) {
    const under = getBiome(x, y);
    const type = (under === 'water' || under === 'river') ? 'bridge' : 'road';
    return { type, walkable: true, sailable: false, isCastleOrigin: false };
  }

  const type = getBiome(x, y);
  return { type, walkable: !!WALKABLE[type], sailable: !!SAILABLE[type], isCastleOrigin: false };
}
