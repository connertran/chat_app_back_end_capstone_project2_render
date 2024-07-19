INSERT INTO users (username, first_name, last_name, password, gmail_address, bio, is_admin) VALUES (
  'john123',
  'John',
  'Clinton',
  'TestingPassword',
  'test@gmail.com',
  'I am video editor',
  FALSE
);


INSERT INTO messages (text) VALUES ('first app message');

INSERT INTO mail_users (gmail_address) VALUES('user1@gmail.com');

INSERT INTO mail_users (gmail_address) VALUES('user2@gmail.com');

INSERT INTO emails (subject_line, text) VALUES('Connections', 'Hi, it is nice to meet you.');