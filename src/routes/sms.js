const express = require('express');
const router = express.Router();
const smsService = require('../service/smsService');

router.post('/sendSms', async (req, res) => {
  const { phoneNumber, templateParam } = req.body;
  try {
    const result = await smsService.sendSms(phoneNumber, templateParam);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 接收短信回复的端点
router.post('/callback', (req, res) => {
    console.log('收到短信回复:', req.body);
  
    // 在这里处理短信回复
    const { PhoneNumber, SignName, TemplateCode, TemplateParam } = req.body;
    console.log(`手机号: ${PhoneNumber}`);
    console.log(`短信签名: ${SignName}`);
    console.log(`短信模板代码: ${TemplateCode}`);
    console.log(`短信模板参数: ${TemplateParam}`);
  
    res.send({code:0,msg:'成功'}); // 响应阿里云，表示已收到消息
  });

module.exports = router;
