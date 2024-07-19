"use strict";

/**Routes for mail_users. */
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");

const MailUser = require("../models/mail_user");
const mailUserAddSchema = require("../schemas/mailUserAdd.json");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");

const router = express.Router();

/** GET /mail-users/ => {users: [{id, gmailAddress}, ...]}
 *
 * Returns list of all mailUsers.
 *
 * Authorization required: admin
 */
router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await MailUser.findAll();
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

/** GET /mail-users/[id] => {user: {id, gmailAddress}}
 *
 * Returns mail user's info.
 *
 * Authorization required: admin
 *
 */
router.get("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const user = await MailUser.get(req.params.id);

    return res.json({ user });
  } catch (e) {
    return next(e);
  }
});

/** POST /mail-users/ => {user: {id, gmailAddress}}
 *
 * Returns mail user's info.
 *
 * Authorization required: loged-in
 *
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, mailUserAddSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const user = await MailUser.add(req.body.gmailAddress);

    return res.status(201).json({ user });
  } catch (e) {
    return next(e);
  }
});

/** DELETE /mail-users/[id] => {deleted: `Mail user with email: ${mail}`}
 *
 * Returns mail user's info.
 *
 * Authorization required: admin
 */
router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const findUser = await MailUser.get(req.params.id);
    const mail = findUser.gmailAddress;
    const del = await MailUser.delete(req.params.id);
    return res.json({ deleted: `Mail user with email: ${mail}` });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
