"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");

const {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const { comparePassword } = require("../helpers/passCheck.js");

/** Related functions for users. */
class User {
  /**Check if the user(username) exists in db
   *
   * Returns user
   *
   * Throws NotFoundError if user doesn't exist in db
   */
  static async userInDbCheck(username) {
    const userCheck = await db.query(
      `SELECT id,
              username,
              password,
              first_name as "firstName",
              last_name as "lastName",
              gmail_address AS "gmailAddress",
              bio,
              is_admin AS "isAdmin"
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = userCheck.rows[0];
    if (!user)
      throw new NotFoundError(`No user with this username: ${username}`);
    return user;
  }
  /**Check if the user(id) exists in db
   *
   * Returns true
   *
   * Throws NotFoundError if user doesn't exist in db
   */
  static async userInDbCheckID(userId) {
    const userCheck = await db.query(
      `SELECT id,
              username,
              password,
              first_name as "firstName",
              last_name as "lastName",
              gmail_address AS "gmailAddress",
              bio,
              is_admin AS "isAdmin"
      FROM users
      WHERE id = $1`,
      [userId]
    );
    const user = userCheck.rows[0];
    if (!user) throw new NotFoundError(`No user with this id: ${userId}`);
    return user;
  }
  /** authenticate user with username, password for app login
   *
   * Return {username, firstName, lastName, gmailAddress, bio, isAdmin}
   *
   * Throws UnauthorizedError if user is not found in db or wrong password
   */
  static async authenticate(username, password) {
    const user = await User.userInDbCheck(username);
    if (user) {
      const validPass = await bcrypt.compare(password, user.password);
      if (validPass === true) {
        delete user.id;
        delete user.password;
        return user;
      }
    }
    throw new UnauthorizedError("Invalid username/password");
  }

  /** Find all users
   *
   * Returns [{username, firstName, lastName, gmailAddress, bio, isAdmin}, ...]
   */
  static async findAll() {
    const result = await db.query(
      `SELECT username,
              first_name as "firstName",
              last_name as "lastName",
              gmail_address AS "gmailAddress",
              bio,
              is_admin AS "isAdmin"
      FROM users
      ORDER BY first_name`
    );
    return result.rows;
  }

  /** Given an username, return data about user.
   *
   * Returns {id, username, firstName, lastName, gmailAddress, bio, isAdmin}
   *
   * Throws NotFoundError if user not found
   */
  static async get(username) {
    const userRes = await db.query(
      `SELECT id, username,
              first_name AS "firstName",
              last_name AS "lastName",
              gmail_address AS "gmailAddress",
              bio,
              is_admin AS "isAdmin"
      FROM users
      WHERE username = $1`,
      [username]
    );
    const user = userRes.rows[0];
    if (!user) throw new NotFoundError(`No user: ${username}`);

    return user;
  }

  /**Register user with data.
   *
   * Returns {username, firstName, lastName, gmailAddress, bio, isAdmin}
   *
   * Throws BadRequestError on duplicates
   */
  static async register({
    username,
    password,
    firstName,
    lastName,
    gmailAddress,
    bio,
    isAdmin,
  }) {
    const duplicateCheck = await db.query(
      `SELECT username
      FROM users
      WHERE username = $1`,
      [username]
    );
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicated username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users
      (username,
      first_name,
      last_name,
      password,
      gmail_address,
      bio,
      is_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING username, first_name AS "firstName", last_name AS "lastName", gmail_address AS "gmailAddress", bio, is_admin AS "isAdmin"`,
      [
        username.toLowerCase(),
        firstName,
        lastName,
        hashedPassword,
        gmailAddress,
        bio,
        isAdmin,
      ]
    );
    const user = result.rows[0];
    return user;
  }

  /** Update user data with `data`.
   *
   * Before the function make any changes it will compare the password, which was entered by the user, and the hashed password in db
   *
   * Data includes:
   *    {password, firstName, lastName, gmailAddress, bio}
   *
   * Thows notFoundError if the username doesn't exist
   *
   * Returns updated user {username, firstName, lastName, gmailAddress, bio, isAdmin}
   */
  static async update(username, data) {
    const { password, firstName, lastName, gmailAddress, bio } = data;
    const userCheck = await db.query(
      `SELECT password
      FROM users
      WHERE username = $1`,
      [username]
    );
    await User.userInDbCheck(username);
    let querySql;
    if (password) {
      try {
        const correctPass = await comparePassword(
          password,
          userCheck.rows[0].password
        );
      } catch (e) {
        throw new UnauthorizedError("The password is not correct!");
      }
      querySql = await db.query(
        `
                        UPDATE users
                        SET first_name = $1,
                            last_name = $2,
                            gmail_address = $3,
                            bio = $4
                        WHERE username = $5
                        RETURNING username,
                            first_name AS "firstName",
                            last_name AS "lastName",
                            gmail_address AS "gmailAddress",
                            bio,
                            is_admin AS "isAdmin" `,
        [firstName, lastName, gmailAddress, bio, username]
      );
    }

    return querySql.rows[0];
  }

  /**Given user's username, delete the user from db.
   *
   * check if the user exists in db, if not, throw NotFoundError
   *
   * Returns undefined
   */
  static async delete(username) {
    await User.userInDbCheck(username);
    let result = await db.query(
      `DELETE
      FROM users
      WHERE username = $1`,
      [username]
    );
  }
}

module.exports = User;
