\echo 'Delete and recreate chat_app db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE chat_app;
CREATE DATABASE chat_app;
\connect chat_app

\i chat_schema.sql
\i chat_seed.sql

\echo 'Delete and recreate chat_app_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE chat_app_test;
CREATE DATABASE chat_app_test;
\connect chat_app_test

\i chat_schema.sql