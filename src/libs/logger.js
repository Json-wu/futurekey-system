// logger.js
const db = require('./db');

function logMessage(message, level) {
  const stmt = db.prepare("INSERT INTO logs (message, level) VALUES (?, ?)");
  stmt.run(message, level);
  stmt.finalize();
}

module.exports = { logMessage };
