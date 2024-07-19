"use strict";
const db = require("../db.js");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureAdmin,
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
  ensureSenderOrReceiverMails,
  ensureSenderOrReceiverMessage,
  ensureCorrectUserOrAdminConversation,
} = require("./auth");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("../models/_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const { SECRET_KEY } = require("../config");
const gooodJwt = jwt.sign({ username: "testuser", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrongkey");

describe("authenticateJWT", function () {
  test("works: working with the header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${gooodJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "testuser",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "testuser", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureAdmin", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdmin(req, res, next);
  });

  test("unauth if not logged in", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdmin(req, res, next);
  });
});

describe("ensureCorrectUserOrAdmin", function () {
  test("works", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("works: correct user but not admin", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("works: wrong user but admin", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test2", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth if wrong user", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: { user: { username: "test2", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth if not logged in", function () {
    expect.assertions(1);
    const req = { params: { username: "test" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdmin(req, res, next);
  });
});

describe("ensureCorrectUserOrAdminConversation", function () {
  test("works", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });

  test("works: correct user but not admin", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });

  test("works: correct user but not admin.", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: { user: { username: "test2", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });

  test("works: correct user but not admin.", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: { user: { username: "test3", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });

  test("unauth: wrong user", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: { user: { username: "test3", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });

  test("unauth: not logged in", function () {
    expect.assertions(1);
    const req = { params: { userone: "test", usertwo: "test2" } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureCorrectUserOrAdminConversation(req, res, next);
  });
});

describe("ensureSenderOrReceiverMails", function () {
  test("works: sender and admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 4321 } };
    const res = { locals: { user: { username: "u1", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMails(req, res, next);
  });

  test("works: receiver and admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 4321 } };
    const res = {
      locals: { user: { username: "test3@gmail.com", isAdmin: true } },
    };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMails(req, res, next);
  });

  test("works: wrong user but admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 4321 } };
    const res = {
      locals: { user: { username: "wrong", isAdmin: true } },
    };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMails(req, res, next);
  });

  test("fails: wrong user", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 4321 } };
    const res = {
      locals: { user: { username: "wrong", isAdmin: false } },
    };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    await ensureSenderOrReceiverMails(req, res, next);
  });

  test("fails: wrong user", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 4321 } };
    const res = {
      locals: {},
    };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    await ensureSenderOrReceiverMails(req, res, next);
  });
});

describe("ensureSenderOrReceiverMessage", function () {
  test("works: sender and admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 5555 } };
    const res = { locals: { user: { username: "u1", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMessage(req, res, next);
  });
  test("works: receiver and admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 5555 } };
    const res = { locals: { user: { username: "u2", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMessage(req, res, next);
  });

  test("works: wrong user but admin", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 5555 } };
    const res = { locals: { user: { username: "wrong", isAdmin: true } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    await ensureSenderOrReceiverMessage(req, res, next);
  });

  test("fails: wrong user", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 5555 } };
    const res = { locals: { user: { username: "wrong", isAdmin: false } } };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    await ensureSenderOrReceiverMessage(req, res, next);
  });

  test("fails: not logged-in", async function () {
    expect.assertions(1);

    // the id is taken from _testCommon.js
    const req = { params: { id: 5555 } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    await ensureSenderOrReceiverMessage(req, res, next);
  });
});
