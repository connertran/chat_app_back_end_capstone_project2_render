"use strict";

const moment = require("moment");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const db = require("../db.js");
const Message = require("./message");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// FIND ALL MESSAGES

describe("find all", function () {
  test("works: find all messages in db", async function () {
    const messages = await Message.findAll();

    expect(messages).toEqual([
      {
        id: expect.any(Number),
        text: "This is for testing.",
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        text: "This is for testing2.",
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        text: "This is for testing.",
        time: expect.any(Date),
      },
    ]);
  });
});

// Get

describe("get", function () {
  test("works: get a message from db", async function () {
    await db.query(
      `INSERT INTO messages (id, text, time) VALUES (99999,'This is for testing get function.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC')`
    );

    await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES (11111,22222, 99999)`
    );
    const message = await Message.get(99999);
    const normalizedMessages = {
      ...message,
      time: moment.utc(message.time).toISOString(),
    };
    expect(normalizedMessages).toEqual({
      id: 99999,
      receiver: "u2",
      sender: "u1",
      text: "This is for testing get function.",
      time: "2024-06-23T08:47:38.799Z",
      seen: false,
    });
  });

  test("fails: message id doesn't exist", async function () {
    try {
      await db.query(
        `INSERT INTO messages (id, text, time) VALUES (99999,'This is for testing get function.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC')`
      );

      await db.query(
        `INSERT INTO message_chat (sender, receiver, message_id) VALUES (11111,22222, 99999)`
      );
      let message = await Message.get(12345);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// GET A CONVERSATION BETWEEN TWO USERS

describe("works", function () {
  test("works", async function () {
    const send1 = await Message.send("test1", "u1", "u2");
    const send2 = await Message.send("test2", "u2", "u1");
    const messages = await Message.getConversation("u1", "u2");

    // there are three test because there is one more test I set up in the _testCommon.js file
    expect(messages).toEqual([
      {
        id: expect.any(Number),
        messageId: expect.any(Number),
        receiver: 22222,
        sender: 11111,
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        messageId: expect.any(Number),
        receiver: 22222,
        sender: 11111,
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        messageId: expect.any(Number),
        receiver: 11111,
        sender: 22222,
        time: expect.any(Date),
      },
    ]);
  });
});

// SEND A MESSAGE

describe("send", function () {
  test("works", async function () {
    const message = await Message.send("Hello", "u1", "u2");
    const messageCheck = await db.query(
      `SELECT * FROM messages WHERE text = 'Hello'`
    );
    expect(messageCheck.rows.length).toEqual(1);
  });
  test("fails: username doesn't exist in db", async function () {
    try {
      const message = await Message.send("Hello", "wrongusername", "u2");
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// READ A MESSAGE

describe("readMessage", function () {
  test("works", async function () {
    const message = await Message.send("Hello", "u1", "u2");
    const readCheck = await db.query(
      `SELECT * FROM message_chat WHERE message_id = $1`,
      [message.id]
    );
    expect(readCheck.rows[0].seen).toEqual(false);
    const readMess = await Message.readMessage(message.id);
    const readCheckAgain = await db.query(
      `SELECT * FROM message_chat WHERE message_id = $1`,
      [message.id]
    );
    expect(readCheckAgain.rows[0].seen).toEqual(true);
  });
  test("fails: id doesn't exist in db", async function () {
    try {
      const readMess = await Message.readMessage(999);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// DELETE A MESSAGE

describe("delete", function () {
  test("works", async function () {
    await db.query(
      `INSERT INTO messages (id, text) VALUES (99999, 'This is for testing.')`
    );
    const messageCheck = await db.query(
      `SELECT * FROM messages WHERE id = 99999`
    );
    expect(messageCheck.rows.length).toEqual(1);
    await Message.delete(99999);
    const messageCheckAfterBeingDeleted = await db.query(
      `SELECT * FROM messages WHERE id = 99999`
    );
    expect(messageCheckAfterBeingDeleted.rows.length).toEqual(0);
  });
  test("fails: message id doesn't exist", async function () {
    try {
      await Message.delete(99999);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});
