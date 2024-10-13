// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

/**
 * 创建表
 */
// db.run("DROP TABLE IF EXISTS class_his;");
// console.log('已清空class_his');
db.run("DROP TABLE IF EXISTS courses;");
console.log('已清空courses');
db.run("DROP TABLE IF EXISTS student_detail;");
console.log('已清空student_detail');
db.run("DROP TABLE IF EXISTS leave;");
console.log('已清空leave');
db.run("DELETE from  message_info where 1=1;");
console.log('已清空message_info');

