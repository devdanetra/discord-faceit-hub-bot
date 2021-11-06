const { DB_HOST, DB_NAME, DB_PWD, DB_USER } = require("./config.json");

var mysql = require('mysql');

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
  });

  module.exports = { pool };