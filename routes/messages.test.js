"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const { createToken } = require("../helpers/tokens.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** GET /messages */
describe("GET /messages", function () {
  test("works for admins", async function () {
    // Mock Socket.io
    const io = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Set the mocked io instance
    const messagesRoutes = require("./messages");
    messagesRoutes.setIo(io);

    const resp = await request(app)
      .get("/messages")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      messages: [
        {
          id: expect.any(Number),
          text: "hello",
          time: expect.any(String),
        },
        {
          id: expect.any(Number),
          text: "hi",
          time: expect.any(String),
        },
      ],
    });
  });

  test("unauth for not admin", async function () {
    const resp = await request(app)
      .get("/messages")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/messages");
    expect(resp.statusCode).toEqual(401);
  });

  // check if the error-handling mechanism of the Express application is functioning correctly
  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE messages CASCADE");
    const resp = await request(app)
      .get("/messages")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /messages/conversation/:userone/:usertwo */
describe("GET /messages/conversation/:userone/:usertwo", function () {
  test("works for admins", async function () {
    const user1Id = await db.query(`SELECT * FROM users WHERE username= 'u1'`);
    const user2Id = await db.query(`SELECT * FROM users WHERE username= 'u2'`);
    const resp = await request(app)
      .get("/messages/conversation/u1/u2")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      conversation: [
        {
          id: expect.any(Number),
          sender: user1Id.rows[0].id,
          receiver: user2Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
        {
          id: expect.any(Number),
          sender: user2Id.rows[0].id,
          receiver: user1Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
      ],
    });
  });

  test("works for correct user but not admin", async function () {
    const user1Id = await db.query(`SELECT * FROM users WHERE username= 'u1'`);
    const user2Id = await db.query(`SELECT * FROM users WHERE username= 'u2'`);
    const resp = await request(app)
      .get("/messages/conversation/u1/u2")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      conversation: [
        {
          id: expect.any(Number),
          sender: user1Id.rows[0].id,
          receiver: user2Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
        {
          id: expect.any(Number),
          sender: user2Id.rows[0].id,
          receiver: user1Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
      ],
    });
  });

  test("works for correct user but not admin.", async function () {
    const user1Id = await db.query(`SELECT * FROM users WHERE username= 'u1'`);
    const user2Id = await db.query(`SELECT * FROM users WHERE username= 'u2'`);
    const resp = await request(app)
      .get("/messages/conversation/u1/u2")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.body).toEqual({
      conversation: [
        {
          id: expect.any(Number),
          sender: user1Id.rows[0].id,
          receiver: user2Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
        {
          id: expect.any(Number),
          sender: user2Id.rows[0].id,
          receiver: user1Id.rows[0].id,
          messageId: expect.any(Number),
          time: expect.any(String),
        },
      ],
    });
  });

  test("unauth for not logged in", async function () {
    const resp = await request(app).get("/messages/conversation/u1/u2");
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /messages/:id */

describe("GET /messages/[id]", function () {
  test("works for admins", async function () {
    await db.query(`INSERT INTO messages (id, text) VALUES (8888, 'testing')`);
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.'), (4321, 'testuser2', 'hello123', 'UF2', 'UL2', 'u2@gmail.com', 'I am a student.')`);
    await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES (1234,4321, '8888')`
    );
    const resp = await request(app)
      .get("/messages/8888")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      message: {
        id: 8888,
        receiver: "testuser2",
        sender: "testuser",
        text: "testing",
        time: expect.any(String),
        seen: false,
      },
    });
  });

  test("works for the sender/receiver but not admin", async function () {
    await db.query(`INSERT INTO messages (id, text) VALUES (8888, 'testing')`);
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.'), (4321, 'testuser2', 'hello123', 'UF2', 'UL2', 'u2@gmail.com', 'I am a student.')`);
    await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES (1234,4321, '8888')`
    );
    const resp = await request(app)
      .get("/messages/8888")
      .set(
        "authorization",
        `Bearer ${createToken({ username: "testuser", isAdmin: false })}`
      );
    expect(resp.body).toEqual({
      message: {
        id: 8888,
        receiver: "testuser2",
        sender: "testuser",
        text: "testing",
        time: expect.any(String),
        seen: false,
      },
    });
  });

  test("fails: not correct user and not an admin", async function () {
    await db.query(`INSERT INTO messages (id, text) VALUES (8888, 'testing')`);
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.'), (4321, 'testuser2', 'hello123', 'UF2', 'UL2', 'u2@gmail.com', 'I am a student.')`);
    await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES (1234,4321, '8888')`
    );
    const resp = await request(app)
      .get("/messages/8888")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: not logged-in", async function () {
    const resp = await request(app).get("/messages/8888");
    expect(resp.statusCode).toEqual(404);
  });

  test("fails: message id doesn't exist", async function () {
    const resp = await request(app)
      .get("/messages/8888")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /messages/:receiver */
describe("POST /messages/send/:receiver", function () {
  test("works for logged in", async function () {
    const resp = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    expect(resp.body).toEqual({
      message: {
        id: expect.any(Number),
        receiver: "u2",
        sender: "u1",
        text: "hello",
        time: expect.any(String),
      },
    });
  });
  test("fails: for not logged-in", async function () {
    const resp = await request(app).post("/messages/send/u2").send({
      text: "hello",
    });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** PATCH /messages/seen/:id */
describe("PATCH /messages/seen/:id", function () {
  test("works for admin", async function () {
    // sending message
    const resp = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });

    const resp2 = await request(app)
      .patch(`/messages/seen/${resp.body.message.id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp2.body).toEqual({
      seenMessage: {
        id: expect.any(Number),
        sender: expect.any(Number),
        receiver: expect.any(Number),
        messageid: resp.body.message.id,
        seen: true,
      },
    });
  });

  test("works for correct user but not admin", async function () {
    // sending message
    const resp = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });

    const resp2 = await request(app)
      .patch(`/messages/seen/${resp.body.message.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp2.body).toEqual({
      seenMessage: {
        id: expect.any(Number),
        sender: expect.any(Number),
        receiver: expect.any(Number),
        messageid: resp.body.message.id,
        seen: true,
      },
    });
  });

  test("fails: not logged in", async function () {
    // sending message
    const resp = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });

    const resp2 = await request(app).patch(
      `/messages/seen/${resp.body.message.id}`
    );
    expect(resp2.statusCode).toEqual(401);
  });
});

/************************************** DELETE /messages/:id */
describe("DELETE  /messages/:id", function () {
  test("works for admin", async function () {
    await db.query(`INSERT INTO messages (id, text) VALUES (8888, 'testing')`);
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.'), (4321, 'testuser2', 'hello123', 'UF2', 'UL2', 'u2@gmail.com', 'I am a student.')`);
    await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES (1234,4321, '8888')`
    );
    const resp = await request(app)
      .delete(`/messages/8888`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      deleted: "Message with id 8888",
    });
  });

  test("fails: not logged-in", async function () {
    const resp = await request(app).delete(`/messages/9999`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fais: wrong id/ id doesn't exist", async function () {
    const resp = await request(app)
      .delete(`/emails/9999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
