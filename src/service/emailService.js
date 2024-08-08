const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');

const emailConfig = config.email;

// 创建一个 SMTP 传输对象
const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: {
    user: emailConfig.auth.user,//"no_reply@gdfdlearning.org",
    pass: process.env.EMAIL_PASS//"PZPQTIDJWQHZUDYW"//"MbEEyGnJ*>U%7eL",
  }//,
  // tls: {
  //   rejectUnauthorized: false
  // }
});

function sendEmail(toMail, title, text, html) {
  if (!emailConfig.enable) {
    logMessage(`Email send is not enable. message:toMail-${toMail}, title-${title}, text-${text}, html-${html}`, 'info');
    return;
  }
  
  // 配置邮件选项
  const mailOptions = {
    from: emailConfig.auth.user, // 发件人地址
    to: toMail, // 收件人地址
    subject: title,        // 邮件主题
    text: text, // 邮件内容的文本部分
    html: html // 邮件内容的 HTML 部分
  };
  console.log(`准备发送邮件：${JSON.stringify(mailOptions)}`);
  return;
  // 发送邮件
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logMessage(`发送邮件出错:` + error.message, 'error');
      return console.log('发送邮件出错:', error);
    }
    logMessage(`邮件发送成功,req:${JSON.stringify(mailOptions)}，res:${JSON.stringify(info.response)}`, 'info');
    console.log('邮件发送成功:', info.response);
  });
}

//sendEmail('1056836206@qq.com','测试邮件','邮件内容的文本部分','邮件内容:https://teamup.com/c/hchhpv/welcome-calendar');
// sendEmail('1056836206@qq.com','参与人信息缺失提醒','',`课程标题：faith with  Joe G1     课程时间：2024-08-06 16:00<br>`);

module.exports = { sendEmail };
