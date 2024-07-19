const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config.js");

const { createToken } = require("../helpers/tokens.js");

async function commonBeforeAll() {
  // make sure the db is empty before testing
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM mail_users");
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM emails ");
  await db.query("DELETE FROM mail_chat");

  await db.query(
    `INSERT INTO users (id, username, password, first_name, last_name,  gmail_address, bio)
    VALUES (11111, 'u1', $1, 'UF1', 'UL1', 'u1@gmail.com', 'I am an editor.'),
           (22222, 'u2', $2, 'UF2', 'UL2', 'u2@gmail.com', 'I am a teacher.')
    RETURNING username, first_name AS "firstName", last_name AS "lastName", gmail_address AS "gmailAddress", bio`,
    [
      await bcrypt.hash("passwordforu1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("passwordforu2", BCRYPT_WORK_FACTOR),
    ]
  );

  await db.query(
    `INSERT INTO mail_users (gmail_address) VALUES ('test@gmail.com'), ('test2@gmail.com')
    RETURNING gmail_address AS gmailAddress`
  );

  await db.query(
    `INSERT INTO mail_users (id, gmail_address) VALUES (1234,'test3@gmail.com')
    RETURNING gmail_address AS gmailAddress`
  );

  await db.query(
    `INSERT INTO messages (text, time) VALUES ('This is for testing.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC'), ('This is for testing2.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC')`
  );
  await db.query(
    `INSERT INTO messages (id, text) VALUES (5555, 'This is for testing.')`
  );
  await db.query(
    `INSERT INTO emails (subject_line, text, time) VALUES ('Testing mail','This is for testing.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC'), ('Testing mail2', 'This is for testing2.', '2024-06-23T08:47:38.799Z'::timestamp at time zone 'UTC')`
  );

  await db.query(
    `INSERT INTO emails (id, subject_line, text) VALUES (4321,'Testing subject','This is for testing.')`
  );
  await db.query(
    `INSERT INTO mail_chat (user_id, mail_user_id, email_id, sent_by_app_user) VALUES (11111, 1234, 4321, true)`
  );
  await db.query(
    `INSERT INTO message_chat (sender, receiver, message_id) VALUES (11111, 22222, 5555)`
  );
}
async function commonBeforeEach() {
  await db.query("BEGIN");
}

// we want the initial data, that we set in commonBeforeAll(), to be the same before each test
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  // This command closes the connection to the database.
  await db.end();
}

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};
