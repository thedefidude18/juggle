import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your React app URL
    methods: ["GET", "POST"]
  }
});

app.use(cors());

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  chat_id: string;
  created_at: string;
  is_image?: boolean;
  replied_to?: string;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room
  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Handle new messages
  socket.on('send_message', (message: ChatMessage) => {
    io.to(message.chat_id).emit('receive_message', message);
  });

  // Handle typing status
  socket.on('typing_start', ({ chatId, userId }: { chatId: string; userId: string }) => {
    socket.to(chatId).emit('user_typing', { userId, isTyping: true });
  });

  socket.on('typing_stop', ({ chatId, userId }: { chatId: string; userId: string }) => {
    socket.to(chatId).emit('user_typing', { userId, isTyping: false });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});