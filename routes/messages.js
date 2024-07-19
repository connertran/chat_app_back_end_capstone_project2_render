"use strict";

/**Routes for messages. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const Message = require("../models/message");
const messagePostSchema = require("../schemas/messagePost.json");
const {
  ensureAdmin,
  ensureLoggedIn,
  ensureSenderOrReceiverMessage,
  ensureCorrectUserOrAdminConversation,
} = require("../middleware/auth");

const router = express.Router();
let io;

/** GET /messages/ => {messages: [{id, text, time}, ...]}
 *
 * Returns list of all messages.
 *
 * Authorization required: admin
 */
router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const messages = await Message.findAll();
    return res.json({ messages });
  } catch (e) {
    return next(e);
  }
});

/** GET /messages/[id] => {message: {id, text, time, sender, receiver, seen}}
 *
 * Returns message's info.
 *
 * Authorization required: admin or the person who received/sent the message
 */
router.get(
  "/:id",
  ensureSenderOrReceiverMessage,
  async function (req, res, next) {
    try {
      const message = await Message.get(req.params.id);

      return res.json({ message });
    } catch (e) {
      return next(e);
    }
  }
);

/** GET /messages/conversation/:userone/:usertwo => {conversation: [{id, sender, receiver, message, time},...]}
 *
 * Returns message's info.
 *
 * Authorization required: admin or the person who received/sent the message
 */
router.get(
  "/conversation/:userone/:usertwo",
  ensureCorrectUserOrAdminConversation,
  async function (req, res, next) {
    try {
      const conversation = await Message.getConversation(
        req.params.userone,
        req.params.usertwo
      );

      return res.json({ conversation });
    } catch (e) {
      return next(e);
    }
  }
);

/**POST /messages/send/[receiver]=> {message: {id, text, sender, receiver,  time}}
 *
 * Returns info of sent messages.
 *
 * Authorization required: loged-in
 */
router.post("/send/:receiver", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, messagePostSchema);
    if (!validator.valid) {
      const errors = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errors);
    }
    const message = await Message.send(
      req.body.text,
      res.locals.user.username,
      req.params.receiver
    );

    // Emit the message to the specific rooms of sender and receiver
    io.to(res.locals.user.username).emit(
      "receive message",
      JSON.stringify({
        id: message.id,
        time: message.time,
        text: req.body.text,
        sender: res.locals.user.username,
        receiver: req.params.receiver,
      })
    );
    io.to(req.params.receiver).emit(
      "receive message",
      JSON.stringify({
        id: message.id,
        time: message.time,
        text: req.body.text,
        sender: res.locals.user.username,
        receiver: req.params.receiver,
      })
    );

    return res.status(201).json({ message });
  } catch (e) {
    return next(e);
  }
});

/**PATCH /messages/seen/[id]=> {seenMessage: {id, sender, receiver, messageId, seen}}
 *
 * Returns info of sent messages.
 *
 * Authorization required: admin or the person who received/sent the message
 */
router.patch(
  "/seen/:id",
  ensureSenderOrReceiverMessage,
  async function (req, res, next) {
    try {
      const messId = req.params.id;
      const readMess = await Message.readMessage(messId);
      return res.json({ seenMessage: readMess });
    } catch (e) {
      return next(e);
    }
  }
);

/**DELETE /messages/[id] => {deleted: `Message with id ${req.params.id}` }}
 * Authorization required: loggedin
 */
router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const del = await Message.delete(req.params.id);
    return res.json({ deleted: `Message with id ${req.params.id}` });
  } catch (e) {
    return next(e);
  }
});
function setIo(ioInstance) {
  io = ioInstance;
}

router.setIo = setIo;

module.exports = router;
