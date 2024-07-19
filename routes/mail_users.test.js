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

/************************************** GET /mail-users */

describe("GET /mail-users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/mail-users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          id: expect.any(Number),
          gmailAddress: "mailuser@gmail.com",
        },
        {
          id: expect.any(Number),
          gmailAddress: "mailuser2@gmail.com",
        },
      ],
    });
  });

  test("unauth for not admin", async function () {
    const resp = await request(app)
      .get("/mail-users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/mail-users");
    expect(resp.statusCode).toEqual(401);
  });

  // check if the error-handling mechanism of the Express application is functioning correctly
  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE mail_users CASCADE");
    const resp = await request(app)
      .get("/mail-users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /mail-users/:id */

describe("GET /mail-users/[id]", function () {
  test("works for admins", async function () {
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999, 'testing@gmail.com')`
    );
    const resp = await request(app)
      .get("/mail-users/9999")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        gmailAddress: "testing@gmail.com",
      },
    });
  });

  test("fails: not admin", async function () {
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999, 'testing@gmail.com')`
    );
    const resp = await request(app)
      .get("/mail-users/9999")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: not logged-in", async function () {
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999, 'testing@gmail.com')`
    );
    const resp = await request(app).get("/mail-users/9999");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: id doesn't exist", async function () {
    const resp = await request(app)
      .get("/mail-users/9999")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** POST /mail-users */
describe("POST /mail-users", function () {
  test("works for loggedin", async function () {
    const resp = await request(app)
      .post("/mail-users")
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        gmailAddress: "newuser@gmail.com",
      });
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        gmailAddress: "newuser@gmail.com",
      },
    });
  });

  test("fails: for not logged-in", async function () {
    const resp = await request(app).post("/mail-users").send({
      gmailAddress: "newuser@gmail.com",
    });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** DELETE /mail-users/:id */
describe("DELETE  /mail-users/:id", function () {
  test("works for admin", async function () {
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (9999, 'testing@gmail.com')`
    );
    const resp = await request(app)
      .delete(`/mail-users/9999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      deleted: "Mail user with email: testing@gmail.com",
    });
  });

  test("fails: not logged-in", async function () {
    const resp = await request(app).delete(`/mail-users/9999`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fais: wrong username", async function () {
    const resp = await request(app)
      .delete(`/mail-users/9999`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
