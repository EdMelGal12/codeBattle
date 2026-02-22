/**
 * Lightweight JSON file-based player store.
 * Same API as the better-sqlite3 version — no native compilation needed.
 *
 * Schema per player:
 *   { username, elo, wins, losses, draws, total_games, updated_at }
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'codebattle-db.json');

// ── In-memory store ───────────────────────────────────────────────────────────

let store = { players: {} };

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_PATH)) {
      store = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      if (!store.players) store.players = {};
    }
  } catch (err) {
    console.error('[DB] Failed to load database, starting fresh:', err.message);
    store = { players: {} };
  }
}

function saveToDisk() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB] Failed to save database:', err.message);
  }
}

// Load on startup
loadFromDisk();

// ── Public API ────────────────────────────────────────────────────────────────

function getOrCreatePlayer(username) {
  if (!store.players[username]) {
    store.players[username] = {
      username,
      elo:         1200,
      wins:        0,
      losses:      0,
      draws:       0,
      total_games: 0,
      updated_at:  new Date().toISOString(),
    };
    saveToDisk();
  }
  return store.players[username];
}

function updatePlayer(username, newElo, wonDelta, lossDelta, drawDelta) {
  const p = getOrCreatePlayer(username);
  p.elo         = newElo;
  p.wins        += wonDelta;
  p.losses      += lossDelta;
  p.draws       += drawDelta;
  p.total_games += 1;
  p.updated_at   = new Date().toISOString();
  saveToDisk();
}

function getTopPlayers(limit = 10) {
  return Object.values(store.players)
    .sort((a, b) => b.elo - a.elo || b.wins - a.wins)
    .slice(0, limit);
}

module.exports = { getOrCreatePlayer, updatePlayer, getTopPlayers };
