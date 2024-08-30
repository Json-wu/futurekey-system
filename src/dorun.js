// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');
const moment = require('moment');
const { DoRunTotal } = require('./libs/scheduler');

/**
 * 创建表
 */
db.serialize(() => {
  //  db.run("DROP TABLE IF EXISTS sms_his");
   db.run("DROP TABLE IF EXISTS class_his");
});

for (let i = 29; i > 0; i--) {
  const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
  DoRunTotal(date);
}
