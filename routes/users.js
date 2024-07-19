"use strict";

/**Routes for users. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userUpdateSchema = require("../schemas/userUpdate.json");
const {
  ensureCorrectUserOrAdmin,
  ensureAdmin,
  ensureLoggedIn,
} = require("../middleware/auth");

const router = express.Router();

/** GET /users/ => {users: [{username, firstName, lastName, gmail_address, bio, isAdmin}, ...]}
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 *
 */
router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

/** GET /users/[username] => {user: {username, firstName, lastName, gmail_address, bio, isAdmin}}
 *
 * Returns user's info.
 *
 * Authorization required: logged in
 */
router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** GET /users/id/id => {user: {username, firstName, lastName, gmail_address, bio, isAdmin}}
 *
 * Returns user's info.
 *
 * Authorization required: logged in
 */
router.get("/id/:userid", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await User.userInDbCheckID(req.params.userid);
    delete user.password;
    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** PATCH /users/[username] {user} => {user}
 *
 * Data includes: {password, firstName, lastName, gmailAddress, bio}
 *
 * Returns {"user": {username, firstName, lastName, gmailAddress, bio, isAdmin}}
 *
 * Authorization required: admin or the user
 */

router.patch(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errors = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errors);
      }
      const newChange = await User.update(req.params.username, req.body);
      return res.json({ user: newChange });
    } catch (e) {
      return next(e);
    }
  }
);

/**DELETE /users/[usenrame] => {deleted: username}
 *
 *
 * Authorization required: admin or the user
 */

router.delete(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      await User.delete(req.params.username);
      return res.json({ deleted: req.params.username });
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
