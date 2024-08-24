const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');

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
    logMessage(`Email send is not enable. message:toMail-${toMail}, content-${html}`, 'info');
    return;
  }
  logMessage(`开始发送邮件:toMail-${toMail},content-${html}`,'info');
  // 配置邮件选项
  const mailOptions = {
    from: emailConfig.auth.user, // 发件人地址
    to: toMail, // 收件人地址
    subject: title,        // 邮件主题
    text: text, // 邮件内容的文本部分
    html: html // 邮件内容的 HTML 部分
  };
  // return;
  // 发送邮件
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logMessage(`发送邮件出错:` + error.message, 'error');
      InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'fail');
      //console.log('发送邮件出错:', error);
      return;
    }
    InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'success');
    logMessage(`邮件发送成功,res:${JSON.stringify(info.response)}`, 'info');
    //console.log('邮件发送成功:', info.response);
  });
}

function InsertData(fromMail, toMail, title, html, status) {
  try {
      const stmt = db.prepare("INSERT INTO email_his (fromEmail,toEmail,title,content,status) VALUES (?,?,?,?,?)");
      stmt.run(fromMail, toMail, title, html, status);
      stmt.finalize();
      return true;
  } catch (error) {
      logMessage(`InsertData-mail error，${error.message}`, 'error');
      return false;
  }
}

// sendEmail('1056836206@qq.com','测试邮件','邮件内容的文本部分','邮件内容:https://teamup.com/c/hchhpv/welcome-calendar');
// sendEmail('1056836206@qq.com','参与人信息缺失提醒','',`课程标题：faith with  Joe G1     课程时间：2024-08-06 16:00<br>`);

module.exports = { sendEmail };
