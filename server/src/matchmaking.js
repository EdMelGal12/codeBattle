const { createGame } = require('./gameManager');

// Separate queues per wager tier (0 = free, else lamports)
const freeQueue = [];
const wagerQueues = new Map(); // amount (lamports) → player[]

function getOrCreateWagerQueue(amount) {
  if (!wagerQueues.has(amount)) wagerQueues.set(amount, []);
  return wagerQueues.get(amount);
}

function removeFromQueues(socketId) {
  const removeFrom = (q) => {
    const idx = q.findIndex((p) => p.socket.id === socketId);
    if (idx !== -1) { q.splice(idx, 1); return true; }
    return false;
  };
  if (removeFrom(freeQueue)) return;
  for (const q of wagerQueues.values()) removeFrom(q);
}

function tryPairQueue(queue, io) {
  while (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    createGame(p1, p2, io);
  }
}

function joinQueue(socket, username, streak, wagerAmount, walletPubkey, io) {
  // Remove any stale entry for this socket across all queues
  removeFromQueues(socket.id);

  const player = { socket, username, streak, wagerAmount: wagerAmount || 0, walletPubkey: walletPubkey || null };

  if (!wagerAmount || wagerAmount === 0) {
    freeQueue.push(player);
    console.log(`[Queue] ${username} (streak ${streak}) joined FREE queue. Size: ${freeQueue.length}`);
    socket.emit('queue_update', { position: freeQueue.length });
    tryPairQueue(freeQueue, io);
  } else {
    const q = getOrCreateWagerQueue(wagerAmount);
    q.push(player);
    console.log(`[Queue] ${username} joined WAGER queue (${wagerAmount} lamports). Size: ${q.length}`);
    socket.emit('queue_update', { position: q.length });
    tryPairQueue(q, io);
  }
}

function leaveQueue(socketId) {
  removeFromQueues(socketId);
  console.log(`[Queue] Socket ${socketId} left.`);
}

module.exports = { joinQueue, leaveQueue };
