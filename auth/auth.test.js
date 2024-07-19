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
} = require("../routes/_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/register */
describe("POST /auth/register", function () {
  test("works for anon", async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "testuser",
      firstName: "test",
      lastName: "user",
      password: "password123",
      gmailAddress: "testuser@email.com",
      bio: "I am a business owner.",
    });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body.newUser).toEqual({
      username: "testuser",
      firstName: "test",
      lastName: "user",
      gmailAddress: "testuser@email.com",
      bio: "I am a business owner.",
      isAdmin: false,
      token: expect.any(String),
    });
  });

  test("fails: bad json schema/ invalid data", async function () {
    const resp = await request(app).post("/auth/register").send({
      username: "testuser",
      firstName: "test",
      lastName: "user",
    });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /auth/login */

describe("POST /auth/login", function () {
  test("works", async function () {
    const resp = await request(app).post("/auth/login").send({
      username: "u1",
      password: "password1",
    });
    expect(resp.body.user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      gmailAddress: "user1@user.com",
      bio: "I am a test user 1.",
      isAdmin: false,
      token: expect.any(String),
    });
  });

  test("fails: wrong username", async function () {
    const resp = await request(app).post("/auth/login").send({
      username: "wrongusername",
      password: "password1",
    });
    expect(resp.statusCode).toEqual(404);
  });

  test("fails: with wrong password", async function () {
    const resp = await request(app).post("/auth/login").send({
      username: "u1",
      password: "wrongpassword",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: bad json schema/ invalid data", async function () {
    const resp = await request(app).post("/auth/login").send({
      username: "u1",
    });
    expect(resp.statusCode).toEqual(400);
  });
});
