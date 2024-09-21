// db.js
const db = require('./libs/db');

/**
 * 创建表
 */
db.run("DROP TABLE IF EXISTS class_his;");
console.log('已清空class_his');
db.run("DROP TABLE IF EXISTS courses;");
console.log('已清空courses');
