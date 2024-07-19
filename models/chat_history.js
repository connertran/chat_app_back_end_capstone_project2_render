"use strict";

const db = require("../db");
const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");

const User = require("./user");

/** Related functions for message chats. */
class ChatHistory {
  /** Given an usernames of two app users, return data about the conversation between two people.
   *
   * Returns {id, userOne, userTwo, time}
   *
   * Throws NotFoundError if user not found
   */
  static async updateConversation(userOne, userTwo) {
    const userOneObj = await User.userInDbCheck(userOne);
    const userTwoObj = await User.userInDbCheck(userTwo);
    const conversation = await db.query(
      `
      SELECT id, user_one, user_two FROM chat_history WHERE (user_one = $1 AND user_two = $2) OR (user_one = $2 AND user_two = $1)`,
      [userOneObj.id, userTwoObj.id]
    );

    const conversationInDb = conversation.rows[0];
    if (!conversationInDb) {
      const newConversation = await db.query(
        `
        INSERT INTO chat_history (user_one, user_two) VALUES ($1,$2) RETURNING id, user_one AS "userOne", user_two AS "userTwo", time`,
        [userOneObj.id, userTwoObj.id]
      );

      return newConversation.rows[0];
    }
    const updateConversation = await db.query(
      `UPDATE chat_history 
       SET user_one = $1, 
           user_two = $2, 
           time = NOW() 
       WHERE id = $3 
       RETURNING id, user_one AS "userOne", user_two AS "userTwo", time`,
      [userOneObj.id, userTwoObj.id, conversationInDb.id]
    );
    return updateConversation.rows[0];
  }

  /** Given an username, return data of all the conversations from this user.
   *
   * Returns [{id, userOne, userTwo, time}, ...]
   *
   * Throws NotFoundError if user not found
   */
  static async getAllConversations(username) {
    const userCheck = await User.userInDbCheck(username);
    const conversations = await db.query(
      `SELECT id, user_one AS "userOne", user_two AS "userTwo", time FROM chat_history WHERE user_one = $1 or user_two = $1 ORDER BY time DESC`,
      [userCheck.id]
    );
    return conversations.rows;
  }
}

module.exports = ChatHistory;
