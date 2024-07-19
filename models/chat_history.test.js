"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const db = require("../db.js");
const ChatHistory = require("./chat_history.js");
const Message = require("./message.js");
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

describe("updateConversation", function () {
  test("works: save a conversation into chat_history table in db as a new conversation", async function () {
    const conversationCheck = await db.query(
      `SELECT * FROM chat_history WHERE user_one = $1 AND user_two = $2`,
      [11111, 22222]
    );
    expect(conversationCheck.rows[0]).toEqual(undefined);
    const conversation = await ChatHistory.updateConversation("u1", "u2");

    const conversationCheckAgain = await db.query(
      `SELECT id, user_one AS "userOne", user_two AS "userTwo", time FROM chat_history WHERE user_one = $1 AND user_two = $2`,
      [11111, 22222]
    );
    expect(conversationCheckAgain.rows[0]).toEqual({
      id: expect.any(Number),
      userOne: 11111,
      userTwo: 22222,
      time: expect.any(Date),
    });
  });

  test("works: update a conversation into chat_history table in db", async function () {
    const conversation = await ChatHistory.updateConversation("u1", "u2");

    const conversation2 = await ChatHistory.updateConversation("u1", "u2");

    const conversationCheck = await db.query(
      `SELECT id, user_one AS "userOne", user_two AS "userTwo", time FROM chat_history WHERE user_one = $1 AND user_two = $2`,
      [11111, 22222]
    );
    expect(conversationCheck.rows.length).toEqual(1);
    expect(conversationCheck.rows[0]).toEqual({
      id: expect.any(Number),
      userOne: 11111,
      userTwo: 22222,
      time: expect.any(Date),
    });
  });
});

describe("getAllConversations", function () {
  test("works: username exists in db", async function () {
    const conversation = await ChatHistory.updateConversation("u1", "u2");
    const newUser = await db.query(`
      INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (33333, 'u3', 'password123', 'UF3', 'UL3', 'u3@gmail.com', 'I am an editor.')
      `);
    const conversation2 = await ChatHistory.updateConversation("u1", "u3");

    const allConversations = await ChatHistory.getAllConversations("u1");
    expect(allConversations).toEqual([
      {
        id: expect.any(Number),
        userOne: 11111,
        userTwo: 22222,
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        userOne: 11111,
        userTwo: 33333,
        time: expect.any(Date),
      },
    ]);
  });
  test("fails but no errors: username didn't start a conversation with anyone", async function () {
    const allConversations = await ChatHistory.getAllConversations("u1");
    expect(allConversations.length).toEqual(0);
  });
  test("fais: username doesn't exist in db", async function () {
    const conversation = await ChatHistory.updateConversation("u1", "u2");
    try {
      const allConversations = await ChatHistory.getAllConversations("u3");
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});
