// app.js
const express = require('express');
const path = require('path');
const cors = require('cors'); 
const moment = require('moment');
const db = require('./libs/db');
const courseRoutes = require('./routes/course');
const smsRoutes = require('./routes/sms');
const emailRoutes = require('./routes/email');
require('./libs/scheduler');
const bodyParser = require('body-parser');
const { logMessage } = require('./libs/logger');
const { GetStudentNoInfo } = require('./service/studentService');

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use('/classroom/course', courseRoutes);
app.use('/classroom/sms', smsRoutes);
app.use('/classroom/email', emailRoutes);



// 日志分页接口
app.get('/classroom/logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  db.all(`SELECT * FROM logs ORDER BY id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit} `, (err, rows) => {
    if (err) {
      return res.status(500).send('Failed to retrieve logs.');
    }
    db.get(`SELECT COUNT(*) AS count FROM logs`, (err, row) => {
      if (err) {
          return res.status(500).send('Failed to retrieve logs.');
      }
      rows = rows.map((item)=>{
        const dt = new Date(item.timestamp);
        dt.setHours(dt.getHours() + 8);
        item.timestamp = moment(dt).format('YYYY-MM-DD HH:mm:ss');
        return item;
      })
      
    res.json({logs:rows, totalPages:row.count});
    });
  });
});
// 查看teamup调用记录
app.get('/classroom/teamup-data', (req, res) => {
  db.all("SELECT * FROM teamup_data ORDER BY timestamp DESC", (err, rows) => {
    if (err) {
      return res.status(500).send('Failed to retrieve teamup data.');
    }
    res.send(rows);
  });
});
// 查看日志
app.get('/classroom/view-logs', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/logs.html'));
});
// 反馈表
app.get('/classroom/back', (req, res) => {
  res.sendFile(path.join(__dirname, `/public/feedback_${req.query.subid}.html`));
});

app.get('/classroom', (req, res) => {
  res.redirect('/classroom/view-logs');
});
app.get('/classroom/register/subscribe', (req, res) => {
  res.sendFile(path.join(__dirname, `/public/subscribe.html`));
});
app.get('/classroom/register/verify', (req, res) => {
  res.sendFile(path.join(__dirname, `/public/verify.html`));
});

app.get('/classroom/checkstudent', async (req, res) => {
  let studentNo = await GetStudentNoInfo(req.query.date);
  res.json(studentNo);
});
app.get('/classroom/test', async (req, res) => {
  let item ='Melody asdad';
  let usercode  = item.match(/\d{8}/);
  console.log(usercode);
  res.json(usercode);
});
 
// 错误处理中间件
app.use((err, req, res, next) => {
  // 设置响应的状态码和内容
  // 可以将错误信息记录到日志中
  console.error(err.stack);
  logMessage(err.stack,'error');
  res.status(500).send('Server Error');
});

process.on('uncaughtException', (err)=>{
  console.error(err.stack);
  logMessage('uncaughtException'+err.stack,'error');
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
