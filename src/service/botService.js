const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const axios = require('axios');

const bot_webhook = config.bot_webhook;
const enable = bot_webhook.enable;
const url = bot_webhook.url;

async function sendBotMsg(msg, users) {
  try {
    logMessage(`ready sendBotMsg: ${msg}, ${JSON.stringify(users)}`, 'info');
    if (enable) {
      axios.post(url, {
        "msgtype": "text",
        "text": {
          "content": msg,
          "mentioned_list": users,
          //"mentioned_mobile_list": ["13800001111", "@all"]
        }
      }).then((res) => {
        logMessage(`sendBotMsg success: ${res.data}`, 'info');
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
