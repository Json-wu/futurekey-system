// scheduler.js
const schedule = require('node-schedule');
const moment = require('moment');
const { getDateNow, getDatetimeAddMin } =require('../libs/common');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const db = require('./db');
const config = require('../config/config');
const { logMessage } = require('./logger');
const { getCustomerDetail } = require('../service/xbbService');
const { autoSendSms } = require('../service/smsService');
const { sendEmail } = require('../service/emailService');
const teacherData = require('../config/teacher');


const calendarKeyOrId = process.env.TEAMUP_KEY;
const apiKey = process.env.TEAMUP_APIKEY;

// 定时规则
const rule = new schedule.RecurrenceRule();
rule.minute = [0, 15, 30, 45];
// rule.second = [0, 30];

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
 async function classReminder(){
  try {
    console.log('课程开始前15分钟，给老师和学生发送短信提醒；')
    const data = await fetchTeamUpCalendar(calendarKeyOrId, apiKey);
    if(data!=null && data.length>0){
      let title = "";
      let users = [];
      let sub_eventId="";
      let time="";
      let noWhoList = [];
      let sendData = data.filter(item=>{
        let dt = new Date(item.start_dt);
        return  dt>= new Date() && dt<= new Date(moment().add(15,'minute'))
      } ).map(item=>{
          return {
            title: item.title,
            who: item.who,
            start_dt: item.start_dt,
            end_dt: item.end_dt
          };
      });

      for (let index = 0; index < sendData.length; index++) {
        const info = sendData[index];
        title = info.title;
        sub_eventId = info.subcalendar_id;
        time = moment(new Date(info.start_dt)).format('YYYY-MM-DD HH:mm');
        var userName = info.who;//.replace(/\s*/g,"");
        if(userName.length>0){
          users = userName.split(/[,，]+/);
          await remind(sub_eventId, users, time, title);
        }else{ // who为空，发送邮件
          console.log('field who is null,sended administartor email');
          noWhoList.push(title);
         }
      }
      if(noWhoList.length>0){
        //sendEmail(config.email.receive,'课程参与人缺失提醒','',`课程标题：${title.join(';')}`);
      }
    }else{
      logMessage('not found TeamUp calendar data', 'info');
    }
  } catch (error) {
    logMessage(`Failed to fetch TeamUp calendar data: ${error.message}`, 'error');
  }
 }
 
 async function remind(sub_eventid, users, time, title){
  try {
    let noPhoneList = [];
    // send msg to teacher  teacherData[sub_eventid].name
    autoSendSms(phone, type, childName, time);
    sendEmail(teacherData[sub_eventid].email,'Reminders for new classes','',`Please remind your child ${item} to attend ${time}’s class. Pls ignore if you have already reported an absence.`);
    for (let index = 0; index < users.length; index++) {
      const item = users[index].trim();
      if(item=='')
        continue;
      let userInfo = await getCustomerDetail(item);
      if(userInfo){
        if(userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length>0){
          let phone = userInfo.monther.subForm_1[0].text_2;
          if(phone.trim().length==0){
            noPhoneList.push(item);
            continue;
          }else{
            let codenum = userInfo.monther.subForm_1[0].text_1.text;
            console.log('phonetype:;:'+codenum);
            phone = codenum.split(" ")[1].replace(/^0+/, '')+ phone;
            let type = userInfo.monther.text_8.value;
            let childName = userInfo.child.text_2;
            autoSendSms(phone, type, childName, time);//, teacherData[sub_eventid].name
          }
        }else{
          noPhoneList.push(item);
        }
        // 发邮件
        let email_address = userInfo.monther.text_86? userInfo.monther.text_86.value: null;
        if(email_address && email_address.length>0){
          sendEmail(config.email.receive,'Reminders for new classes','',`Please remind your child ${item} to attend ${time}’s class. Pls ignore if you have already reported an absence.`);
        }else{
          noPhoneList.push(item);
        }
      }
    }
    if(noPhoneList.length>0){
      const pers = [...new Set(noPhoneList)];
      sendEmail(config.email.receive,'参与人联系方式缺失提醒','',`参与人：${pers.join(',')}     课程标题：${title}     课程时间：${time}`);
    }
  } catch (error) {
    logMessage(`Failed to remind: ${error.message}`, 'error');
  }
 }

 async function test(){
  let userInfo = await getCustomerDetail('Misylia');
  if(userInfo){
    if(userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length>0){
      let phone = userInfo.monther.subForm_1[0].text_2;

      let codenum = userInfo.monther.subForm_1[0].text_1.text;
      phone = codenum.split(" ")[1].replace(/^0+/, '')+ "13052515651";
      let time = moment(new Date()).add(15,'M').format('YYYY-MM-DD HH:mm');
      let type = userInfo.monther.text_8.value;
      let childName = userInfo.child.text_2;
      autoSendSms(phone, type, childName, time);
    }
  }
 }

