"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const userRegisterSchema = require("../schemas/userRegister.json");
const userAuthSchema = require("../schemas/userAuthSchema.json");
const { BadRequestError } = require("../expressError");

/** POST /auth/login:  { username, password } => { user: {username, firstName, lastName, gmailAddress, bio, isAdmin, token} }
 *
 * Returns JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/login", async function (req, res, next) {
  try {
    const validJson = jsonschema.validate(req.body, userAuthSchema);
    if (!validJson.valid) {
      const errs = validJson.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    user.token = token;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** POST /auth/register:   { user } => { newUser: {username, firstName, lastName, gmailAddress, bio, isAdmin, token} }
 *
 * user must include { username, password, firstName, lastName, gmailAddress, bio
 *
 * Returns { username, password, firstName, lastName, gmailAddress, bio, isAdmin, token}
 *  JWT token which can be used to authenticate further requests.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const erros = validator.errors.map((e) => e.stack);
      throw new BadRequestError(erros);
    }

    const newUser = await User.register({ ...req.body, isAdmin: false });
    const token = createToken(newUser);
    newUser.token = token;
    return res.status(201).json({ newUser });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
