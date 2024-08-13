// logger.js
const db = require('./db');

/*
  * Log a message to the database.
  *
  * @param {string} message The message to log.
  * @param {string} level The log level.
  */
function logMessage(message, level) {
  const stmt = db.prepare("INSERT INTO logs (message, level) VALUES (?, ?)");
  stmt.run(message, level);
  stmt.finalize();
}

module.exports = { logMessage };
