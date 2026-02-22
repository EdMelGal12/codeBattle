const { getOrCreatePlayer, updatePlayer } = require('./database');

const K = 32;
const ELO_FLOOR = 100;
const ELO_START = 1200;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function newRating(old, expected, actual) {
  return Math.max(ELO_FLOOR, Math.round(old + K * (actual - expected)));
}

/**
 * processGameResult(p1name, p2name, winner)
 * winner: p1name | p2name | null (draw)
 * Returns: { [username]: { oldElo, newElo, delta } }
 */
function processGameResult(p1name, p2name, winner) {
  const p1 = getOrCreatePlayer(p1name);
  const p2 = getOrCreatePlayer(p2name);

  const eloA = p1.elo;
  const eloB = p2.elo;

  const expA = expectedScore(eloA, eloB);
  const expB = 1 - expA;

  let actualA, actualB;
  if (winner === p1name)      { actualA = 1;   actualB = 0;   }
  else if (winner === p2name) { actualA = 0;   actualB = 1;   }
  else                        { actualA = 0.5; actualB = 0.5; }

  const newA = newRating(eloA, expA, actualA);
  const newB = newRating(eloB, expB, actualB);

  const wonA  = winner === p1name ? 1 : 0;
  const lossA = winner === p2name ? 1 : 0;
  const drawA = winner === null   ? 1 : 0;

  updatePlayer(p1name, newA, wonA,       lossA,      drawA);
  updatePlayer(p2name, newB, 1 - wonA - drawA, 1 - lossA - drawA, drawA);

  return {
    [p1name]: { oldElo: eloA, newElo: newA, delta: newA - eloA },
    [p2name]: { oldElo: eloB, newElo: newB, delta: newB - eloB },
  };
}

module.exports = { processGameResult, ELO_START };
