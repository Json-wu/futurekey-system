// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

/**
 * 创建表
 */
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, level TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS teamup_data (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS courses (id TEXT, subid TEXT, title TEXT, teacher TEXT, student TEXT, attend TEXT, time TEXT, date TEXT,tz TEXT,value1 TEXT,value2 TEXT,value3 TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS sms_his (id INTEGER PRIMARY KEY AUTOINCREMENT, phoneNumber TEXT, message TEXT,status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS email_his (id INTEGER PRIMARY KEY AUTOINCREMENT, fromEmail TEXT, toEmail TEXT, title TEXT, content TEXT,status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS class_plan (id INTEGER PRIMARY KEY, title TEXT, startTime TEXT, endTime TEXT, homework TEXT, who TEXT, classLevel TEXT, isTrialClass TEXT, classCategory TEXT, classSize INTEGER, teacher_name TEXT, subevent_id TEXT, is_full INTEGER, signedup TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS class_his (id INTEGER PRIMARY KEY AUTOINCREMENT,eventid TEXT, subid TEXT, title TEXT,who TEXT, teacher TEXT, student TEXT, parent TEXT,sdate TEXT, edate TEXT, hours TEXT,date TEXT, tz TEXT, type TEXT)");


  // Create indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (id,message)");
  db.run("CREATE INDEX IF NOT EXISTS idx_teamup_data_timestamp ON teamup_data (timestamp)");
  db.run("CREATE INDEX IF NOT EXISTS idx_courses_id ON courses (id,subid,teacher)");
  db.run("CREATE INDEX IF NOT EXISTS idx_sms_his ON sms_his (id,phoneNumber)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_email_his ON email_his (id,toEmail)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_class_plan ON class_plan (id,who,teacher_name,subevent_id,classlevel)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_class_his ON class_his (teacher,student,parent,date,hours)");
});

module.exports = db;
