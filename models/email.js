"use strict";
const db = require("../db");

const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");
const User = require("./user");
const MailUser = require("./mail_user");

/** Related functions for mails. */
class Mail {
  /** Find all mails
   *
   * Returns [{id, subjectLine, text, time}, ...]
   */
  static async findAll() {
    const result = await db.query(`SELECT id,
      subject_line AS "subjectLine", text, time FROM emails ORDER BY time`);
    return result.rows;
  }

  static async get(id) {
    const emailRes = await db.query(
      `SELECT id, subject_line AS "subjectLine", text, time FROM emails
      WHERE id = $1`,
      [id]
    );
    if (!emailRes.rows[0])
      throw new NotFoundError(`No email with this id: ${id}`);
    const mail = emailRes.rows[0];
    const mailInChatRes = await db.query(
      `
      SELECT user_id AS "userID",
      mail_user_id AS "mailUserId",
      sent_by_app_user AS "sentByAppUser"
      FROM mail_chat
      WHERE email_id = $1`,
      [id]
    );
    const mailInChat = mailInChatRes.rows[0];
    const appUser = await User.userInDbCheckID(mailInChat.userID);
    const mailUser = await MailUser.mailUserCheckId(mailInChat.mailUserId);
    if (mailInChat.sentByAppUser) {
      mail.sender = appUser.username;
      mail.receiver = mailUser.gmailAddress;
    } else {
      mail.sender = mailUser.gmailAddress;
      mail.receiver = appUser.username;
    }
    return mail;
  }

  /**Send an email and save it to db.
   *
   * Returns {id, subjectLine, text, sender, receiver, time}
   *
   */
  static async send(subject, mailText, appUser, mailUser, sentByAppUser) {
    const appUserCheck = await User.userInDbCheck(appUser);
    const mailUserCheck = await MailUser.mailUserCheck(mailUser);
    const mailRes = await db.query(
      `INSERT INTO emails (subject_line, text) VALUES ($1, $2)RETURNING id,
      subject_line AS "subjectLine", text, time`,
      [subject, mailText]
    );
    const mail = mailRes.rows[0];
    const mailChat = await db.query(
      `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES ($1,$2,$3,$4)`,
      [appUserCheck.id, mailUserCheck.id, mail.id, sentByAppUser]
    );
    if (sentByAppUser) {
      mail.sender = appUser;
      mail.receiver = mailUser;
    } else {
      mail.sender = mailUser;
      mail.receiver = appUser;
    }
    return mail;
  }

  /**Given email id, delete the message from db.
   *
   * Returns undefined
   *
   * * Throws NotFoundError if email doesn't exist in db
   */
  static async delete(id) {
    let mailCheck = await db.query(`SELECT * FROM emails WHERE id = $1`, [id]);
    if (!mailCheck.rows[0])
      throw new NotFoundError(`No email with this id: ${id}`);
    await db.query(`DELETE FROM emails WHERE id = $1`, [id]);
  }
}

module.exports = Mail;
