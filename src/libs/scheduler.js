// scheduler.js
const schedule = require('node-schedule');
const moment = require('moment');
const momenttz = require('moment-timezone');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const config = require('../config/config');
const { logMessage } = require('./logger');
const { getCustomerDetail } = require('../service/xbbService');
const { autoSendSms, SendSms_teacher } = require('../service/smsService');
const { sendEmail } = require('../service/emailService');
const teacherData = require('../config/teacher');
const { InsertData } = require('../service/courseService');


const calendarKeyOrId = process.env.TEAMUP_KEY;
const apiKey = process.env.TEAMUP_APIKEY;
const emailConfig = config.email;

// 定时规则
const rule = new schedule.RecurrenceRule();
// rule.minute = [0, 15, 30, 45];
rule.minute = [0, 30];

// 定义任务
async function task() {
  console.log('任务执行:', new Date());
  // test();
  classReminder();
}

// 调度任务
schedule.scheduleJob(rule, task);

/**
 * 课程开始前15分钟，给老师和学生发送短信提醒；
 * 从Teamup平台获取到排课信息；从销售帮获取到学生和老师电话号码/邮件
 */
async function classReminder() {
  try {
    console.log('课程开始前15分钟，给老师和学生发送短信提醒；')
    logMessage(new Date()+'开始校验提前课程提醒,','info');
    const data = await fetchTeamUpCalendar(calendarKeyOrId, apiKey);
    if (data != null && data.length > 0) {
      let title = "";
      let users = [];
      let sub_eventId = "";
      let time = "";
      let noWhoList = [];
      let dateNow = moment().seconds(0).milliseconds(0).utc();//new Date(moment().seconds(0).milliseconds(0));
      let date_end= moment(dateNow).add(30, 'minute').utc();
      let sendData = data.filter(item => {
        let dt = (momenttz.tz(item.start_dt, item.tz)).utc();
        //let dt = new Date(item.start_dt);
        console.log(momenttz.tz(item.start_dt, item.tz).format('YYYY-MM-DD')+',,'+item.tz);
        console.log(dt);
        console.log(dateNow);
        console.log(date_end);
        return dt >= dateNow && dt <= date_end
      }).map(item => {
        return {
          id: item.id,
          title: item.title,
          subcalendar_id: item.subcalendar_id,
          who: item.who,
          start_dt: item.start_dt,
          tz: item.tz,
          end_dt: item.end_dt
        };
      });

      for (let index = 0; index < sendData.length; index++) {
        const info = sendData[index];
        title = info.title;
        sub_eventId = info.subcalendar_id;
        time = momenttz.tz(item.start_dt, item.tz).format('YYYY-MM-DD HH:mm');
        var userName = info.who;//.replace(/\s*/g,"");
        if (userName.length > 0) {
          users = userName.split(/[,，]+/);
          await remind(info.id,sub_eventId, users, time, title, item.tz);
        } else { // who为空，发送邮件
          console.log('field who is null,sended administartor email');
          noWhoList.push(title);
        }
        logMessage(`classInfo:>> title: ${title},time: ${time}, sub_eventId:${sub_eventId},who:${userName}`,'info');
      }
      if (noWhoList.length > 0) {
        //sendEmail(config.email.receive,'课程参与人缺失提醒','',`课程标题：${title.join(';')}`);
      }
    } else {
      logMessage('not found TeamUp calendar data', 'info');
    }
  } catch (error) {
    logMessage(`Failed to fetch TeamUp calendar data: ${error.message}`, 'error');
  }
}

async function remind(id,sub_eventid, users, time, title, tz) {
  try {
    let noPhoneList = [];
    let teacherInfo = teacherData[sub_eventid];
    let teacherName = '';
    if (teacherInfo == null) {
      console.log('未找到老师信息');
      logMessage(`Teacher information not found.[${sub_eventid}]`, 'error');
    } else {
      teacherName = teacherInfo.name;
      // send msg to teacher  teacherName
      try {
        SendSms_teacher(teacherInfo.phone, teacherInfo.type, teacherName, time);
        sendEmail(teacherInfo.email, 'New Class Notification', '', 
        `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Class Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">

            <p>Hi Teacher <strong>[${teacherName}]</strong>,</p>

            <p>You have a new class with <strong>[${users.join(',')}]</strong>.</p>
            
            <p>Please check out the <a href=${emailConfig.back_url}?subid=${sub_eventid} style="color: #007bff; text-decoration: none;">teacher's home page</a> for your upcoming classes and class management tools.</p>
            
            <p>FutureKey School<br>
            <em>[${time} ${tz}]</em></p>

        </body>
        </html>
        `);
        logMessage(`Successfuly send msg to teacher.`, 'info');
      } catch (error) {
        console.log('Failed send msg to teacher.');
        logMessage(`Failed send msg to teacher.: ${error.message}`, 'error');
      }
    }
    // Record course information to database
    users = users.filter(x=> x!='');
    let usersInfo = users.map(item => {
      return {
        name: item,
        state: 0,
        evaluate: ''
      }
    });
    InsertData(id,sub_eventid, title, teacherName, JSON.stringify(usersInfo), 0, time, tz);
    // Send a message to students’ parents
    for (let index = 0; index < users.length; index++) {
      const item = users[index].trim();
      if (item == '')
        continue;
      let userInfo = await getCustomerDetail(item);
      if (userInfo) {
        // send sms
        if (userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length > 0) {
          let phones = userInfo.monther.subForm_1;
          let isnoPhone = false;
          for (let index = 0; index < phones.length; index++) {
            const subForm = phones[index];
            let phone = subForm.text_2;
            if (phone.trim().length == 0) {
              isnoPhone = true;
            } else {
              let codenum = subForm.text_1.text;
              console.log('phonetype:;:' + codenum);
              phone = codenum.split(" ")[1].replace(/^0+/, '') + phone;
              let type = userInfo.monther.text_8.value;
              let childName = userInfo.child.text_2;
              autoSendSms(phone, type, childName, time);//, teacherName
            }
          }
          if(isnoPhone){
            noPhoneList.push(item);
          }
        } else {
          noPhoneList.push(item);
        }
        // send email
        let email_address = userInfo.monther.text_86 ? userInfo.monther.text_86.value : null;
        if (email_address && email_address.length > 0) {
          sendEmail(email_address, 'Reminders for new classes', '', `Please remind your child ${item} to attend ${time}’s class. Pls ignore if you have already reported an absence.`);
        } else {
          noPhoneList.push(item);
        }
      }else{
        noPhoneList.push(item);
      }
    }
    if (noPhoneList.length > 0) {
      const pers = [...new Set(noPhoneList)];
      sendEmail(emailConfig.receive, '参与人联系方式缺失提醒', '', `参与人：${pers.join(',')}     课程标题：${title}     课程时间：${time}`);
      logMessage(`参与人联系方式缺失  .参与人：${pers.join(',')}     课程标题：${title}     课程时间：${time}`, 'info');
    }
  } catch (error) {
    logMessage(`Failed to remind: ${error.message}`, 'error');
  }
}

async function test() {
  let userInfo = await getCustomerDetail('Misylia');
  if (userInfo) {
    if (userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length > 0) {
      let phone = userInfo.monther.subForm_1[0].text_2;

      let codenum = userInfo.monther.subForm_1[0].text_1.text;
      phone = codenum.split(" ")[1].replace(/^0+/, '') + "13052515651";
      let time = moment(new Date()).add(15, 'M').format('YYYY-MM-DD HH:mm');
      let type = userInfo.monther.text_8.value;
      let childName = userInfo.child.text_2;
      autoSendSms(phone, type, childName, time);
    }
  }
}

