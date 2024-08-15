// teamup.js
const axios = require('axios');
const { getDateNow } = require('../libs/common');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const { getCustomerDetail } = require('../service/xbbService');


async function fetchTeamUpCalendar(calendarKeyOrId, apiKey, sDate, eDate) {
  try {
    let url = `https://api.teamup.com/${calendarKeyOrId}/events?startDate=${sDate}&endDate=${eDate}`;
    logMessage(`fetchTeamUpCalendar:url-${url},Teamup-Token-${apiKey}`, 'info');
    const response = await axios.get(url, {
      headers: {
        'Teamup-Token': apiKey
      }
    });

    try {
      //logMessage(`fetchTeamUpCalendar:response:::${JSON.stringify(response.data)}`, 'info');
      const stmt = db.prepare("INSERT INTO teamup_data (data) VALUES (?)");
      stmt.run(JSON.stringify(response.data)); stmt.finalize();
    } catch (error) {
      logMessage(`save db error.`+error.stack, 'error');
    }
    if (!response.status == 200) {
      logMessage(`Error fetching calendar: ${response.statusText}`, 'error');
      return null;
    }
    logMessage('Successfully fetched TeamUp calendar data', 'info');
    return response.data.events;

  } catch (error) {
    logMessage(`Failed to fetch TeamUp calendar data: ${error.stack}`, 'error');
    return null;
  }
}
// fetchTeamUpCalendar(calendarKeyOrId, apiKey);
module.exports = { fetchTeamUpCalendar };
