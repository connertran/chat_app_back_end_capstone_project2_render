"use strict";

const db = require("../db");

const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");
const User = require("./user");
const ChatHistory = require("./chat_history");
/** Related functions for messages. */
class Message {
  /** Find all messages
   *
   * Returns [{id, text, time}, ...]
   */
  static async findAll() {
    const result = await db.query(`SELECT * FROM messages ORDER BY time`);
    return result.rows;
  }

  /** Given an id, return data about the message.
   *
   * Returns {id, text, time, seen}
   *
   * Throws NotFoundError if message not found
   */
  static async get(id) {
    const messRes = await db.query(
      `SELECT * FROM messages
      WHERE id = $1`,
      [id]
    );
    const messChat = await db.query(
      `SELECT sender, receiver, seen FROM message_chat WHERE message_id = $1`,
      [id]
    );
    const message = messRes.rows[0];
    if (!message) throw new NotFoundError(`No message with this id: ${id}`);
    const messSender = await User.userInDbCheckID(messChat.rows[0].sender);
    const messReceiver = await User.userInDbCheckID(messChat.rows[0].receiver);
    message.sender = messSender.username;
    message.receiver = messReceiver.username;
    message.seen = messChat.rows[0].seen;
    return message;
  }

  /** Given an usenames of user1 and user2, return the conversation between them.
   *
   * Returns [{id, sender, receiver, messageId, time},...]
   *
   * Throws NotFoundError if user not found
   */
  static async getConversation(userOne, userTwo) {
    const userOneObj = await User.userInDbCheck(userOne);
    const userTwoObj = await User.userInDbCheck(userTwo);
    const conversation = await db.query(
      `
      SELECT c.id, c.sender, c.receiver, c.message_id AS "messageId", m.time
      FROM message_chat c
      JOIN messages m ON c.message_id = m.id
      WHERE (c.sender = $1 AND c.receiver = $2)
         OR (c.sender = $2 AND c.receiver = $1)
      ORDER BY m.time`,
      [userOneObj.id, userTwoObj.id]
    );
    return conversation.rows;
  }

  /** Given a message id, update the seen status of the message.
   *
   * Returns {id, sender, receiver, messageId, seen}
   *
   * Throws NotFoundError if user not found
   */
  static async readMessage(id) {
    // check message in db
    await Message.get(id);
    const seenMessage = await db.query(
      `
      UPDATE message_chat
      SET seen = true
      WHERE message_id = $1
      RETURNING id, sender, receiver, message_id AS messageId, seen
      `,
      [id]
    );
    return seenMessage.rows[0];
  }
  /**Send a message and save it to the message_chat table in db.
   *
   * Returns {id, text, time, sender, receiver}
   *
   * * Throws NotFoundError if user doesn't exist in db
   */
  static async send(messageText, sender, receiver) {
    const messSender = await User.userInDbCheck(sender);
    const messReceiver = await User.userInDbCheck(receiver);
    const messRes = await db.query(
      `INSERT INTO messages
      (text) VALUES ($1)
      RETURNING id, text, time`,
      [messageText]
    );
    const message = messRes.rows[0];
    await ChatHistory.updateConversation(
      messSender.username,
      messReceiver.username
    );
    const chat = await db.query(
      `INSERT INTO message_chat (sender, receiver, message_id) VALUES ($1,$2,$3)`,
      [messSender.id, messReceiver.id, message.id]
    );
    message.sender = messSender.username;
    message.receiver = messReceiver.username;
    return message;
  }

  /**Given message id, delete the message from db.
   *
   * Returns undefined
   *
   * * Throws NotFoundError if message doesn't exist in db
   */
  static async delete(messId) {
    let messCheck = await db.query(`SELECT * FROM messages WHERE id = $1`, [
      messId,
    ]);
    if (!messCheck.rows[0])
      throw new NotFoundError(`No message with this id: ${messId}`);

    await db.query(`DELETE FROM messages WHERE id = $1`, [messId]);
  }
}

module.exports = Message;
