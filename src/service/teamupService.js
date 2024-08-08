// teamup.js
const axios = require('axios');
const { getDateNow } =require('../libs/common');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const { getCustomerDetail } = require('../service/xbbService');


async function fetchTeamUpCalendar(calendarKeyOrId, apiKey) {
  try {
  
  const response = await axios.get(`https://api.teamup.com/${calendarKeyOrId}/events?startDate=${getDateNow()}&endDate=${getDateNow()}`, {
    headers: {
      'Teamup-Token': apiKey
    }
  });
  if (!response.status==200) {
    logMessage(`Error fetching calendar: ${response.statusText}`,'error');
    return null;
  }
  const stmt = db.prepare("INSERT INTO teamup_data (data) VALUES (?)");
  stmt.run(JSON.stringify(response.data));  stmt.finalize();

  logMessage('Successfully fetched TeamUp calendar data', 'info');
  return response.data.events;
    
} catch (error) {
  logMessage(`Failed to fetch TeamUp calendar data: ${error.message}`, 'error');
  return null;
}
}
// fetchTeamUpCalendar(calendarKeyOrId, apiKey);
module.exports = { fetchTeamUpCalendar };
