// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

/**
 * 创建表
 */
// db.run("DROP TABLE IF EXISTS class_his;");
// console.log('已清空class_his');
db.run("DELETE FROM courses WHERE 1=1;");
console.log('已清空courses');
db.run("DELETE FROM student_detail WHERE 1=1;");
console.log('已清空student_detail');
db.run("DELETE FROM leave WHERE 1=1;");
console.log('已清空leave');

