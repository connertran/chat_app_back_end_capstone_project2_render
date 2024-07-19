"use strict";

const moment = require("moment");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const db = require("../db.js");

const Mail = require("./email.js");
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

// FIND ALL MAILS

describe("find all", function () {
  test("works: find all mails in db", async function () {
    const mails = await Mail.findAll();

    expect(mails).toEqual([
      {
        id: expect.any(Number),
        subjectLine: "Testing mail",
        text: "This is for testing.",
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        subjectLine: "Testing mail2",
        text: "This is for testing2.",
        time: expect.any(Date),
      },
      {
        id: expect.any(Number),
        subjectLine: "Testing subject",
        text: "This is for testing.",
        time: expect.any(Date),
      },
    ]);
  });
});

// Get

describe("get", function () {
  test("works: get a message from db", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line, text) VALUES (12345,'Testing subject', 'This is for testing get function.')`
    );

    await db.query(
      `INSERT INTO mail_users (id, gmail_address) VALUES (54321, 'newtest@gmail.com')
      RETURNING gmail_address AS gmailAddress`
    );

    await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (11111,54321, 12345, true)`
    );

    const mail = await Mail.get(12345);

    expect(mail).toEqual({
      id: 12345,
      receiver: "newtest@gmail.com",
      sender: "u1",
      subjectLine: "Testing subject",
      text: "This is for testing get function.",
      time: expect.any(Date),
    });
  });

  test("fails: message id doesn't exist", async function () {
    try {
      let mail = await Mail.get(10000);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// SEND AN EMAIL

describe("send", function () {
  test("works: send an email from db", async function () {
    const mail = await Mail.send(
      "testing subject",
      "hi, how are you?",
      "u1",
      "test@gmail.com",
      true
    );
    expect(mail).toEqual({
      id: expect.any(Number),
      subjectLine: "testing subject",
      text: "hi, how are you?",
      receiver: "test@gmail.com",
      sender: "u1",
      time: expect.any(Date),
    });
  });

  test("fails: username doesn't exist", async function () {
    try {
      const mail = await Mail.send(
        "testing subject",
        "hi, how are you?",
        "wrong username",
        "test@gmail.com",
        true
      );
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// DELETE A MESSAGE

describe("delete", function () {
  test("works", async function () {
    await db.query(
      `INSERT INTO emails (id, subject_line,text) VALUES (99999, 'testing subject line', 'This is for testing.')`
    );
    const mailCheck = await db.query(`SELECT * FROM emails WHERE id = 99999`);
    expect(mailCheck.rows.length).toEqual(1);
    await Mail.delete(99999);
    const mailCheckAfterBeingDeleted = await db.query(
      `SELECT * FROM messages WHERE id = 99999`
    );
    expect(mailCheckAfterBeingDeleted.rows.length).toEqual(0);
  });
  test("fails: email id doesn't exist", async function () {
    try {
      await Mail.delete(99999);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});
