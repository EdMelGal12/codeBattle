const { fetchQuestions } = require('./questionService');
const { randomUUID } = require('crypto');

// Active rooms: roomId → { id, players, questions, answeredCount, timerInterval, timeLeft, started }
const rooms = new Map();

function createGame(p1, p2, io) {
  const roomId = randomUUID();
  const room = {
    id: roomId,
    players: [
      { socket: p1.socket, username: p1.username, score: 0 },
      { socket: p2.socket, username: p2.username, score: 0 },
    ],
    questions: [],
    timerInterval: null,
    timeLeft: 30,
    started: false,
  };
  rooms.set(roomId, room);

  p1.socket.join(roomId);
  p2.socket.join(roomId);

  p1.socket.emit('match_found', { opponent: { username: p2.username }, roomId });
  p2.socket.emit('match_found', { opponent: { username: p1.username }, roomId });

  console.log(`[Game] Room ${roomId} created: ${p1.username} vs ${p2.username}`);

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

  // Strip answers from client payload
  const clientQuestions = room.questions.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options,
  }));

  io.to(room.id).emit('game_start', { questions: clientQuestions });

  // 30-second server-side countdown
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

  const player = room.players[playerIndex];
  const opponent = room.players[1 - playerIndex];

  const normalize = (s) => String(s).trim().toLowerCase();
  const correct = normalize(answer) === normalize(question.answer);

  if (correct) player.score += 10;

  socket.emit('answer_result', {
    correct,
    correctAnswer: question.answer,
    yourScore: player.score,
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

  const opponent = room.players[1 - playerIndex];
  opponent.socket.emit('error', { message: 'Your opponent disconnected. Returning to lobby.' });
  console.log(`[Game] Room ${room.id} closed due to disconnect.`);
}

module.exports = { createGame, handleAnswer, handleDisconnect };
