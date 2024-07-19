"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");

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

/************************************** GET /chat-history/:username */
describe("GET /chat-history/:username", function () {
  test("works for admins", async function () {
    await request(app)
      .post("/messages/send/u2")
      .send({
        text: "hello",
      })
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .get("/chat-history/u1")
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      conversations: [
        {
          id: expect.any(Number),
          userOne: expect.any(Number),
          userTwo: expect.any(Number),
          time: expect.any(String),
        },
      ],
    });
  });

  test("works for the correct user", async function () {
    await request(app)
      .post("/messages/send/u2")
      .send({
        text: "hello",
      })
      .set("authorization", `Bearer ${u1Token}`);

    const resp = await request(app)
      .get("/chat-history/u1")
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.body).toEqual({
      conversations: [
        {
          id: expect.any(Number),
          userOne: expect.any(Number),
          userTwo: expect.any(Number),
          time: expect.any(String),
        },
      ],
    });
  });

  test("unauth for not admin and not the correct user", async function () {
    const resp = await request(app)
      .get("/chat-history/u1")
      .set("authorization", `Bearer ${u2Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/chat-history/u1");

    expect(resp.statusCode).toEqual(401);
  });

  test("fails: username doesn't exist", async function () {
    const resp = await request(app)
      .get("/chat-history/wrong")
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(404);
  });
});
