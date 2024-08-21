const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');

const emailConfig = config.email;

router.post('/sendEmail', async (req, res) => {
  try {
    const emailContent = generateEmailContent(req.body);

    const transporter = nodemailer.createTransport({
      service: emailConfig.service,
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: process.env.EMAIL_PASS
      }

    });
    // 配置邮件发送
    const mailOptions = {
      from: emailConfig.auth.user,
      to: emailConfig.receive,
      subject: "新的联系表单提交-来自官网",
      text: '',
      html: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        logMessage(`表单提交邮件发送失败,error:${error.message}`, 'error');
        return res.status(500).send({"success": false, msg:'邮件发送失败'});
      }
      logMessage(`表单提交邮件发送成功,success!`, 'info');
      res.send({"success": true, msg: '邮件发送成功'});
    });
  } catch (error) {
    res.status(500).json({ "success": false, "msg": error.message });
  }
});
function generateEmailContent(formData) {
  return `
      <h2>新的联系表单提交</h2>
      <p><strong>昵称:</strong> ${formData.nickname}</p>
      <p><strong>邮箱:</strong> ${formData.email}</p>
      <p><strong>角色:</strong> ${formData.role}</p>
      <p><strong>备注:</strong> ${formData.remarks}</p>
  `;
}

module.exports = router;
