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

/************************************** GET /emails */
describe("GET /emails", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/emails")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      emails: [
        {
          id: expect.any(Number),
          subjectLine: "Testing Subject",
          text: "hello",
          time: expect.any(String),
        },
        {
          id: expect.any(Number),
          subjectLine: "Testing Subject2",
          text: "hello2",
          time: expect.any(String),
        },
      ],
    });
  });

  test("unauth for not admin", async function () {
    const resp = await request(app)
      .get("/emails")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/emails");
    expect(resp.statusCode).toEqual(401);
  });

  // check if the error-handling mechanism of the Express application is functioning correctly
  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE emails CASCADE");
    const resp = await request(app)
      .get("/emails")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /emails/:id */

describe("GET /emails/[id]", function () {
  test("works for admins", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (8888, 'testing', 'hello testing')`
    );
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.')`);
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999,'test@gmail.com')`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (1234, 9999, 8888, true)`
    );
    const resp = await request(app)
      .get("/emails/8888")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      email: {
        id: 8888,
        receiver: "test@gmail.com",
        sender: "testuser",
        subjectLine: "testing",
        text: "hello testing",
        time: expect.any(String),
      },
    });
  });

  test("works for correct user but not admin", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (8888, 'testing', 'hello testing')`
    );
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.')`);
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999,'test@gmail.com')`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (1234, 9999, 8888, true)`
    );
    const resp = await request(app)
      .get("/emails/8888")
      .set(
        "authorization",
        `Bearer ${createToken({ username: "testuser", isAdmin: false })}`
      );
    expect(resp.body).toEqual({
      email: {
        id: 8888,
        receiver: "test@gmail.com",
        sender: "testuser",
        subjectLine: "testing",
        text: "hello testing",
        time: expect.any(String),
      },
    });
  });

  test("unauth for not admin and not the correct user", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (8888, 'testing', 'hello testing')`
    );
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.')`);
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999,'test@gmail.com')`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (1234, 9999, 8888, true)`
    );
    const resp = await request(app)
      .get("/emails/8888")
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (8888, 'testing', 'hello testing')`
    );
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.')`);
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999,'test@gmail.com')`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (1234, 9999, 8888, true)`
    );
    const resp = await request(app).get("/emails/8888");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: id doesn't exist", async function () {
    const resp = await request(app)
      .get("/users/8888")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /emails */
describe("POST /emails", function () {
  test("works for logged in", async function () {
    const resp = await request(app)
      .post("/emails")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        subjectLine: "Testing email",
        text: "hello",
        mailUser: "test@gmail.com",
        appUser: "u1",
        sentByAppUser: true,
      });
    expect(resp.body).toEqual({
      email: {
        id: expect.any(Number),
        receiver: "test@gmail.com",
        sender: "u1",
        subjectLine: "Testing email",
        text: "hello",
        time: expect.any(String),
      },
    });
  });
  test("fails: for not logged-in", async function () {
    const resp = await request(app).post("/emails").send({
      subjectLine: "Testing email",
      text: "hello",
      mailUser: "test@gmail.com",
      appUser: "u1",
      sentByAppUser: true,
    });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /emails/:id */
describe("DELETE  /emails/:id", function () {
  test("works for admin", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (8888, 'testing', 'hello testing')`
    );
    await db.query(`INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (1234, 'testuser', 'hello123', 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.')`);
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999,'test@gmail.com')`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (1234, 9999, 8888, true)`
    );
    const resp = await request(app)
      .delete(`/emails/8888`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      deleted: "Email with id 8888",
    });
  });

  test("fails: not logged-in", async function () {
    const resp = await request(app).delete(`/emails/9999`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fais: wrong id/ id doesn't exist", async function () {
    const resp = await request(app)
      .delete(`/emails/9999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
