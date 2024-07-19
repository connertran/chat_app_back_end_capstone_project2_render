"use strict";

const bcrypt = require("bcrypt");

const { BadRequestError } = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

/**Given a password entered by user.
 * Compare it with the hashed password in db
 * return true, if the password is correct, otherwise return false
 */
async function comparePassword(password, hashedPass) {
  const passCheck = await bcrypt.compare(password, hashedPass);
  if (passCheck === true) return true;
  throw new BadRequestError(`The error: Password doesn't match`);
}
module.exports = { comparePassword };
