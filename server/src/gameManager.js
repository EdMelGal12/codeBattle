const { fetchQuestions } = require('./questionService');
const { randomUUID } = require('crypto');
const { declareWinner, cancelWager, verifyDeposit, getEscrowPda, getServerKeypair } = require('./wagerService');
const { processGameResult } = require('./eloService');
const { getOrCreatePlayer } = require('./database');

const rooms = new Map();

// ── Fuzzy matching for fill-in-blank answers ─────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function similarity(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const FUZZY_THRESHOLD = 0.65;

// ── Streak multiplier ────────────────────────────────────────────────────────

function getMultiplier(streak) {
  return Math.min(1 + (streak || 0) * 0.5, 3);
}

// ── Wager deposit tracking ───────────────────────────────────────────────────

const WAGER_DEPOSIT_TIMEOUT_MS = 35_000; // 35s (client shows 30s)

async function setupWager(room, io) {
  const { wager } = room;
  const [p1, p2]  = room.players;
  const serverKp  = getServerKeypair();
  if (!serverKp) {
    console.warn('[Wager] No server keypair — skipping wager setup');
    return startCountdown(room, io);
  }

  // Precompute the escrow PDA
  const escrowPda = await getEscrowPda(room.id);
  wager.escrowPda = escrowPda.toBase58();

  // Tell each player their wager role and escrow details
  const base = {
    roomId:      room.id,
    amount:      wager.amount,
    escrowPda:   wager.escrowPda,
    serverPubkey: serverKp.publicKey.toBase58(),
  };
  p1.socket.emit('wager_setup', { ...base, role: 'init', opponentPubkey: p2.walletPubkey });
  p2.socket.emit('wager_setup', { ...base, role: 'join', opponentPubkey: p1.walletPubkey });

  console.log(`[Wager] Room ${room.id}: awaiting deposits (${wager.amount} lamports each)`);

  // Cancel if both don't deposit in time
  wager.cancelTimer = setTimeout(async () => {
    if (!rooms.has(room.id)) return;
    console.log(`[Wager] Room ${room.id}: deposit timeout — cancelling`);
    io.to(room.id).emit('wager_cancelled', { message: 'WAGER TIMEOUT. RETURNING TO QUEUE.' });
    if (wager.p1Deposited || wager.p2Deposited) {
      await cancelWager(room.id, p1.walletPubkey, p2.walletPubkey);
    }
    rooms.delete(room.id);
  }, WAGER_DEPOSIT_TIMEOUT_MS);
}

async function handleWagerDeposit(socket, { signature }, io) {
  const found = findRoomBySocket(socket.id);
  if (!found) return;
  const { room, playerIndex } = found;
  const { wager } = room;
  if (!wager) return;

  const valid = await verifyDeposit(signature);
  if (!valid) {
    socket.emit('error', { message: 'DEPOSIT TRANSACTION NOT CONFIRMED.' });
    return;
  }

  if (playerIndex === 0) wager.p1Deposited = true;
  else                   wager.p2Deposited = true;

  const [p1, p2] = room.players;

  // Notify opponent
  room.players[1 - playerIndex].socket.emit('wager_opponent_ready');

  if (wager.p1Deposited && wager.p2Deposited) {
    clearTimeout(wager.cancelTimer);
    console.log(`[Wager] Room ${room.id}: both deposited — starting game`);
    io.to(room.id).emit('wager_confirmed');
    startCountdown(room, io);
  }
}

// ── Core game lifecycle ───────────────────────────────────────────────────────

function createGame(p1, p2, io) {
  const roomId = randomUUID();
  const isWagerGame = p1.wagerAmount > 0;

  const room = {
    id: roomId,
    players: [
      { socket: p1.socket, username: p1.username, score: 0, streak: p1.streak || 0, walletPubkey: p1.walletPubkey || null },
      { socket: p2.socket, username: p2.username, score: 0, streak: p2.streak || 0, walletPubkey: p2.walletPubkey || null },
    ],
    questions:     [],
    timerInterval: null,
    timeLeft:      60,
    started:       false,
    wager: isWagerGame ? {
      amount:       p1.wagerAmount,
      escrowPda:    null,
      p1Deposited:  false,
      p2Deposited:  false,
      cancelTimer:  null,
    } : null,
  };
  rooms.set(roomId, room);

  p1.socket.join(roomId);
  p2.socket.join(roomId);

  console.log(
    `[Game] Room ${roomId}: ${p1.username}(x${getMultiplier(p1.streak)}) vs ${p2.username}(x${getMultiplier(p2.streak)})${isWagerGame ? ` WAGER:${p1.wagerAmount}` : ''}`
  );

  // Look up opponent ELOs for match_found payload
  const p1Data = getOrCreatePlayer(p1.username);
  const p2Data = getOrCreatePlayer(p2.username);

  // Emit match_found — wager setup is handled separately via 'wager_setup' event
  p1.socket.emit('match_found', {
    opponent:    { username: p2.username },
    roomId,
    multiplier:  getMultiplier(p1.streak || 0),
    isWager:     isWagerGame,
    myElo:       p1Data.elo,
    opponentElo: p2Data.elo,
  });
  p2.socket.emit('match_found', {
    opponent:    { username: p1.username },
    roomId,
    multiplier:  getMultiplier(p2.streak || 0),
    isWager:     isWagerGame,
    myElo:       p2Data.elo,
    opponentElo: p1Data.elo,
  });

  if (isWagerGame) {
    setupWager(room, io);
  } else {
    startCountdown(room, io);
  }
}

function startCountdown(room, io) {
  let count = 5;
  io.to(room.id).emit('countdown', { value: count });
  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      io.to(room.id).emit('countdown', { value: count });
    } else {
      clearInterval(interval);
      startGame(room, io);
    }
  }, 1000);
}

async function startGame(room, io) {
  try {
    room.questions = await fetchQuestions();
  } catch (err) {
    console.error('[Game] Failed to fetch questions:', err);
    io.to(room.id).emit('error', { message: 'Failed to load questions. Please try again.' });
    rooms.delete(room.id);
    return;
  }

  room.started = true;
  room.timeLeft = 60;

  const clientQuestions = room.questions.map((q) => ({
    type:     q.type,
    question: q.question,
    options:  q.options,
  }));

  io.to(room.id).emit('game_start', { questions: clientQuestions });

  room.timerInterval = setInterval(() => {
    room.timeLeft--;
    io.to(room.id).emit('timer_tick', { timeLeft: room.timeLeft });
    if (room.timeLeft <= 0) {
      clearInterval(room.timerInterval);
      endGame(room, io);
    }
  }, 1000);
}

function findRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    const idx = room.players.findIndex((p) => p.socket.id === socketId);
    if (idx !== -1) return { room, playerIndex: idx };
  }
  return null;
}

function handleAnswer(socket, { questionIndex, answer }, io) {
  const found = findRoomBySocket(socket.id);
  if (!found || !found.room.started) return;

  const { room, playerIndex } = found;
  const question = room.questions[questionIndex];
  if (!question) return;

  const player   = room.players[playerIndex];
  const opponent = room.players[1 - playerIndex];

  const normalize  = (s) => String(s).trim().toLowerCase();
  const normGiven  = normalize(answer);
  const normActual = normalize(question.answer);

  let correct = false;
  let fuzzy   = false;

  if (question.type === 'fill') {
    if (normGiven === normActual) {
      correct = true;
    } else if (similarity(normGiven, normActual) >= FUZZY_THRESHOLD) {
      correct = true;
      fuzzy   = true;
    }
  } else {
    correct = normGiven === normActual;
  }

  const multiplier   = getMultiplier(player.streak);
  const pointsGained = correct ? Math.round(10 * multiplier) : 0;
  if (correct) player.score += pointsGained;

  socket.emit('answer_result', {
    correct,
    fuzzy,
    correctAnswer: question.answer,
    yourScore:     player.score,
    pointsGained,
    multiplier,
  });

  opponent.socket.emit('opponent_progress', { score: player.score });
}

async function endGame(room, io) {
  if (!rooms.has(room.id)) return;
  rooms.delete(room.id);

  const [p1, p2] = room.players;
  let winner = null;
  if (p1.score > p2.score)      winner = p1.username;
  else if (p2.score > p1.score) winner = p2.username;

  const winnerPlayer = p1.score > p2.score ? p1 : p2;
  const loserPlayer  = p1.score > p2.score ? p2 : p1;

  // Process ELO changes
  let eloChanges = {};
  try {
    eloChanges = processGameResult(p1.username, p2.username, winner);
  } catch (err) {
    console.error('[ELO] Failed to process game result:', err);
  }

  p1.socket.emit('game_over', {
    winner,
    yourScore:     p1.score,
    opponentScore: p2.score,
    questions:     room.questions,
    eloChanges,
  });
  p2.socket.emit('game_over', {
    winner,
    yourScore:     p2.score,
    opponentScore: p1.score,
    questions:     room.questions,
    eloChanges,
  });

  console.log(`[Game] Room ${room.id} ended. Winner: ${winner || 'Draw'}`);

  // Wager payout
  if (room.wager && room.wager.p1Deposited && room.wager.p2Deposited) {
    if (winner) {
      const winnerPubkey = winnerPlayer.walletPubkey;
      const p1Pubkey     = p1.walletPubkey;
      const p2Pubkey     = p2.walletPubkey;
      if (winnerPubkey && p1Pubkey && p2Pubkey) {
        await declareWinner(room.id, winnerPubkey, p1Pubkey, p2Pubkey);
      }
    } else {
      // Draw — refund both players
      if (p1.walletPubkey && p2.walletPubkey) {
        await cancelWager(room.id, p1.walletPubkey, p2.walletPubkey);
      }
    }
  }
}

function handleDisconnect(socketId, io) {
  const found = findRoomBySocket(socketId);
  if (!found) return;
  const { room, playerIndex } = found;

  clearInterval(room.timerInterval);
  if (room.wager?.cancelTimer) clearTimeout(room.wager.cancelTimer);

  // Refund wager if deposits were made
  if (room.wager && (room.wager.p1Deposited || room.wager.p2Deposited)) {
    const [p1, p2] = room.players;
    cancelWager(room.id, p1.walletPubkey, p2.walletPubkey);
  }

  rooms.delete(room.id);
  room.players[1 - playerIndex].socket.emit('error', {
    message: 'Your opponent disconnected. Returning to lobby.',
  });
  console.log(`[Game] Room ${room.id} closed due to disconnect.`);
}

module.exports = { createGame, handleAnswer, handleWagerDeposit, handleDisconnect };
