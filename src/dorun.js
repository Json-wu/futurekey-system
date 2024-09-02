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

DoRunTotal('2024-08-31');
DoRunTotal('2024-09-01');

// DoRunTotal('2024-08-29');

// for (let i = 30; i > 0; i--) {
//   const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
//   console.log(date)
//   DoRunTotal('2024-08-29');
// }

// var i = 31;
// setTimeout(() => {
//   i = i-1;
//   const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
//   console.log(date,new Date());
//   DoRunTotal(date);
// }, 65000);
