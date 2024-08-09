const SMSClient = require('@alicloud/sms-sdk');
const Core = require('@alicloud/pop-core');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');

const smsConfig = config.sms;
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
  // securityToken: '<your-sts-token>', // use STS Token
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
    if(!smsConfig.enable){
      logMessage('SMS send is not enable.','info');
      return;
    }
    let msg = {
      PhoneNumbers: phoneNumber,
      SignName: smsConfig.signName,
      TemplateCode: smsConfig.templateCode ,
      TemplateParam: JSON.stringify(templateParam)
    };
    const result = await client.sendSMS(msg);
    logMessage('SMS sent successfully:'+JSON.stringify(msg),'info');
    console.log('SMS sent successfully:', result);
  } catch (err) {
    logMessage('Error sending SMS:'+err.message,'error');
    console.error('Error sending SMS:', err.message);
  }
};
const sendSms_USA = async (phoneNumber, message) => {
  try {
    if(!smsConfig.enable){
      logMessage('SMS send is not enable.','info');
      return;
    }
    
    const params = {
      "To": phoneNumber,//接收短信号码。号码格式为：国际区号+号码
      "From": "1234****90",//发送方标识。支持SenderID的发送，只允许数字+字母，含有字母标识最长11位，纯数字标识支持15位,美国、加拿大需要填写10dlc注册后运营商提供的SenderID
      "Message": message,//短信的完整内容
      "Type": "NOTIFY" //短信类型OTP：验证码NOTIFY：短信通知MKT：推广短信
    };
    
    var requestOption = {
      method: "POST",
      formatParams: false,
    
    };
    let result = await client_USA.request("SendMessageToGlobe", params, requestOption);
    
    logMessage('SMS_USA sent successfully:'+JSON.stringify(result),'info');
    console.log('SMS_USA sent successfully:', result);
  } catch (err) {
    logMessage('Error sending SMS_USA:'+err.message,'error');
    console.error('Error sending SMS_USA:', err.message);
  }
};

const autoSendSms = async(phone,type,user,time)=>{
  try {
    const phoneNumber = phone;
    const templateParam = { user,time };

    console.log(`开始发送短信:phoneNumber-${phoneNumber},type-${type},templateParam-${JSON.stringify(templateParam)}`);
    logMessage(`开始发送短信:phoneNumber-${phoneNumber},type-${type},templateParam-${JSON.stringify(templateParam)}`,'info');
    // return;
    // 中国内地
    if(type==1){
      sendSms(phoneNumber, templateParam);
    }
    else if(type==2){ // 美国
      let message = `Please remind your child ${templateParam.user} to attend ${templateParam.time}’s class. Pls ignore if you have already reported an absence.`;
      sendSms_USA(phoneNumber,message);
    }
    else if(type==9){ // 港澳台
      sendSms(phoneNumber, templateParam);
    }
  } catch (error) {
    logMessage('Error autoSendSms:'+error.message,'error');
    console.error('Error autoSendSms:', error.message);
  }
}

const SendSms_teacher = async(phone,type,user,time)=>{
  try {
    const phoneNumber = phone;
    const templateParam = { user,time };

    console.log(`开始发送短信:phoneNumber-${phoneNumber},type-${type},templateParam-${JSON.stringify(templateParam)}`);
    logMessage(`开始发送短信:phoneNumber-${phoneNumber},type-${type},templateParam-${JSON.stringify(templateParam)}`,'info');
    // return;
    // 中国内地
    if(type==1){
      sendSms(phoneNumber, templateParam);
    }
    else if(type==2){ // 美国
      let message = `Your class will start at [${templateParam.time}]. Reply 1 to confirm, 9 to cancel.`
      sendSms_USA(phoneNumber,message);
    }
    else if(type==9){ // 港澳台
      sendSms(phoneNumber, templateParam);
    }
  } catch (error) {
    logMessage('Error autoSendSms:'+error.message,'error');
    console.error('Error autoSendSms:', error.message);
  }
}


// Example usage
// sendSms('8613052515651', { user: '张小明',time:'2024/08/06 19:00'});
// sendSms_USA('16503089650', { user: '张小明',time:'2024/08/06 19:00'});


module.exports = { sendSms,autoSendSms,SendSms_teacher,SendSms_teacher };