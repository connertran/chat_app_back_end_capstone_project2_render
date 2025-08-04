"use strict";

/** Express app for chat app. */

const express = require("express");
// using cors to communicate with the front-end
const cors = require("cors");
const { FRONTEND_URL } = require("./config");
const { NotFoundError } = require("./expressError");

const userRoutes = require("./routes/users");
const authRoutes = require("./auth/auth");
const messagesRoutes = require("./routes/messages");
const mailUsersRoutes = require("./routes/mail_users");
const emailsRoutes = require("./routes/emails");
const chatHistoryRoutes = require("./routes/chat_history");
const favouriteListRoutes = require("./routes/favourite_list");
const { authenticateJWT } = require("./middleware/auth");

const morgan = require("morgan");

const app = express();

app.use(
  cors({
    origin: "https://chat-app-front-end-pi-green.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

app.use("/auth/", authRoutes);
app.use("/users/", userRoutes);
app.use("/messages/", messagesRoutes);
app.use("/mail-users/", mailUsersRoutes);
app.use("/emails/", emailsRoutes);
app.use("/chat-history/", chatHistoryRoutes);
app.use("/favourite/", favouriteListRoutes);
/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
