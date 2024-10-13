const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const db = require('../libs/db');
const fs = require('fs');
const path = require('path');
const emailConfigPath = path.join(__dirname, '../config/email.json');
let emailData;

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
    logMessage(`Start sending email: toMail-${toMail}, content-${html}`, 'info');

   

    try {
      const emailConfigContent = fs.readFileSync(emailConfigPath, 'utf-8');
      emailData = JSON.parse(emailConfigContent);
    } catch (error) {
      logMessage(`Error loading email configuration: ${error.message}`, 'error');
      return 'Error loading email configuration';
    }
    if (emailData[toMail] == 0) {
      logMessage(`User has unsubscribed from emails: toMail-${toMail}, content-${html}`, 'info');
      return 'User has unsubscribed from emails';
    }
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
        logMessage(`Error sending email:` + error.message, 'error');
        InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'fail');
        console.log('Error sending email:', error);
        return resolve('Email sent error');
      }
      InsertData(mailOptions.from, mailOptions.to, mailOptions.subject, mailOptions.html, 'success');
      logMessage(`Email sent successfully, response: ${JSON.stringify(info.response)}`, 'info');
      //console.log('Email sent successfully:', info.response);
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

function sendToAdmin(title, content) {
  try {
    const adminEmail = emailConfig.receive;
    if (adminEmail) {
      sendEmail(adminEmail, title, content, content);
    }
  } catch (error) {
    logMessage(`sendToAdmin error，${error.message}`, 'error');
  }
}
// var fpath = path.join(__dirname, `../public/email.html`);
// var htmlss = fs.readFileSync(fpath, 'utf-8');
// var dt = moment(new Date('2024-08-24 14:55:09')).format('YYYY-MM-DD');
// const html = ejs.render(htmlss, { teacherName: 'teacherName', users: ['jack'], emailConfig, sub_eventid: '13326779', time: '2024-08-26', tz: "shanghang", dt });
// sendEmail('1056836206@qq.com', '测试邮件', '邮件内容的文本部分', html);
// sendEmail('yongqiangwu1@163.com','test Email','',`课程标题：faith with  Joe G1     课程时间：2024-08-06 16:00<br>To unsubscribe, please click <a href="http://localhost:3000/classroom/subscribe/13326779">here</a>`);

module.exports = { sendEmail, sendToAdmin };
