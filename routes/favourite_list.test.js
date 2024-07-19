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

/************************************** POST /favourite */
describe("POST /favourite", function () {
  test("works: logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const resp = await request(app)
      .post("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      favourite: {
        id: expect.any(Number),
        sender: u1Id,
        receiver: u2Id,
        time: expect.any(String),
      },
    });
  });
  test("fails: not logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const resp = await request(app).post("/favourite/").send({
      sender: u1Id,
      receiver: u2Id,
    });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /favourite */
describe("DELETE /favourite", function () {
  test("works: logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const add = await request(app)
      .post("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    const del = await request(app)
      .delete("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    expect(del.body).toEqual({
      deleted: expect.any(String),
    });
  });

  test("fails: not logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const add = await request(app)
      .post("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    const del = await request(app).delete("/favourite/").send({
      sender: u1Id,
      receiver: u2Id,
    });
    expect(del.statusCode).toEqual(401);
  });
});

/************************************** DELETE /favourite/:id */

describe("GET /favourite/[id]", function () {
  test("works: logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const add = await request(app)
      .post("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    const getAll = await request(app)
      .get(`/favourite/${u1Id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(getAll.body).toEqual({
      favourite: [
        {
          id: expect.any(Number),
          sender: u1Id,
          receiver: u2Id,
          time: expect.any(String),
        },
      ],
    });
  });

  test("works: logged in", async function () {
    const sendMess = await request(app)
      .post("/messages/send/u2")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        text: "hello",
      });
    const u1query = await db.query(
      `SELECT id FROM users WHERE username = 'u1'`
    );
    const u2query = await db.query(
      `SELECT id FROM users WHERE username = 'u2'`
    );
    const u1Id = u1query.rows[0].id;
    const u2Id = u2query.rows[0].id;
    const add = await request(app)
      .post("/favourite/")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        sender: u1Id,
        receiver: u2Id,
      });
    const getAll = await request(app).get(`/favourite/${u1Id}`);
    expect(getAll.statusCode).toEqual(401);
  });
});
