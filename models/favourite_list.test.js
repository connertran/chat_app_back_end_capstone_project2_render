"use strict";

const moment = require("moment");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const db = require("../db.js");
const FavouriteList = require("./favourite_list.js");
const Message = require("./message.js");

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

// ADD
describe("Add user to favourite list", function () {
  test("works", async function () {
    // user has to send message first because they can create a favourite list of each other
    const message = await Message.send("Hello", "u1", "u2");
    const newFavouriteUser = await FavouriteList.add(11111, 22222);

    expect(newFavouriteUser).toEqual({
      id: expect.any(Number),
      sender: 11111,
      receiver: 22222,
      time: expect.any(Date),
    });
  });
  test("falis: users haven't texted before creating the favourite list", async function () {
    try {
      const newFavouriteUser = await FavouriteList.add(11111, 22222);
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });

  test("user doesn't exist in db", async function () {
    try {
      // user has to send message first because they can create a favourite list of each other
      const message = await Message.send("Hello", "u1", "u2");
      const newFavouriteUser = await FavouriteList.add(11111, 4321);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// DELETE
describe("delete", function () {
  test("works", async function () {
    const message = await Message.send("Hello", "u1", "u2");
    const newFavouriteUser = await FavouriteList.add(11111, 22222);
    const favouriteCheck = await db.query(
      `SELECT * FROM favourite_list WHERE sender=11111 AND receiver=22222`
    );
    expect(favouriteCheck.rows.length).toEqual(1);
    const del = await FavouriteList.delete(11111, 22222);
    const favouriteCheckAgain = await db.query(
      `SELECT * FROM favourite_list WHERE sender=11111 AND receiver=22222`
    );
    expect(favouriteCheckAgain.rows.length).toEqual(0);
  });
  test("fails: can't delete if the user is not in the favourite list", async function () {
    try {
      await FavouriteList.delete(11111, 22222);
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

// GET ALL
describe("getAll", function () {
  test("works", async function () {
    const message = await Message.send("Hello", "u1", "u2");
    const newFavouriteUser = await FavouriteList.add(11111, 22222);
    const getAll = await FavouriteList.getAll(11111);
    expect(getAll).toEqual([
      {
        id: expect.any(Number),
        sender: 11111,
        receiver: 22222,
        time: expect.any(Date),
      },
    ]);
  });
  test("works: favourite is empty, when the user added anyone to their favourite list", async function () {
    const getAll = await FavouriteList.getAll(11111);
    expect(getAll).toEqual([]);
  });
});
