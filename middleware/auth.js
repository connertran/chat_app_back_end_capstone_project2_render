"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const Mail = require("../models/email");
const Message = require("../models/message");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    let authHeader;
    if (req.headers) {
      authHeader = req.headers.authorization;
    } else {
      authHeader = undefined;
    }

    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (e) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Middleware to use when they be logged in as an admin user.
 *
 *  If not, raises Unauthorized.
 */

function ensureAdmin(req, res, next) {
  try {
    if (!res.locals.user || !res.locals.user.isAdmin)
      throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Middleware to use when they be logged in as an admin user & be user matching username provided as route param.
 *
 *  If not, raises Unauthorized.
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    if (!(user && (user.isAdmin || user.username === req.params.username)))
      throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Middleware to use when they be logged in as an admin user & be user matching username provided as route param.
 *
 *  If not, raises Unauthorized.
 */
function ensureCorrectUserOrAdminConversation(req, res, next) {
  try {
    const user = res.locals.user;
    if (
      !(
        user &&
        (user.isAdmin ||
          user.username === req.params.userone ||
          user.username === req.params.usertwo)
      )
    )
      throw new UnauthorizedError();
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Middleware to use when they be logged in as an admin user & be user who sent or received the email.
 *
 *  If not, raises Unauthorized.
 */
async function ensureSenderOrReceiverMails(req, res, next) {
  try {
    const mailId = req.params.id;
    const mail = await Mail.get(mailId);
    const sender = mail.sender;
    const receiver = mail.receiver;
    const currentUser = res.locals.user;
    if (
      !(
        currentUser &&
        (currentUser.isAdmin ||
          currentUser.username === sender ||
          currentUser.username === receiver)
      )
    ) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

async function ensureSenderOrReceiverMessage(req, res, next) {
  try {
    const messageId = req.params.id;
    const message = await Message.get(messageId);
    const sender = message.sender;
    const receiver = message.receiver;
    const currentUser = res.locals.user;
    if (
      !(
        currentUser &&
        (currentUser.isAdmin ||
          currentUser.username === sender ||
          currentUser.username === receiver)
      )
    ) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
  ensureSenderOrReceiverMails,
  ensureSenderOrReceiverMessage,
  ensureCorrectUserOrAdminConversation,
};
