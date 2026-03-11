const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Server Wake-up & Auto-Ping Endpoint
app.get('/ping', (req, res) => {
    res.status(200).send('Server is awake and running smoothly! 🚀');
});

const server = http.createServer(app);

// Socket.io Setup for Ultra-Fast Realtime Sync
const io = new Server(server, {
    cors: {
        origin: "*", // Allows your Netlify frontend to connect
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('⚡ Player Connected:', socket.id);

    // 1. Join a specific Match Room
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        console.log(`Player ${socket.id} joined room: ${roomId}`);
        
        // Tell others in the room that someone arrived
        socket.to(roomId).emit('peer_connected');
    });

    // 2. The Lightning-Fast Data Relay (Positions, Animations, Game Events)
    socket.on('game_data', (data) => {
        if (socket.roomId) {
            // Forward data instantly to the opponent
            socket.to(socket.roomId).emit('game_data', data);
        }
    });

    // 3. Handle Voice Signaling (WebRTC via Server instead of PeerJS Cloud)
    socket.on('webrtc_signal', (data) => {
        if (socket.roomId) {
            socket.to(socket.roomId).emit('webrtc_signal', data);
        }
    });

    // 4. Handle Disconnections
    socket.on('disconnect', () => {
        console.log('❌ Player Disconnected:', socket.id);
        if (socket.roomId) {
            socket.to(socket.roomId).emit('peer_disconnected');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🏆 Maze Looter Server running on port ${PORT}`);
});

// ==========================================
// 🚀 AUTO-PING SYSTEM (PREVENTS SLEEP) 🚀
// ==========================================
// Render free tier sleeps after 15 mins of inactivity.
// This pings the server every 10 minutes to keep it awake 24/7.
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

setInterval(async () => {
    try {
        if (SERVER_URL.startsWith('http')) {
            const res = await fetch(`${SERVER_URL}/ping`);
            console.log('🔄 Auto-Ping Success:', res.status);
        }
    } catch (err) {
        console.log('⚠️ Auto-Ping Failed:', err.message);
    }
}, 10 * 60 * 1000); // 10 Minutes
