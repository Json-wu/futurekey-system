// teamup.js
const axios = require('axios');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const config = require('../config/config');

const calendarKeyOrId = process.env.TEAMUP_KEY;
const calendarKeyOrId_modify = process.env.TEAMUP_KEY_MODIFY;
const apiKey = process.env.TEAMUP_APIKEY;
const teamup = config.teamup;

/**
 * 按时间段获取teamup日历数据
 * @param {*} sDate 
 * @param {*} eDate 
 * @returns 
 */
async function fetchTeamUpCalendar(sDate, eDate) {
  try {
    let url = `https://api.teamup.com/${calendarKeyOrId}/events?startDate=${sDate}&endDate=${eDate}`;
    logMessage(`fetchTeamUpCalendar:url-${url}`, 'info');
    const response = await axios.get(url, {
      headers: {
        'Teamup-Token': apiKey
      }
    });

    // try {
    //   //logMessage(`fetchTeamUpCalendar:response:::${JSON.stringify(response.data)}`, 'info');
    //   const stmt = db.prepare("INSERT INTO teamup_data (data) VALUES (?)");
    //   stmt.run(JSON.stringify(response.data)); stmt.finalize();
    // } catch (error) {
    //   logMessage(`save db error.`+error.stack, 'error');
    // }
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

async function createAnEvent(body){
  try {
    if(process.env.NODE_ENV === 'development' || !teamup.modify){
      return;
    }
    const url = `https://api.teamup.com/${calendarKeyOrId}/events`;
    const response = await axios.post(url, body, {
      headers: {
        'Teamup-Token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.status == 200) {
      logMessage(`Failed createAnEvent: ${response.statusText}`, 'error');
      return null;
    }
    logMessage('Successfully createAnEvent', 'info');
    return response.data.event;

  } catch (error) {
    logMessage(`Error to createAnEvent: ${error.stack}`, 'error');
    return null;
  }
}
async function updateAnEvent(id, body){
  try {
    if(!teamup.modify){
      return null;
    }
    let ubody = await getAnEvent(id);
    if(!ubody){
      return null;
    }
    // class_level、is_trial_class、class_size、is_full/满员
  // 判断body是否由who属性
    if (body.hasOwnProperty('who')) {
        ubody.who = body.who;
    }
   
    if(body.hasOwnProperty('title')){
      ubody.title = body.title;
    }
    if(body.hasOwnProperty('signed_up')){
      let newSignedUp = [];
      ubody.signups.map(item=>{
        if(body.signed_up.indexOf(item.name) < 0){
          newSignedUp.push(item);
        }
      });
      ubody.signups = newSignedUp;
      ubody.signup_count = newSignedUp.length;
    }
    const url = `https://api.teamup.com/${calendarKeyOrId_modify}/events/${id}`;
    logMessage('url updateAnEvent:::'+url, 'info');
    const response = await axios.put(url, ubody, {
      headers: {
        'Teamup-Token': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.status == 200) {
      logMessage(`Failed updateAnEvent: ${response.statusText}`, 'error');
      return null;
    }
    
    logMessage('Successfully updateAnEvent', 'info');
    return response.data.event;
  } catch (error) {
    logMessage(`Error to updateAnEvent: ${error.stack}`, 'error');
    return null;
  }
}
async function deleteAnEvent(eventId){
  try {
    if(process.env.NODE_ENV === 'development' || !teamup.modify){
      return;
    }
    const url = `https://api.teamup.com/${calendarKeyOrId}/events/${eventId}`;
    const response = await axios.delete(url, {
      headers: {
        'Teamup-Token': apiKey
      }
    });
    
    if (!response.status == 200) {
      logMessage(`Failed deleteAnEvent: ${response.statusText}`, 'error');
      return null;
    }
    logMessage('Successfully deleteAnEvent', 'info');
    return response.data.event;

  } catch (error) {
    logMessage(`Error to deleteAnEvent: ${error.stack}`, 'error');
    return null;
  }
}
async function getAnEvent(eventId){
  try {
    if(!teamup.modify){
      return;
    }
    const url = `https://api.teamup.com/${calendarKeyOrId}/events/${eventId}`;
    const response = await axios.get(url, {
      headers: {
        'Teamup-Token': apiKey
      }
    });
    
    if (!response.status == 200) {
      logMessage(`Failed getAnEvent: ${response.statusText}`, 'error');
      return null;
    }
    logMessage('Successfully getAnEvent', 'info');
    return response.data.event;
  } catch (error) {
    logMessage(`Error to getAnEvent: ${error.stack}`, 'error');
    return null;
  }
}
// fetchTeamUpCalendar(calendarKeyOrId, apiKey);
module.exports = { fetchTeamUpCalendar, createAnEvent, updateAnEvent, deleteAnEvent, getAnEvent };
