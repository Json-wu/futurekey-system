// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

/**
 * 创建表
 */
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, level TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS teamup_data (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS courses (id TEXT, subcalendar_id TEXT, title TEXT, teacher TEXT, who TEXT, signed_up TEXT,is_trial_class TEXT, class_category TEXT, is_full TEXT, attend TEXT, start_dt TEXT, end_dt TEXT,date TEXT,tz TEXT,class_level TEXT,class_size TEXT,status TEXT,preview TEXT,homework TEXT,value1 TEXT,value2 TEXT,value3 TEXT,value4 TEXT,value5 TEXT)");
//value1 标识课程是否有变动，0表示无变动，1表示有变动
  db.run("CREATE TABLE IF NOT EXISTS sms_his (id INTEGER PRIMARY KEY AUTOINCREMENT, phoneNumber TEXT, message TEXT,status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS email_his (id INTEGER PRIMARY KEY AUTOINCREMENT, fromEmail TEXT, toEmail TEXT, title TEXT, content TEXT,status TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");

  db.run("CREATE TABLE IF NOT EXISTS class_plan (id INTEGER PRIMARY KEY, title TEXT, startTime TEXT, endTime TEXT, homework TEXT, who TEXT, classLevel TEXT, isTrialClass TEXT, classCategory TEXT, classSize INTEGER, teacher_name TEXT, subevent_id TEXT, is_full INTEGER, signedup TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS class_his (id INTEGER PRIMARY KEY AUTOINCREMENT,eventid TEXT, subid TEXT, title TEXT,who TEXT, teacher TEXT, student TEXT, parent TEXT,sdate TEXT, edate TEXT, hours TEXT,date TEXT, tz TEXT, type TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS message_info (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT, msg TEXT, isread TEXT, create_date DATETIME, url TEXT,value1 TEXT,value2 TEXT,value3 TEXT,value4 TEXT,value5 TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS leave (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT, name TEXT, start_dt TEXT, end_dt TEXT, create_date DATETIME, status TEXT,value1 TEXT,value2 TEXT,value3 TEXT,value4 TEXT,value5 TEXT)");

  db.run("CREATE TABLE IF NOT EXISTS student_detail (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id TEXT, subcalendar_id TEXT, name TEXT, code TEXT, state TEXT, parent_name TEXT, parent_code TEXT,read TEXT, write TEXT, level TEXT, evaluate TEXT, remarks TEXT, homework TEXT, value1 TEXT,value2 TEXT,value3 TEXT,value4 TEXT,value5 TEXT)");


  // Create indexes
  db.run("CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (id,message)");
  db.run("CREATE INDEX IF NOT EXISTS idx_teamup_data_timestamp ON teamup_data (timestamp)");
  db.run("CREATE INDEX IF NOT EXISTS idx_courses_id ON courses (id,subcalendar_id,start_dt,end_dt)");
  db.run("CREATE INDEX IF NOT EXISTS idx_sms_his ON sms_his (id,phoneNumber)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_email_his ON email_his (id,toEmail)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_class_plan ON class_plan (id,who,teacher_name,subevent_id,classlevel)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_class_his ON class_his (teacher,student,parent,date,hours)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_message_info ON message_info (code,isread,create_date)");
  db.run("CREATE INDEX IF NOT EXISTS Idx_leave ON leave (code,status)");
});

module.exports = db;
