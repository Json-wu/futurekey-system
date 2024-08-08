const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, `${env}.json`);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

module.exports = config;
