"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const db = require("../db.js");
const User = require("./user.js");
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

// AUTHENTICATION
describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("u1", "passwordforu1");
    expect(user).toEqual({
      username: "u1",
      firstName: "UF1",
      lastName: "UL1",
      gmailAddress: "u1@gmail.com",
      bio: "I am an editor.",
      isAdmin: false,
    });
  });

  test("throw error when the user doesn't exist in the databse", async function () {
    try {
      const user = await User.authenticate("fakeUsername", "wrongpassword");
      // if the code reaches the fail() function, it means the expected error did not occur, and the test should fail.
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });

  test("correct username but wrong password", async function () {
    try {
      const user = await User.authenticate("u1", "wrongpassword");
      fail();
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

// REGISTRATION
describe("register", function () {
  const newUser = {
    username: "usertest123",
    firstName: "User",
    lastName: "Test",
    gmailAddress: "test@gmail.com",
    isAdmin: false,
    bio: "I am a teacher",
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "shhhdonttell",
    });
    expect(user).toEqual(newUser);
    const dbCheck = await db.query(
      "SELECT * FROM users WHERE username = 'usertest123'"
    );
    expect(dbCheck.rows.length).toEqual(1);
    expect(dbCheck.rows[0].first_name).toEqual("User");
    expect(dbCheck.rows[0].is_admin).toEqual(false);
    expect(dbCheck.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "shhhdonttell",
      isAdmin: true,
    });
    const dbCheck = await db.query(
      "SELECT * FROM users WHERE username = 'usertest123'"
    );
    expect(dbCheck.rows.length).toEqual(1);
    expect(dbCheck.rows[0].first_name).toEqual("User");
    expect(dbCheck.rows[0].is_admin).toEqual(true);
    expect(dbCheck.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("fails: duplicate usernames", async function () {
    try {
      let user = await User.register({
        ...newUser,
        password: "shhhdonttell",
      });
      let user2 = await User.register({
        ...newUser,
        password: "shhhdonttell2",
      });
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  });
});

// user in db check with username
describe("userInDbCheck", function () {
  test("works", async function () {
    const user = await User.userInDbCheck("u1");
    expect(user.firstName).toEqual("UF1");
    expect(user.gmailAddress).toEqual("u1@gmail.com");
  });
  test("fails: user doesn't exist in db", async function () {
    try {
      const user = await User.userInDbCheck("thisusernamedoesn't exist");
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// user in db check with id
describe("userInDbCheckID", function () {
  test("works", async function () {
    const addUserForTesting = await db.query(
      "INSERT INTO users (id, username, first_name, last_name, password, gmail_address, bio, is_admin) VALUES (99999,'john123', 'John','Clinton','TestingPassword','test@gmail.com','I am video editor', FALSE);"
    );
    const user = await User.userInDbCheckID(99999);
    expect(user.firstName).toEqual("John");
    expect(user.username).toEqual("john123");
  });
  test("fails: id doesn't exist in db", async function () {
    try {
      const addUserForTesting = await db.query(
        "INSERT INTO users (id, username, first_name, last_name, password, gmail_address, bio, is_admin) VALUES (999999,'john1234', 'John2','Clinton2','TestingPassword2','test2@gmail.com','I am video editor', FALSE);"
      );
      const user = await User.userInDbCheckID(88888);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// FIND ALL USERS

describe("find all", function () {
  test("works: find all users in db", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "UF1",
        lastName: "UL1",
        gmailAddress: "u1@gmail.com",
        bio: "I am an editor.",
        isAdmin: false,
      },
      {
        username: "u2",
        firstName: "UF2",
        lastName: "UL2",
        gmailAddress: "u2@gmail.com",
        bio: "I am a teacher.",
        isAdmin: false,
      },
    ]);
  });
});

// get user from db
describe("get", function () {
  test("works", async function () {
    const user = await User.get("u1");
    expect(user.firstName).toEqual("UF1");
    expect(user.gmailAddress).toEqual("u1@gmail.com");
  });
  test("fails: user doesn't exist in db", async function () {
    try {
      const user = await User.get("thisusernamedoesn't exist");
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// update user
describe("update user", function () {
  const updateData = {
    password: "passwordforu1",
    firstName: "newUF1",
    lastName: "newUL1",
    gmailAddress: "newu1@email.com",
    bio: "I am a dancer.",
  };
  test("works", async function () {
    const user = await User.update("u1", updateData);
    expect(user).toEqual({
      username: "u1",
      firstName: "newUF1",
      lastName: "newUL1",
      gmailAddress: "newu1@email.com",
      bio: "I am a dancer.",
      isAdmin: false,
    });
  });
  test("fails: wrong password", async function () {
    try {
      updateData.password = "wrongpass";
      const user = await User.update("u1", updateData);
    } catch (e) {
      expect(e instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

// delete user from db
describe("delete", function () {
  test("works", async function () {
    await User.delete("u1");
    const res = await db.query("SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  test("fails: username doesn't exist", async function () {
    try {
      await User.delete("wrongusername");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
