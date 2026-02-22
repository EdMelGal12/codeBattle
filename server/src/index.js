const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const { joinQueue, leaveQueue }                        = require('./matchmaking');
const { handleAnswer, handleWagerDeposit, handleDisconnect } = require('./gameManager');
const { getOrCreatePlayer, getTopPlayers } = require('./database');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] },
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join_queue', ({ username, streak, wagerAmount, walletPubkey }) => {
    if (!username || typeof username !== 'string') {
      socket.emit('error', { message: 'Invalid username.' });
      return;
    }
    const clean      = username.trim().slice(0, 20);
    if (!clean) { socket.emit('error', { message: 'Username cannot be empty.' }); return; }
    const safeStreak = Math.max(0, parseInt(streak) || 0);
    const safeWager  = Math.max(0, parseInt(wagerAmount) || 0);
    const safePubkey = typeof walletPubkey === 'string' ? walletPubkey.trim() : null;

    joinQueue(socket, clean, safeStreak, safeWager, safePubkey, io);
  });

  socket.on('leave_queue',    ()        => leaveQueue(socket.id));
  socket.on('submit_answer',  (payload) => handleAnswer(socket, payload, io));
  socket.on('wager_deposited',(payload) => handleWagerDeposit(socket, payload, io));

  socket.on('get_player_stats', ({ username }, cb) => {
    if (typeof cb !== 'function') return;
    try { cb(getOrCreatePlayer(username)); } catch (e) { cb(null); }
  });

  socket.on('get_top_players', (_, cb) => {
    if (typeof cb !== 'function') return;
    try { cb(getTopPlayers(10)); } catch (e) { cb([]); }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    leaveQueue(socket.id);
    handleDisconnect(socket.id, io);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] CodeBattle server running on port ${PORT}`);
});
