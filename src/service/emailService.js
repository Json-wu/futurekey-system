const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

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

async function sendEmail(toMail, title, text, html) {
  try {
    if (!emailConfig.enable) {
      logMessage(`Email send is not enable. message:toMail-${toMail}, content-${html}`, 'info');
      return 'Email send is not enable.';
    }
    logMessage(`开始发送邮件:toMail-${toMail},content-${html}`, 'info');
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
    return await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logMessage(`发送邮件出错:` + error.message, 'error');
          InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'fail');
          console.log('发送邮件出错:', error);
          return resolve('Email sent error');
        }
        InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'success');
        logMessage(`邮件发送成功,res:${JSON.stringify(info.response)}`, 'info');
        //console.log('邮件发送成功:', info.response);
        return resolve('Email sent');
      });
    });
  } catch (error) {
    logMessage(`sendEmail error，${error.message}`, 'error');
    return 'Email sent error';
    
  }
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
// var fpath = path.join(__dirname, `../public/email.html`);
// var htmlss = fs.readFileSync(fpath, 'utf-8');
// var dt = moment(new Date('2024-08-24 14:55:09')).format('YYYY-MM-DD');
// const html = ejs.render(htmlss, { teacherName: 'teacherName', users: ['jack'], emailConfig, sub_eventid: '13326779', time: '2024-08-26', tz: "shanghang", dt });
// sendEmail('1056836206@qq.com', '测试邮件', '邮件内容的文本部分', html);
// sendEmail('1056836206@qq.com','参与人信息缺失提醒','',`课程标题：faith with  Joe G1     课程时间：2024-08-06 16:00<br>`);

module.exports = { sendEmail };
