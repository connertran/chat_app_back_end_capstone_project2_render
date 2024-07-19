"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const MailUser = require("./mail_user.js");

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

// mail user in db check with gmail address
describe("mailUserCheck", function () {
  test("works", async function () {
    const mailUser = await MailUser.mailUserCheck("test1@gmail.com");
    expect(mailUser.gmailAddress).toEqual("test1@gmail.com");
  });
  test("works: gmail address doesn't exist in db", async function () {
    const mailUser = await MailUser.mailUserCheck("fakemail@gmail.com");
    const userInDb = await db.query(
      `SELECT * FROM mail_users WHERE gmail_address = 'fakemail@gmail.com'`
    );
    expect(userInDb.rows.length).toEqual(1);
  });
});

// mail user in db check with id
describe("mailUserCheckId", function () {
  test("works", async function () {
    const addUserForTesting = await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (99999,'test9999@gmail.com')`
    );
    const mailUser = await MailUser.mailUserCheckId(99999);
    expect(mailUser.gmailAddress).toEqual("test9999@gmail.com");
  });
  test("fails: id doesn't exist in db", async function () {
    try {
      const addUserForTesting = await db.query(
        `INSERT INTO mail_users (id, gmail_address) VALUES (99999,'test9999@gmail.com')`
      );
      const mailUser = await MailUser.mailUserCheckId(8888);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// FINDALL

describe("find all mail users", function () {
  test("works", async function () {
    const mailUser = await MailUser.findAll();
    expect(mailUser).toEqual([
      {
        id: expect.any(Number),
        gmailAddress: "test@gmail.com",
      },
      {
        id: expect.any(Number),
        gmailAddress: "test2@gmail.com",
      },
      {
        id: expect.any(Number),
        gmailAddress: "test3@gmail.com",
      },
    ]);
  });
});

// GET

describe("get", function () {
  test("works", async function () {
    const addUserForTesting = await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (99999,'test9999@gmail.com')`
    );
    const mailUser = await MailUser.get(99999);
    expect(mailUser.gmailAddress).toEqual("test9999@gmail.com");
  });
  test("fails: id doesn't exist in db", async function () {
    try {
      const addUserForTesting = await db.query(
        `INSERT INTO mail_users (id, gmail_address) VALUES (99999,'test9999@gmail.com')`
      );
      const mailUser = await MailUser.get(8888);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// ADD
describe("register", function () {
  test("works", async function () {
    let newUser = await MailUser.add("newuser@gmail.com");
    const userCheck = await db.query(
      `SELECT * FROM mail_users WHERE gmail_address = 'newuser@gmail.com'`
    );
    expect(userCheck.rows.length).toEqual(1);
  });
});

// DELETE
describe("delete", function () {
  test("works", async function () {
    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (99999,'test9999@gmail.com')`
    );
    const userCheck = await db.query(
      `SELECT * FROM mail_users WHERE id = 99999`
    );
    expect(userCheck.rows.length).toEqual(1);

    await MailUser.delete(99999);
    const userCheckAfterBeingDeleted = await db.query(
      `SELECT * FROM mail_users WHERE id = 99999`
    );
    expect(userCheckAfterBeingDeleted.rows.length).toEqual(0);
  });
  test("fails: id doesn't exist in db", async function () {
    try {
      await MailUser.delete(88888);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});
