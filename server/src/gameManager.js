const { fetchQuestions } = require('./questionService');
const { randomUUID } = require('crypto');

const rooms = new Map();

// ── Fuzzy matching for fill-in-blank answers ─────────────────────────────────

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  // Use two rows instead of full matrix to save memory
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

// Returns 0–1 where 1 = identical, 0 = completely different
function similarity(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

const FUZZY_THRESHOLD = 0.65;

// ── Streak multiplier ────────────────────────────────────────────────────────

// 1x → 1.5x → 2x → 2.5x → 3x (hard cap)
function getMultiplier(streak) {
  return Math.min(1 + (streak || 0) * 0.5, 3);
}

function createGame(p1, p2, io) {
  const roomId = randomUUID();
  const room = {
    id: roomId,
    players: [
      { socket: p1.socket, username: p1.username, score: 0, streak: p1.streak || 0 },
      { socket: p2.socket, username: p2.username, score: 0, streak: p2.streak || 0 },
    ],
    questions: [],
    timerInterval: null,
    timeLeft: 30,
    started: false,
  };
  rooms.set(roomId, room);

  p1.socket.join(roomId);
  p2.socket.join(roomId);

  // Tell each player their opponent and their own active multiplier
  p1.socket.emit('match_found', {
    opponent: { username: p2.username },
    roomId,
    multiplier: getMultiplier(p1.streak || 0),
  });
  p2.socket.emit('match_found', {
    opponent: { username: p1.username },
    roomId,
    multiplier: getMultiplier(p2.streak || 0),
  });

  console.log(
    `[Game] Room ${roomId}: ${p1.username}(x${getMultiplier(p1.streak)}) vs ${p2.username}(x${getMultiplier(p2.streak)})`
  );

  startCountdown(room, io);
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
  room.timeLeft = 30;

  const clientQuestions = room.questions.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options,
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

  const normalize = (s) => String(s).trim().toLowerCase();
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
    yourScore: player.score,
    pointsGained,
    multiplier,
  });

  opponent.socket.emit('opponent_progress', { score: player.score });
}

function endGame(room, io) {
  if (!rooms.has(room.id)) return;
  rooms.delete(room.id);

  const [p1, p2] = room.players;
  let winner = null;
  if (p1.score > p2.score) winner = p1.username;
  else if (p2.score > p1.score) winner = p2.username;

  p1.socket.emit('game_over', {
    winner,
    yourScore: p1.score,
    opponentScore: p2.score,
    questions: room.questions,
  });
  p2.socket.emit('game_over', {
    winner,
    yourScore: p2.score,
    opponentScore: p1.score,
    questions: room.questions,
  });

  console.log(`[Game] Room ${room.id} ended. Winner: ${winner || 'Draw'}`);
}

function handleDisconnect(socketId, io) {
  const found = findRoomBySocket(socketId);
  if (!found) return;
  const { room, playerIndex } = found;
  clearInterval(room.timerInterval);
  rooms.delete(room.id);
  room.players[1 - playerIndex].socket.emit('error', {
    message: 'Your opponent disconnected. Returning to lobby.',
  });
  console.log(`[Game] Room ${room.id} closed due to disconnect.`);
}

module.exports = { createGame, handleAnswer, handleDisconnect };
