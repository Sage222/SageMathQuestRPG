const TILE = 32;
const VIEW_COLS = 15;
const VIEW_ROWS = 11;
const WORLD_SIZE = 1000;
const WORLD_SEED = 1337;
const MAX_VARIANTS = 5;

function loadSprite(path) {
  const img = new Image();
  img.loaded = false;
  img.onload = () => { img.loaded = true; };
  img.onerror = () => { img.loaded = false; };
  img.src = path;
  return img;
}

function loadSpriteVariants(baseName) {
  const variants = [];
  for (let i = 1; i <= MAX_VARIANTS; i++) {
    const filename = i === 1 ? `${baseName}.png` : `${baseName}${i}.png`;
    variants.push(loadSprite(`sprites/${filename}`));
  }
  return variants;
}

const spriteSets = {
  player: loadSpriteVariants('player'),
  boat: loadSpriteVariants('boat'),
  enemy: loadSpriteVariants('enemy'),
  seamonster: loadSpriteVariants('seamonster'),
  npc: loadSpriteVariants('npc'),
  wanderer: loadSpriteVariants('wanderer'),
  sailboat: loadSpriteVariants('sailboat'),
  plains: loadSpriteVariants('plains'),
  forest: loadSpriteVariants('forest'),
  mountain: loadSpriteVariants('mountain'),
  water: loadSpriteVariants('water'),
  river: loadSpriteVariants('river'),
  castle: loadSpriteVariants('castle'),
  cave: loadSpriteVariants('cave'),
  harbor: loadSpriteVariants('harbor'),
  road: loadSpriteVariants('road'),
  bridge: loadSpriteVariants('bridge'),
};

function pickVariant(type, seedValue) {
  const set = spriteSets[type];
  if (!set) return null;
  const loadedIndices = [];
  for (let i = 0; i < set.length; i++) {
    if (set[i].loaded) loadedIndices.push(i);
  }
  if (loadedIndices.length === 0) return null;
  const pick = loadedIndices[seedValue % loadedIndices.length];
  return set[pick];
}

const TILE_COLORS = {
  plains: '#4a8f3c',
  forest: '#1f5c2a',
  mountain: '#8a8a8a',
  water: '#2e6fb0',
  river: '#3a8fd0',
  castle: '#7a6a4a',
  cave: '#2b2b2b',
  harbor: '#9a6a34',
  road: '#b8935a',
  bridge: '#8a5a2b',
};

const SPRITE_FALLBACK = {
  player: '#3498db', boat: '#a0522d', enemy: '#c0392b', seamonster: '#16a085',
  npc: '#f1c40f', wanderer: '#8e44ad', sailboat: '#e67e22',
};

function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
