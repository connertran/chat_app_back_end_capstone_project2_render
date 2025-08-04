"use strict";

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { PORT, FRONTEND_URL } = require("./config");
const Message = require("./models/message");
const User = require("./models/user");

const app = require("./app");
const httpServer = createServer(app);

// Socket.IO setup with Express
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  path: "/socket.io/",
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingInterval: 25000,
  pingTimeout: 60000,
});

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  // When users connect, we'll put them in rooms named after their usernames.
  // Instead of emitting to all clients, we'll emit messages to the specific room(s) involved in the conversation.
  socket.on("join room", (username) => {
    socket.join(username);
    console.log(`User ${username} joined room`);
  });

  socket.on("read messages", async ({ receiver, sender }) => {
    try {
      console.log(`Marking messages as read between ${sender} and ${receiver}`);
      const receiverObj = await User.userInDbCheck(receiver);

      // Fetch the conversation between the sender and receiver
      const conversation = await Message.getConversation(sender, receiver);

      const newSeenMessages = [];
      // Update the seen status of the messages in the conversation
      const updatePromises = conversation.map(async (message) => {
        if (message.receiver === receiverObj.id) {
          const messageObj = await Message.get(message.messageId);
          newSeenMessages.push(message.messageId);
          await Message.readMessage(message.messageId);
        }
      });

      await Promise.all(updatePromises);

      // Emit the updated conversation back to the sender
      io.to(sender).emit("read messages update", {
        sender,
        receiver,
        newSeenMessages,
      });
      io.to(receiver).emit("read messages update", {
        sender,
        receiver,
        newSeenMessages,
      });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("chat message", async (message) => {
    try {
      console.log(message);
      const parsedMessage = JSON.parse(message);
      console.log("message from client", parsedMessage);
      // Emit the received message back to the specific rooms
      io.to(parsedMessage.sender).emit(
        "receive message",
        JSON.stringify(parsedMessage)
      );
      io.to(parsedMessage.receiver).emit(
        "receive message",
        JSON.stringify(parsedMessage)
      );
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Import the messages routes and set the io instance
const messagesRoutes = require("./routes/messages");
// const messagesRoutesTest = require("./routes/messages.test");
const { read } = require("fs");
messagesRoutes.setIo(io);
// messagesRoutesTest.setIo(io);

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
