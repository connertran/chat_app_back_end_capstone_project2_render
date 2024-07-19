const { BadRequestError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const bcrypt = require("bcrypt");
const { comparePassword } = require("./passCheck.js");

describe("comparePassword", function () {
  test("works", async function () {
    const password = "hello123";
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const passCheck = await comparePassword(password, hashedPassword);
    expect(passCheck).toEqual(true);
  });

  test("fails: wrong password", async function () {
    try {
      const password = "hello123";
      const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
      const passCheck = await comparePassword("hello1234", hashedPassword);
      fail();
    } catch (e) {
      expect(e instanceof BadRequestError).toBeTruthy();
    }
  });
});
