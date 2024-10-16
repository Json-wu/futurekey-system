const SMSClient = require('@alicloud/sms-sdk');
const Core = require('@alicloud/pop-core');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const moment = require('moment');
const mz = require('moment-timezone');

const smsConfig = config.sms;
const timerSet_class = config.timerSet_class;
const accessKeyId = process.env.SMS_ACCESSKEYID;
const secretAccessKey = process.env.SMS_ACCESSKEYSECRET;

// Initialize the SMS client with your Alibaba Cloud credentials
const client = new SMSClient({
  accessKeyId: accessKeyId, // Replace with your Access Key ID
  secretAccessKey: secretAccessKey  // Replace with your Access Key Secret
});

const client_USA = new Core({
  accessKeyId: accessKeyId,
  accessKeySecret: secretAccessKey,
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25'
});

/**
 * 
 * @param {*} templateCode 
 * @param {*} templateParam 
 */
// Send SMS
const sendSms = async (phoneNumber, templateParam) => {
  try {
    // let SMSmsg = `to：${phoneNumber}，msg：【科爱信】开心英语提醒您的孩子${templateParam.user}在${templateParam.day}分钟后参加课程。如有任何问题可联系专属顾问，如果已请假，请忽略本消息。`;
    let SMSmsg = `to：${phoneNumber}，msg：【科爱信】开心英语提醒${templateParam.user}同学参加${templateParam.time}课程。若有问题，请联系课程顾问。若请假，请忽略。`;

    if (!smsConfig.enable) {
      console.log('SMS send is not enable. content::' + SMSmsg, 'info');
      return false;
    }
    console.log(`begin send SMS ` + SMSmsg);
    console.log(`begin send SMS ` + SMSmsg, 'info');
    let msg = {
      PhoneNumbers: phoneNumber,
      SignName: smsConfig.signName,
      TemplateCode: smsConfig.templateCode,
      TemplateParam: JSON.stringify(templateParam)
    };
    const result = await client.sendSMS(msg);
    if(result.Code != 'OK'){
      InsertData(phoneNumber, SMSmsg, 'fail');
      console.log('SMS sent fail' + JSON.stringify(result), 'error');
      return false;
    }else{
      InsertData(phoneNumber, SMSmsg, 'success');
      console.log('SMS sent successfully，' + JSON.stringify(result), 'info');
      return true;
    }
  } catch (err) {
    console.log('Error sending SMS:' + err.message, 'error');
    console.log('SMS sent fail' + err.message, 'error');
    return false;
  }
};
const sendSms_USA = async (phoneNumber, message) => {
  try {
    console.log(`SMS_USA send is not enable.content::to:${phoneNumber}，msg：` + message, 'info');
      return;
    if (!smsConfig.enable) {
      console.log(`SMS_USA send is not enable.content::to:${phoneNumber}，msg：` + message, 'info');
      return;
    }
    console.log(`begin send SMS_USA to:${phoneNumber}，msg：`+message,'info');
    const params = {
      "To": phoneNumber,//接收短信号码。号码格式为：国际区号+号码
      "From": "18773124359",//发送方标识。支持SenderID的发送，只允许数字+字母，含有字母标识最长11位，纯数字标识支持15位,美国、加拿大需要填写10dlc注册后运营商提供的SenderID
      "Message": message,//短信的完整内容
      "Type": "OTP" //短信类型OTP：验证码NOTIFY：短信通知MKT：推广短信
    };

    var requestOption = {
      method: "POST",
      formatParams: false,

    };
    let result = await client_USA.request("SendMessageToGlobe", params, requestOption);
    console.log('SMS_USA sent result:', result);
    if(result.Code=='OK'){
      InsertData(phoneNumber, message, 'success');
      console.log(`SMS_USA sent successfully: to:${phoneNumber}，msg：` + message, 'info');
      return true;
    }else{
      InsertData(phoneNumber, message, 'failed');
      console.log(`SMS_USA sent fail: to:${phoneNumber}，msg：` + message, 'error');
      return false;
    }
  } catch (err) {
    InsertData(phoneNumber, message, 'error');
    console.log('Error sending SMS_USA:' + err.message, 'error');
    return false;
  }
};
function getGMTOffsetForTime(date, timeZone) {
  const momentTime = mz(date).tz(timeZone);
  const offsetInMinutes = momentTime.utcOffset();
  const hours = offsetInMinutes / 60;
  return `GMT${hours >= 0 ? '+' : ''}${hours}`;
}

const autoSendSms = async (phone, type, user, time, tz) => {
  try {
    // 移除电话号码中的空格、横杠等字符
    const phoneNumber = phone.replace(/\D/g, '');
    let time_zone = getGMTOffsetForTime(time, tz);
    moment.locale('zh-cn', {
      weekdays: '周日_周一_周二_周三_周四_周五_周六'.split('_')
      })
    time = moment(new Date(time)).format('ddddHH:mm');
    
    console.log(`今天是: ${time}-${time_zone}`);
    const templateParam = { user, time };
    console.log(`phone:${phoneNumber}, type:${type}, user:${user}, time:${time-time_zone}`, 'info');
    // 1.中国内地 9. 港澳台
    if (type == 1) {
      return await sendSms(phoneNumber, {user,time: time+`(${time_zone})`});
      // return await sendSms(phoneNumber, {user: user, day: timerSet_class.timeout});
    }
    else { // 2 美国
      let message = `Please remind your child ${templateParam.user} to attend ${templateParam.time}’s class. Pls ignore if you have already reported an absence.`;
      return await sendSms_USA(phoneNumber, message);
    }
  } catch (error) {
    console.log('Error autoSendSms:' + error.message, 'error');
    return false;
  }
}

const SendSms_teacher = async (phone, type, user, time) => {
  try {
    const phoneNumber = phone;
    const templateParam = { user, time };

    // 中国内地
    if (type == 1) {
      sendSms(phoneNumber, templateParam);
    }
    else if (type == 2) { // 美国
      let message = `Your class will start at [${templateParam.time}]. Reply 1 to confirm, 9 to cancel.`
      sendSms_USA(phoneNumber, message);
    }
    else if (type == 9) { // 港澳台
      sendSms(phoneNumber, templateParam);
    }
  } catch (error) {
    console.log('Error autoSendSms:' + error.message, 'error');
    //console.error('Error autoSendSms:', error.message);
  }
}

const SendSms_parent = async (phoneNumber, templateParam) => {
  try {
    moment.locale('zh-cn', {
      weekdays: '周日_周一_周二_周三_周四_周五_周六'.split('_')
      })
      let time_zone = getGMTOffsetForTime(templateParam.time, templateParam.tz);
      templateParam.time = moment(new Date(templateParam.time)).format('ddddHH:mm')+`(${time_zone})`;
    let SMSmsg = `to：${phoneNumber}，msg：【科爱信】开心英语提醒您，${templateParam.user}在${templateParam.time}的课程已经${templateParam.type}。如果有问题请联系专属顾问，如果已请假，请忽略本消息。`;
    if (!smsConfig.sendToParent) {
      console.log('SMS send is not enable. content::' + SMSmsg, 'info');
      return false;
    }
    console.log(`begin send SMS ` + SMSmsg);
    console.log(`begin send SMS ` + SMSmsg, 'info');
    let msg = {
      PhoneNumbers: phoneNumber,
      SignName: smsConfig.signName,
      TemplateCode: smsConfig.templateCode_student,
      TemplateParam: JSON.stringify(templateParam)
    };
    const result = await client.sendSMS(msg);
    if(result.Code != 'OK'){
      InsertData(phoneNumber, SMSmsg, 'fail');
      console.log('SMS sent fail' + JSON.stringify(result), 'error');
      return false;
    }else{
      InsertData(phoneNumber, SMSmsg, 'success');
      console.log('SMS sent successfully，' + JSON.stringify(result), 'info');
      return true;
    }
  } catch (err) {
    console.log('Error sending SMS:' + err.message, 'error');
    console.log('SMS sent fail' + err.message, 'error');
    return false;
  }
};


function InsertData(phone, msg, status) {
  try {
      const stmt = db.prepare("INSERT INTO sms_his (phoneNumber,message,status) VALUES (?,?,?)");
      stmt.run(phone, msg, status);
      stmt.finalize();
      return true;
  } catch (error) {
      console.log(`InsertData-sms error，${error.message}`, 'error');
      return false;
  }
}

// 内存存储验证码
const verificationCodes = {};
/**
 * 生成6位数字验证码
 * @returns {string} - 6位数字验证码
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
/**
 * 发送短信验证码-美国
 * @param {string} phoneNumber - 接收短信的美国手机号
 * @param {string} templateParam - 短信模板参数（验证码）
 */
const sendSms_val = async (phoneNumber) => {
  const verificationCode = generateVerificationCode();
  console.log('Verification code:', verificationCode);
  console.log('Verification code:' + verificationCode, 'info');

  let message = `Your verification code is <${verificationCode}>, please verify within 5 mins.`;
  
  try {
    // 将验证码存储到内存中，设置过期时间为 5 分钟
    verificationCodes[phoneNumber] = {
      code: verificationCode,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 分钟后过期
    };
    const result = await sendSms_USA('1'+phoneNumber, message);//client_USA.request('SendSms', params, requestOption);
    if(result.Code != 'OK'){
      return {success: false, message: 'SMS sent fail'};
    }else{
      return {success: true, message: 'SMS sent successfully'};
    }
  } catch (error) {
    console.log('Error autoSendSms:' + error.message, 'error');
    console.error('Error sending SMS:', error);
    return {success: false, message: 'SMS sent error'};;
  }
};

/**
 * 验证短信验证码
 * @param {string} phoneNumber - 接收短信的手机号
 * @param {string} code - 用户输入的验证码
 * @returns {boolean} - 验证结果
 */
const verifyCode = (phoneNumber, code) => {
  console.log(`verificationCodes:${JSON.stringify(verificationCodes)}`, 'info');
  const record = verificationCodes[phoneNumber];
  if (record && record.code === code && record.expiresAt > Date.now()) {
    delete verificationCodes[phoneNumber]; // 验证成功后删除验证码
    return true;
  }
  return false;
};
// Example usage
// autoSendSms('13052515651',1, '张小明','2024/10/03 19:00');
// const code = generateVerificationCode();
// sendSms_USA('16503089650', `
// Your registration code is: ${code}, if you are not operating by yourself, please ignore this SMS!`);
// sendSms_val('6503089650');
// autoSendSms('1650308aa | .,+a9650', 2, 'Katherine', '2024-09-03 09:30');
// autoSendSms('13052515651', 1,'Joke', '2024-10-03 16:00', 'Asia/Shanghai');
// SendSms_parent('13052515651', {user: 'Joke', time: '2024-10-02 19:00', type: '取消',tz: 'Asia/Shanghai'});
// SendSms_parent('8613693273017', {user: 'Joke', time: '2024-10-03 19:00', type: '迟到'});


module.exports = { sendSms, autoSendSms, SendSms_teacher, SendSms_teacher, sendSms_val, verifyCode, SendSms_parent };