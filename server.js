const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// 🔹 Ping (keep server alive)
app.get('/ping', (req, res) => {
res.status(200).send('Server is awake 🚀');
});

const server = http.createServer(app);

const io = new Server(server, {
cors: {
origin: "*",
methods: ["GET", "POST"]
}
});

io.on('connection', (socket) => {

console.log('⚡ Player Connected:', socket.id);

// =========================
// 🎮 GAME SYSTEM (UNCHANGED)
// =========================

socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;

    console.log(`Player ${socket.id} joined room: ${roomId}`);

    socket.to(roomId).emit('peer_connected');
});

socket.on('game_data', (data) => {
    if (socket.roomId) {
        socket.to(socket.roomId).emit('game_data', data);
    }
});

socket.on('webrtc_signal', (data) => {
    if (socket.roomId) {
        socket.to(socket.roomId).emit('webrtc_signal', data);
    }
});

socket.on('disconnect', () => {
    console.log('❌ Player Disconnected:', socket.id);

    if (socket.roomId) {
        socket.to(socket.roomId).emit('peer_disconnected');
    }
});

// =========================
// 💬 CHAT SYSTEM (NEW)
// =========================

// Join chat room
socket.on('join', ({ room }) => {
    socket.join(room);
    socket.chatRoom = room;

    console.log(`💬 ${socket.id} joined chat: ${room}`);
});

// Send message
socket.on('message', (data) => {
    const room = data.room;
    const msg = data.msg;

    console.log(`💬 MSG: ${msg} ROOM: ${room}`);

    io.to(room).emit('message', {
        msg: msg,
        sender: socket.id
    });
});

});

// =========================
// 🚀 SERVER START
// =========================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
console.log("🏆 Server running on port ${PORT}");
});

// =========================
// 🔄 AUTO PING (KEEP ALIVE)
// =========================

const fetch = require("node-fetch");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:${PORT}";

setInterval(async () => {
try {
const res = await fetch("${SERVER_URL}/ping");
console.log('🔄 Auto-Ping:', res.status);
} catch (err) {
console.log('⚠️ Ping Failed:', err.message);
}
}, 10 * 60 * 1000);
