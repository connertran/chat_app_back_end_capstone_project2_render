"use strict";

/**Routes for chat_history. */

const express = require("express");
const { BadRequestError } = require("../expressError");
const ChatHistory = require("../models/chat_history");

const { ensureCorrectUserOrAdmin } = require("../middleware/auth");

const router = express.Router();

/** GET /chat-history/[username] => {conversations: [{id, userOne, userTwo, time}, ...]}
 *
 * Returns all conversations from this user.
 *
 * Authorization required: admin or correct user
 */
router.get(
  "/:username",
  ensureCorrectUserOrAdmin,
  async function (req, res, next) {
    try {
      const conversations = await ChatHistory.getAllConversations(
        req.params.username
      );
      return res.json({ conversations });
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
