const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const axios = require('axios');


const bot_webhook = config.bot_webhook;
const enable = bot_webhook.enable;
const url = bot_webhook.url;

async function sendBotMsg(type, msg, users) {
  try {
    logMessage(`ready sendBotMsg: ${msg}, ${JSON.stringify(users)}`, 'info');
    if (enable) {
      let reqBody = {};
      if(type=='text'){
        reqBody = {
          "msgtype": "text",
          "text": {
            "content": msg,
            "mentioned_list": users,
            //"mentioned_mobile_list": ["13800001111", "@all"]
          }
        };
      }else if(type=='markdown'){
        reqBody = {
          "msgtype": "markdown",
          "markdown": {
            "content": msg,
            "mentioned_list": users,
          }
        };
      }
      axios.post(url, reqBody).then((res) => {
        logMessage(`sendBotMsg reponse: ${JSON.stringify(res.data)}`, 'info');
      }).catch((error) => {
        logMessage(`sendBotMsg error: ${error.message}`, 'error');
      });
    }else{
      logMessage(`sendBotMsg not enable`, 'info');
    }
  } catch (error) {
    logMessage(`Error sendBotMsg: ${error.message}`, 'error');
    console.log(`Error sendBotMsg: ${error.message}`);
  }
}

module.exports = { sendBotMsg };
