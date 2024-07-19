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

/************************************** GET /users */

describe("GET /users", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          gmailAddress: "user1@user.com",
          bio: "I am a test user 1.",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          gmailAddress: "user2@user.com",
          bio: "I am a test user 2.",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          gmailAddress: "user3@user.com",
          bio: "I am a test user 3.",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for not admin", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  // check if the error-handling mechanism of the Express application is functioning correctly
  test("fails: test next() handler", async function () {
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/[username]", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .get("/users/u1")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
        isAdmin: false,
      },
    });
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/users/u1");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: username doesn't exist", async function () {
    const resp = await request(app)
      .get("/users/wronguser")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** GET /users/:uid */

describe("GET /users/[id]", function () {
  test("works for admins", async function () {
    await db.query(`INSERT INTO users (id, username, first_name, last_name, password, gmail_address, bio, is_admin) VALUES (
      1234,
      'john123',
      'John',
      'Clinton',
      'TestingPassword',
      'test@gmail.com',
      'I am video editor',
      FALSE
    )`);
    const resp = await request(app)
      .get("/users/id/1234")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "john123",
        firstName: "John",
        lastName: "Clinton",
        gmailAddress: "test@gmail.com",
        bio: "I am video editor",
        isAdmin: false,
      },
    });
  });

  test("works for logged in", async function () {
    await db.query(`INSERT INTO users (id, username, first_name, last_name, password, gmail_address, bio, is_admin) VALUES (
      1234,
      'john123',
      'John',
      'Clinton',
      'TestingPassword',
      'test@gmail.com',
      'I am video editor',
      FALSE
    )`);
    const resp = await request(app)
      .get("/users/id/1234")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        id: expect.any(Number),
        username: "john123",
        firstName: "John",
        lastName: "Clinton",
        gmailAddress: "test@gmail.com",
        bio: "I am video editor",
        isAdmin: false,
      },
    });
  });

  test("unauth for not logged-in", async function () {
    const resp = await request(app).get("/users/id/1234");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: id doesn't exist", async function () {
    const resp = await request(app)
      .get("/users/id/1234")
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** Patch /users/:username */

describe("PATCH /users/:username", () => {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "password1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "password1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
        isAdmin: false,
      },
    });
  });

  test("fails: for not correct user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "password1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  test("fails: not logged-in", async function () {
    const resp = await request(app).patch(`/users/u1`).send({
      password: "password1",
      firstName: "Kenny",
      lastName: "Cola",
      gmailAddress: "user1@user.com",
      bio: "I am a test user 1.",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
      .patch(`/users/wronguser`)
      .send({
        password: "password1",
        firstName: "Kenny",
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("fails: wrong json schema/ invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "password1",
        firstName: 123,
        lastName: "Cola",
        gmailAddress: "user1@user.com",
        bio: "I am a test user 1.",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /users/:username */
describe("DELETE /users/:username", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("works for same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  test("fails: if not same user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: not logged-in", async function () {
    const resp = await request(app).delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("fais: wrong username", async function () {
    const resp = await request(app)
      .delete(`/users/wrongusername`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
