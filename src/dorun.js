// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

/**
 * 创建表
 */
db.serialize(() => {
  //  db.run("DROP TABLE IF EXISTS sms_his");
   db.run("DROP TABLE IF EXISTS email_his");
});

module.exports = db;
