"use strict";

const app = require("./app");
const { PORT } = require("./config");
const Message = require("./models/message");
const User = require("./models/user");

const http = require("http");
const server = http.createServer(app);

// Ensure Socket.IO server is being used
const socketIO = require("socket.io");
const { FRONTEND_URL } = require("./config");

const io = socketIO(server, {
  cors: {
    origin: "https://chat-app-front-end-pi-green.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  path: "/socket.io",
  pingTimeout: 60000,
  pingInterval: 25000,
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

server.listen(PORT, function () {
  console.log(`Started on http://localhost:${PORT}`);
});
