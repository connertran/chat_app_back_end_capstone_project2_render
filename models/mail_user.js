"use strict";

const db = require("../db");

const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");

/** Related functions for users (mail_user), who don't use my app. */
class MailUser {
  static async mailUserCheck(gmailAddress) {
    const gmailCheck = await db.query(
      `SELECT id, gmail_address AS "gmailAddress" FROM mail_users WHERE gmail_address = $1`,
      [gmailAddress]
    );
    const mailUser = gmailCheck.rows[0];
    if (!mailUser) {
      const newMailUser = await db.query(
        `INSERT INTO mail_users (gmail_address) VALUES($1) RETURNING id, gmail_address AS "gmailAddress"`,
        [gmailAddress]
      );
      return newMailUser.rows[0];
    }
    return mailUser;
  }
  static async mailUserCheckId(id) {
    const gmailCheck = await db.query(
      `SELECT id, gmail_address AS "gmailAddress" FROM mail_users WHERE id = $1`,
      [id]
    );
    const mailUser = gmailCheck.rows[0];
    if (!mailUser) {
      throw new NotFoundError();
    }
    return mailUser;
  }
  /** Find all mail users
   *
   * Returns [{id, gmailAddress}, ...]
   */
  static async findAll() {
    const result = await db.query(
      `SELECT id, gmail_address AS "gmailAddress" FROM mail_users ORDER BY id`
    );
    return result.rows;
  }

  /** Given an id, return data about the gmail user.
   *
   * Returns {id, gmailAddress}
   *
   * Throws NotFoundError if gmail user not found
   */
  static async get(id) {
    const userRes = await db.query(
      `SELECT id, gmail_address AS "gmailAddress" FROM mail_users
      WHERE id = $1`,
      [id]
    );

    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No gmail user with this id: ${id}`);

    return user;
  }
  /**Add an gmail User to db.
   *
   * Returns {id, gmailAddress}
   *
   * * Throws BadRequestError if gmail is duplicated
   */

  static async add(mail) {
    const mailCheck = await db.query(
      `SELECT * FROM mail_users
      WHERE gmail_address = $1`,
      [mail]
    );
    if (mailCheck.rows[0])
      throw new BadRequestError(`Duplicated mail: ${mail}`);
    const newUser = await db.query(
      `INSERT INTO mail_users (gmail_address) VALUES ($1)
      RETURNING id, gmail_address AS "gmailAddress"`,
      [mail]
    );
    return newUser.rows[0];
  }

  /**Given mail user id, delete user from db.
   *
   * Returns undefined
   *
   * * Throws NotFoundError if mail user doesn't exist in db
   */
  static async delete(id) {
    let mailCheck = await db.query(`SELECT * FROM mail_users WHERE id = $1`, [
      id,
    ]);
    if (!mailCheck)
      throw new NotFoundError(`No mail user with this id: ${id}}`);

    await db.query(`DELETE FROM mail_users WHERE id = $1`, [id]);
  }
}

module.exports = MailUser;
