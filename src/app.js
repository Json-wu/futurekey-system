// app.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); 
const moment = require('moment');
const db = require('./libs/db');
const courseRoutes = require('./routes/course');
const smsRoutes = require('./routes/sms');
const emailRoutes = require('./routes/email');
const planRoutes = require('./routes/plan');
const totalRoutes = require('./routes/total');
const leaveRoutes = require('./routes/leave');
const messageRoutes = require('./routes/message');
const { scheduleLoad } = require('./libs/scheduler');
const bodyParser = require('body-parser');
const { logMessage } = require('./libs/logger');
const { GetStudentNoInfo } = require('./service/studentService');
const teacherData = require('./config/teacher.json');
const qywxService = require('./service/qywxService'); 

const app = express();
app.use(cors());

// 定时任务
scheduleLoad();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 设置EJS作为模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(bodyParser.json());
app.use('/classroom/course', courseRoutes);
app.use('/classroom/sms', smsRoutes);
app.use('/classroom/email', emailRoutes);
app.use('/classroom/plan', planRoutes);
app.use('/classroom/total', totalRoutes);
app.use('/classroom/leave', leaveRoutes);
app.use('/classroom/message', messageRoutes);



// 日志分页接口
app.post('/classroom/logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const body = req.body;
  let search = body.message ? ` message LIKE '%${body.message}%' ` : ' 1=1 ';
  db.all(`SELECT * FROM logs WHERE ${search} ORDER BY id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, (err, rows) => {
    if (err) {
      return res.status(500).send('Failed to retrieve logs.');
    }
    db.get(`SELECT COUNT(*) AS count FROM logs WHERE ${search} `, (err, row) => {
      if (err) {
        return res.status(500).send('Failed to retrieve logs.');
      }
      rows = rows.map((item) => {
        const dt = new Date(item.timestamp);
        dt.setHours(dt.getHours() + 8);
        item.timestamp = moment(dt).format('YYYY-MM-DD HH:mm:ss');
        return item;
      });

      res.json({ logs: rows, totalPages: row.count });
    });
  });
});
// sms日志分页接口
app.post('/classroom/sms-logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const body = req.body;
  let search = body.message ? ` message LIKE '%${body.message}%' ` : ' 1=1 ';
  db.all(`SELECT * FROM sms_his WHERE ${search} ORDER BY id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, (err, rows) => {
    if (err) {
      return res.status(500).send('Failed to retrieve logs.');
    }
    db.get(`SELECT COUNT(*) AS count FROM sms_his WHERE ${search} `, (err, row) => {
      if (err) {
        return res.status(500).send('Failed to retrieve logs.');
      }
      rows = rows.map((item) => {
        const dt = new Date(item.timestamp);
        dt.setHours(dt.getHours() + 8);
        item.timestamp = moment(dt).format('YYYY-MM-DD HH:mm:ss');
        return item;
      });

      res.json({ logs: rows, totalPages: row.count });
    });
  });
});
// sms日志分页接口
app.post('/classroom/email-logs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const body = req.body;
  let search = body.message ? ` content LIKE '%${body.message}%' ` : ' 1=1 ';
  db.all(`SELECT * FROM email_his WHERE ${search} ORDER BY id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`, (err, rows) => {
    if (err) {
      return res.status(500).send('Failed to retrieve logs.');
    }
    db.get(`SELECT COUNT(*) AS count FROM email_his WHERE ${search} `, (err, row) => {
      if (err) {
        return res.status(500).send('Failed to retrieve logs.');
      }
      rows = rows.map((item) => {
        const dt = new Date(item.timestamp);
        dt.setHours(dt.getHours() + 8);
        item.timestamp = moment(dt).format('YYYY-MM-DD HH:mm:ss');
        return item;
      });

      res.json({ logs: rows, totalPages: row.count });
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
app.get('/classroom/sms-logs', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/sms-logs.html'));
});
app.get('/classroom/email-logs', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/email-logs.html'));
});

// 反馈表
app.get('/classroom/back', (req, res) => {
  const teacher_id = req.query.subid;
  const teacher_name = teacherData[req.query.subid] ? teacherData[req.query.subid].name: '';
  const params = { teacher_id, teacher_name };
  res.render('teacher', params);
});

app.get('/classroom/subscribe/:email', (req, res) => {
  // 读取JSON文件
const jsonFilePath = path.join(__dirname,'config','email.json');
let emailData = require(jsonFilePath);

// 修改JSON内容的示例路由
  // 修改JSON对象
  emailData[req.params.email]=0;

  // 将修改后的JSON对象写回文件
  fs.writeFile(jsonFilePath, JSON.stringify(emailData), (err) => {
    if (err) {
      console.error('Error writing to JSON file', err);
      res.status(500).send('Error writing to subscribe');
    } else {
      res.send('subscribe successfully');
    }
  });
  
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
  let response = await qywxService.GetQywxUserList();
  console.log(response);
  res.send(response);
});

// 设置存储路径和文件命名规则
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/';
    // 创建文件夹（如果不存在）
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir); // 保存到 uploads 文件夹
  },
  filename: function (req, file, cb) {
    // 文件名使用原始名字加时间戳
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 防止乱码
   
    cb(null, Date.now() + '-' + originalName);
  },
});

const upload = multer({ storage: storage });

// 配置静态文件路径，支持在线查看
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 处理文件上传
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileUrl = `view file: <a href="/download/${req.file.filename}">${req.file.filename}</a>`;
    res.json({code:0, data:{filePath: `${req.file.filename}`, filename: req.file.name}});
  } catch (error) {
    res.json({code:1, message: error.message});
  }
});

// 文件下载
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const decodedFilename = decodeURIComponent(filename); // 解码文件名
  const filePath = path.join(__dirname, '../uploads', filename);

  // 检查文件是否存在
  if (fs.existsSync(filePath)) {
    const fileNameHeader = encodeURIComponent(decodedFilename);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileNameHeader}`);
    res.download(filePath, decodedFilename, (err) => {
      if (err) {
        res.status(500).send('Error downloading the file.');
      }
    });
  } else {
    res.status(404).send('File not found.');
  }
});
// 文件删除
app.post('/delete', (req, res) => {
  const filename = req.body.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  // 检查文件是否存在
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({code: 0, msg: 'File deleted successfully.'} );
  } else {
    res.json({code: 0, msg: 'File not found.'});
  }
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
  console.log(`TEAMUP_KEY_MODIFY: ${process.env.TEAMUP_KEY_MODIFY}`);
});
