const { createGame } = require('./gameManager');

const queue = [];

function joinQueue(socket, username, streak, io) {
  const existing = queue.findIndex((p) => p.socket.id === socket.id);
  if (existing !== -1) queue.splice(existing, 1);

  queue.push({ socket, username, streak });
  console.log(`[Queue] ${username} (streak ${streak}) joined. Queue size: ${queue.length}`);

  socket.emit('queue_update', { position: queue.length });

  if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    createGame(p1, p2, io);
  }
}

function leaveQueue(socketId) {
  const idx = queue.findIndex((p) => p.socket.id === socketId);
  if (idx !== -1) {
    queue.splice(idx, 1);
    console.log(`[Queue] Socket ${socketId} left. Queue size: ${queue.length}`);
  }
}

module.exports = { joinQueue, leaveQueue };
