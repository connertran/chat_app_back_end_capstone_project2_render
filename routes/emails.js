"use strict";
/**Routes for messages. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const Mail = require("../models/email");
const mailPost = require("../schemas/mailPost.json");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureSenderOrReceiverMails,
} = require("../middleware/auth");

const router = express.Router();

/** GET /emails/ => {messages: [{id, subjectLine, text, time}, ...]}
 *
 * Returns list of all emails.
 *
 * Authorization required: admin
 *
 */
router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const emails = await Mail.findAll();
    return res.json({ emails });
  } catch (e) {
    return next(e);
  }
});

/** GET /emails/ => {email: [{id, subjectLine, text, receiver, sender, time}]}
 *
 * Returns list of all emails.
 *
 * Authorization required: the user who sent or received this email
 *
 */
router.get(
  "/:id",
  ensureSenderOrReceiverMails,
  async function (req, res, next) {
    try {
      const email = await Mail.get(req.params.id);
      return res.json({ email });
    } catch (e) {
      return next(e);
    }
  }
);

/** POST /emails/ => {email: {id, subjectLine, sender, receiver, text, time}}
 *
 * Returns info of sent emails.
 *
 * Authorization required: logged in
 *
 */
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, mailPost);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const { subjectLine, text, mailUser, appUser, sentByAppUser } = req.body;
    const email = await Mail.send(
      subjectLine,
      text,
      appUser,
      mailUser,
      sentByAppUser
    );
    return res.json({ email });
  } catch (e) {
    return next(e);
  }
});

/**DELETE /emails/[id] => {deleted: `Email with id ${req.params.id}` }}
 *
 * Authorization required: admin
 */
router.delete("/:id", ensureAdmin, async function (req, res, next) {
  try {
    const del = await Mail.delete(req.params.id);
    return res.json({ deleted: `Email with id ${req.params.id}` });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
