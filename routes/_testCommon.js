"use strict";

const db = require("../db.js");
const User = require("../models/user.js");
const MailUser = require("../models/mail_user.js");
const Mail = require("../models/email.js");
const Message = require("../models/message.js");

const { createToken } = require("../helpers/tokens.js");

async function commonBeforeAll() {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM mail_users");
  await db.query("DELETE FROM emails");
  await db.query("DELETE FROM messages");

  await User.register({
    username: "u1",
    password: "password1",
    firstName: "U1F",
    lastName: "U1L",
    gmailAddress: "user1@user.com",
    bio: "I am a test user 1.",
    isAdmin: false,
  });
  await User.register({
    username: "u2",
    password: "password2",
    firstName: "U2F",
    lastName: "U2L",
    gmailAddress: "user2@user.com",
    bio: "I am a test user 2.",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    password: "password3",
    firstName: "U3F",
    lastName: "U3L",
    gmailAddress: "user3@user.com",
    bio: "I am a test user 3.",
    isAdmin: false,
  });

  await MailUser.add("mailuser@gmail.com");
  await MailUser.add("mailuser2@gmail.com");

  await Mail.send("Testing Subject", "hello", "u1", "mailuser@gmail.com", true);
  await Mail.send(
    "Testing Subject2",
    "hello2",
    "u1",
    "mailuser@gmail.com",
    false
  );
  await Message.send("hello", "u1", "u2");
  await Message.send("hi", "u2", "u1");
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
};
