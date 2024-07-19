"use strict";

/**Routes for messages. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const favouriteList = require("../models/favourite_list");
const favouriteSchema = require("../schemas/favourite.json");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureSenderOrReceiverMessage,
  ensureCorrectUserOrAdminConversation,
  ensureCorrectUserOrAdmin,
} = require("../middleware/auth");

const router = express.Router();

/** GET /favourite/[id] => {favourite: [{id, sender, receiver, time}, ...]}
 *
 * Returns favourite status info.
 *
 * Authorization required: loggedin
 */
router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const favourite = await favouriteList.getAll(req.params.id);

    return res.json({ favourite });
  } catch (e) {
    return next(e);
  }
});

/**POST /favourite/=> {favourite: {sender, receiver, chatHistoryId}}
 *
 * Returns favourite status info.
 *
 * Authorization required: logged in
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, favouriteSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const favourite = await favouriteList.add(
      req.body.sender,
      req.body.receiver
    );
    return res.status(201).json({ favourite });
  } catch (e) {
    return next(e);
  }
});

/**DELETE /favourite/=> {
      deleted: `User with id ${req.body.receiver} from favourite list of user with id ${req.body.sender}`,
    }
 *
 * Returns favourite status info.
 *
 * Authorization required: logged in
 */

router.delete("/", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, favouriteSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const del = await favouriteList.delete(req.body.sender, req.body.receiver);
    return res.json({
      deleted: `User with id ${req.body.receiver} from favourite list of user with id ${req.body.sender}`,
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
