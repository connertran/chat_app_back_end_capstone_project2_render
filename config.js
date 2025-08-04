"use strict";

/** Shared config for application; can be required many places. */
require("dotenv").config();

require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-key";

const PORT = +process.env.PORT || 8000;

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? "postgresql://postgres:1234@localhost:5432/chat_app_test"
    : process.env.DATABASE_URL ||
        "postgresql://postgres:1234@localhost:5432/chat_app";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
//
// WJB: Evaluate in 2021 if this should be increased to 13 for non-test use
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Chat app Config:".green);
console.log("SECRET_KEY:".brightYellow, SECRET_KEY);
console.log("PORT:".brightYellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".brightYellow, BCRYPT_WORK_FACTOR);
console.log("Database:".brightYellow, getDatabaseUri());
console.log("---");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};
