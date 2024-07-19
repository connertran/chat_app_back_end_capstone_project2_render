"use strict";

const db = require("../db");

const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");

const User = require("./user");
const Message = require("./message");

class favouriteList {
  /** Given user's id get all user's favourite users
   *
   * Returns [{id, sender, receiver, time}, ...]
   *
   * NotFoundError if user doesn't exist in db
   */
  static async getAll(userId) {
    // throw NotFoundError if user doesn't exist in db
    await User.userInDbCheckID(userId);
    const result = await db.query(
      `SELECT f.id, f.sender, f.receiver, c.time 
       FROM favourite_list f 
       FULL JOIN chat_history c ON f.chat_history_id = c.id 
       WHERE f.sender = $1
       ORDER BY c.time`,
      [userId]
    );
    return result.rows;
  }

  /** Add users to the favourite_list
   *
   * Returns {id, sender, receiver, chatHistoryId}
   *
   * NotFoundError if user doesn't exist in db
   */
  static async add(sender, receiver) {
    // throw NotFoundError if user doesn't exist in db
    await User.userInDbCheckID(sender);
    await User.userInDbCheckID(receiver);
    const chatHistoryCheck = await db.query(
      `SELECT * FROM chat_history WHERE (user_one = $1 AND user_two = $2) OR (user_one = $2 AND user_two = $1)`,
      [sender, receiver]
    );
    if (!chatHistoryCheck.rows[0]) {
      throw new NotFoundError(
        `Can't add users into a favourite list yet, they haven't chat.`
      );
    }
    const chatHistoryId = chatHistoryCheck.rows[0].id;
    const result = await db.query(
      `INSERT INTO favourite_list (sender, receiver, chat_history_id) VALUES ($1, $2, $3)
      RETURNING sender, receiver, chat_history_id AS "chatHistoryId"`,
      [sender, receiver, chatHistoryId]
    );
    const resultWithTime = await db.query(
      `SELECT f.id, f.sender, f.receiver, c.time 
       FROM favourite_list f 
       FULL JOIN chat_history c ON f.chat_history_id = c.id 
       WHERE f.sender = $1 AND f.receiver = $2`,
      [sender, receiver]
    );
    return resultWithTime.rows[0];
  }

  /** Given ids of two users (sender, receiver), delete rows in table
   *
   * Returns undefined
   *
   * NotFoundError if user doesn't exist in db
   */
  static async delete(sender, receiver) {
    // throw NotFoundError if user doesn't exist in db
    const senderCheck = await User.userInDbCheckID(sender);
    const receiverCheck = await User.userInDbCheckID(receiver);

    const favouriteCheck = await db.query(
      `SELECT * FROM favourite_list WHERE sender = $1 AND receiver = $2`,
      [sender, receiver]
    );

    if (!favouriteCheck.rows[0])
      throw new NotFoundError(
        `User ${receiverCheck.username} is not ${senderCheck}'s favourite chat user. Can't delete`
      );

    const result = await db.query(
      `DELETE FROM favourite_list WHERE sender = $1 AND receiver = $2`,
      [sender, receiver]
    );
  }
}

module.exports = favouriteList;
