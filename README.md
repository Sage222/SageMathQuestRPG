# Math Quest RPG

A top-down, grid-movement pixel RPG in the style of Gurk III. You explore a large procedurally generated world and fight monsters by answering timed multiple-choice maths questions. It is built for ages 10 to 14, and difficulty rises as you level up.

It runs in any modern browser with plain HTML5 Canvas and JavaScript. There is nothing to install and no build step.

## Quick start

1. Put all the game files together in one folder (see [Project structure](#project-structure)).
2. Optionally add a `sprites` folder with your PNG art (see [Sprites](#sprites)).
3. Open `index.html` in a browser.
4. Pick an age or grade level, then press Enter or click to start.

If something looks wrong after you replace files, hard-refresh with **Ctrl+F5**.

## Controls

| Action | Keys |
|---|---|
| Move one tile | Arrow keys or WASD |
| Talk to an NPC | Walk into them |
| Close dialogue | Enter or Space |
| Start the game | Enter, Space, or click |
| Answer a question | Click one of the five answer buttons |

Enemies and wandering NPCs only move when you move.

## How to play

- **Fight:** walk into an enemy to start a battle. Each round shows a maths question with five answers and an 8-second timer.
- **Damage:** a correct answer given in the first half of the timer is a critical hit for 12. A slower correct answer hits for 7. A wrong answer or a timeout costs you 4 HP.
- **Win:** you earn 10 to 20 XP and 5 to 15 gold.
- **Level up:** 10 correct answers in a row give +4 max HP and a full heal. A wrong answer resets the streak.
- **Difficulty:** every 2 levels, questions step up one grade tier, up to the Age 14 tier.
- **Lose:** at 0 HP you respawn at the start point.

### Maths by grade

| Age | Question types |
|---|---|
| 10 | Two-digit add and subtract, times tables 2 to 10 |
| 11 | Larger add and subtract, tables to 12, exact division |
| 12 | Two-digit by one-digit multiplication, division, squares, 3-digit add and subtract |
| 13 | Order of operations, percentages, one-step equations |
| 14 | Two-step equations, exponents, negative numbers |

## The world

The map is 1000 by 1000 tiles. It is generated from noise as you walk, so nothing is stored.

- **Terrain:** plains, forest, mountains, lakes, and thin rivers, with a solid mountain wall around the edge.
- **Boats:** walk onto water or a river and you automatically become a boat. Step back onto land or a bridge and you are on foot again. While you are in a boat, random encounters are sea monsters.
- **Harbours:** a wooden dock on the shore with a harbour master (who heals you) and a moored boat.
- **Castles:** 2 by 2 landmarks with a guard and a healer beside them. The healer restores your HP. Each castle has a paved ring around it.
- **Roads:** every castle is linked to its two nearest castles within 200 tiles. Roads become bridges over water and passes through mountains, so castles are always connected.
- **Caves:** entrances at the foot of mountains. Each holds a Cave Guardian (45 HP) and pays a 30 to 60 gold bonus. A cave can only be cleared once.
- **Villagers and sailors:** they wander the land and lakes and say things.
- **Enemies:** land enemies stay on land and sea monsters stay in water. New enemies also spawn as you walk, so there is always something to fight.

## Project structure

Keep all of these in one folder with no subfolders, except `sprites`.

| File | Purpose |
|---|---|
| `index.html` | Page layout: start screen, HUD, minimap, dialogue and battle overlays |
| `style.css` | All styling |
| `config.js` | Constants, sprite loading, tile colours, small helpers |
| `world.js` | Terrain, lakes, castles, harbours, caves, roads, NPC and enemy placement |
| `npc.js` | Dialogue, healing, wandering villagers and boats |
| `enemy.js` | Enemy spawning, chasing, and land and sea rules |
| `player.js` | Player state, grid movement, boat switching, cave entry |
| `battle.js` | Maths question generation, battle loop, levelling |
| `minimap.js` | The 120 by 120 tile minimap |
| `startscreen.js` | Story screen and grade selection |
| `main.js` | Rendering, input handling, turn order |

**Keep your files in sync.** The files depend on each other, and mixing versions has caused blank screens, a stuck battle, and spawning inside mountains. When updating, replace every changed file together.

## Sprites

Drop PNGs into a `sprites` folder next to `index.html`. Any missing file falls back to a coloured square, so you can add art one piece at a time.

- **Size:** 32 by 32 pixels. The castle is drawn at 64 by 64 on screen, since it covers 2 by 2 tiles.
- **Transparency:** characters, boats, and monsters should have a transparent background. Ground tiles should fill the whole square.
- **Variants:** you can supply up to 5 per type, named `name.png`, `name2.png`, up to `name5.png`. The game picks between the ones that exist, based on map position, so the same spot always looks the same.

| Filename | Used for |
|---|---|
| `player`, `boat` | You on foot, and you in a boat |
| `enemy`, `seamonster` | Land enemies and sea monsters |
| `npc`, `wanderer`, `sailboat` | Castle and harbour NPCs, wandering villagers, boats |
| `plains`, `forest`, `mountain`, `water`, `river` | Terrain |
| `castle`, `cave`, `harbor` | Landmarks |
| `road`, `bridge` | Roads, and roads over water |

Missing variants such as `enemy3.png` show as 404 errors in the browser console. That is expected and harmless.

## Tuning

| What | Where |
|---|---|
| Tile size and view size | `config.js`: `TILE`, `VIEW_COLS`, `VIEW_ROWS` |
| Mountain and water amounts | `world.js`: `0.665` (mountains), `0.27` (low water), `LAKE_THRESHOLD` |
| Number of castles, harbours, caves | `world.js`: `0.16`, `0.55`, `0.4` and `0.15` in `getCastle` and `getChunkFeatures` |
| Road reach and links | `world.js`: `ROAD_MAX_DIST`, `ROAD_LINKS` |
| Enemy count and chase distance | `enemy.js`: `ENEMY_CAP`, `ENEMY_CHASE_RADIUS` |
| Question timer and damage | `battle.js`: `timeLimit`, the damage values in `submitAnswer` |
| Time to read the narration | `battle.js`: the `2600` in `setTimeout(nextQuestion, ...)` |
| Questions to level up | `battle.js`: the `>= 10` streak check |
| Story text | `index.html`: the `#story-text` paragraph |

The world seed is `WORLD_SEED` in `config.js`. The start area is always kept open, but I have only checked that the surroundings connect for the default seed (1337). If you change the seed, confirm you can walk out from the start.

## Troubleshooting

- **Black screen or a stuck "?" in battle:** open DevTools (F12) and read the Console. A message like `X is not defined` almost always means an old file is mixed in. Replace all the code files together.
- **You can't move at the start:** `player.js` must begin with `x: SPAWN_X, y: SPAWN_Y`.
- **Sprites don't show:** the folder must be named `sprites` and sit beside `index.html`. Filenames are exact, and Windows can hide a doubled extension such as `player.png.png`.
- **Changes don't appear:** hard-refresh with Ctrl+F5.

## Known limitations

- The game has no save system, so progress resets on refresh.
- Bridges have no direction, so they look the same in every orientation.
- Rarely, a road that runs into a third castle's wall leaves a gap.
- The art is a starter set drawn in code and is meant to be replaced.

## Ideas for next steps

- Save and load with `localStorage`.
- Shops that use gold, and items or weapons.
- Direction-aware bridges, and edge tiles where roads and shores meet grass.
- Walk animation frames.
- A quest or ending, and an option for typed answers.
