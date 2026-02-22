const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { joinQueue, leaveQueue } = require('./matchmaking');
const { handleAnswer, handleDisconnect } = require('./gameManager');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join_queue', ({ username }) => {
    if (!username || typeof username !== 'string') {
      socket.emit('error', { message: 'Invalid username.' });
      return;
    }
    const clean = username.trim().slice(0, 20);
    if (!clean) {
      socket.emit('error', { message: 'Username cannot be empty.' });
      return;
    }
    joinQueue(socket, clean, io);
  });

  socket.on('leave_queue', () => {
    leaveQueue(socket.id);
  });

  socket.on('submit_answer', (payload) => {
    handleAnswer(socket, payload, io);
  });

  socket.on('play_again', () => {
    // Client will re-emit join_queue; nothing to do here
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
