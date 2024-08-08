// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('logs.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, level TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS teamup_data (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS courses (id TEXT, title TEXT, teacher TEXT, student TEXT, attend TEXT, time TEXT )");
});

module.exports = db;
