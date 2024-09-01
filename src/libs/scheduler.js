// scheduler.js
const schedule = require('node-schedule');
const moment = require('moment');
const momenttz = require('moment-timezone');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const config = require('../config/config');
const { logMessage } = require('./logger');
const { getCustomerDetail } = require('../service/xbbService');
const { autoSendSms, SendSms_teacher } = require('../service/smsService');
const { getCustomerDetail_check } = require('../service/xbbService');
const { sendEmail } = require('../service/emailService');
const teacherData = require('../config/teacher');
const { InsertData } = require('../service/courseService');
const { getDateNow } = require('./common');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const { InsertTotalData } = require('../service/totalService');

const emailConfig = config.email;

/*
  * 定义规则
  * minute: 0-59
  * hour: 0-23
  * date: 1-31
  * month: 0-11
  * dayOfWeek: 0-6
  */
const rule = new schedule.RecurrenceRule();
rule.minute = [0, 30];

const rule2 = new schedule.RecurrenceRule();
rule2.hour = 1;
rule2.minute = 0;
rule2.second = 0;

// 定义任务
async function task() {
  console.log('任务执行:', new Date());

  classReminder();
  // test();
  // let item ='Melody_65967827';
  // let usercode  = item.match(/\d{8}/)[0];
  // let userInfo = await getCustomerDetail(usercode);
}
var job2=null;
var i =92;
async function task2() {
  console.log('任务2执行:', new Date());
  i = i-1;
  const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
  if(i==30 || date=='2024-08-01'){
    console.log('任务2cancle:'+date, new Date());
    job2.cancel();
    return;
  }
  console.log(date,new Date());
  DoRunTotal(date);
}

function scheduleLoad() {
  // 调度任务
  if (process.env.NODE_ENV === 'production') {
    console.log('当前生产环境，启动定时任务计划！！！', new Date());
    schedule.scheduleJob(rule, task);
    job2 = schedule.scheduleJob('*/30 * * * * *', task2);
  } else {
    console.log('非生产环境，不启动定时任务计划！！！');
    // schedule.scheduleJob(rule, task);
    //job2 = schedule.scheduleJob('*/30 * * * * *', task2);
    //DoRunTotal('2024-08-29');
    // classReminder();
    //for (let i = 29; i > 0; i--) {
      // const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
      // console.log(date);
      // DoRunTotal(date);
    //}
  }
}


/**
 * 课程开始前15分钟，给老师和学生发送短信提醒；
 * 从Teamup平台获取到排课信息；从销售帮获取到学生和老师电话号码/邮件
 */
async function classReminder() {
  try {
    console.log('课程开始前30分钟，给老师和学生发送短信提醒；')
    logMessage(new Date() + '开始校验提前课程提醒.', 'info');
    const data = await fetchTeamUpCalendar(getDateNow(), getDateNow());
    if (data != null && data.length > 0) {
      let title = "";
      let users = [];
      let sub_eventId = "";
      let time = "";
      let noWhoList = [];
      let dateNow = moment().seconds(0).milliseconds(0).utc();//new Date(moment().seconds(0).milliseconds(0));
      let date_end = moment(dateNow).add(30, 'minute').utc();
      logMessage(`查询到当天日历条数：${data.length}`, 'info');
      let sendData = data.filter(item => {
        let dt = (momenttz.tz(item.start_dt, item.tz)).utc();
        //let dt = new Date(item.start_dt);
        // console.log(item.start_dt+"--"+momenttz.tz(item.start_dt, item.tz).format('YYYY-MM-DD HH:mm:sss')+',,'+item.tz);
        // console.log(dt);
        // console.log(dateNow);
        // console.log(date_end);
        return dt > dateNow && dt <= date_end
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
      logMessage(`筛选出30分钟后开始课程日历条数：${sendData.length}`, 'info');
      for (let index = 0; index < sendData.length; index++) {
        const info = sendData[index];
        title = info.title;
        sub_eventId = info.subcalendar_id;
        time = momenttz.tz(info.start_dt, info.tz).format('YYYY-MM-DD HH:mm');
        var userName = info.who;//.replace(/\s*/g,"");
        if (userName.length > 0) {
          users = userName.split(/[,，]+/);
          await remind(info.id, sub_eventId, users, time, title, info.tz);
        } else { // who为空，发送邮件
          // console.log('field who is null,sended administartor email');
          noWhoList.push(title);
        }
        logMessage(`classInfo:>> title: ${title},time: ${time}, sub_eventId:${sub_eventId},who:${userName}`, 'info');
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

async function remind(id, sub_eventid, users, time, title, tz) {
  try {
    let noPhoneList = [];
    let ownerList =[];
    let teacherInfo = teacherData[sub_eventid];
    let teacherName = '';
    if (teacherInfo == null) {
      console.log('未找到老师信息');
      logMessage(`Teacher information not found.[${sub_eventid}]`, 'error');
    } else {
      teacherName = teacherInfo.name;
      // send msg to teacher  teacherName
      try {
        var fpath = path.join(__dirname, `../public/email.html`);
        var html_source = fs.readFileSync(fpath, 'utf-8');
        var dt = moment(new Date(time)).format('YYYY-MM-DD');
        const html = ejs.render(html_source, { teacherName, users, emailConfig, sub_eventid, time, tz, dt });
        sendEmail(teacherInfo.email, 'New Class Notification', '', html);
      } catch (error) {
        logMessage(`Failed send email to teacher.: ${error.message}`, 'error');
      }
    }
    // Record course information to database
    users = users.filter(x => x != '');
    let usersInfo = users.map(item => {
      return {
        name: item,
        state: 0,
        evaluate: ''
      }
    });
    InsertData(id, sub_eventid, title, teacherName, JSON.stringify(usersInfo), 0, time, tz);
    // Send a message to students’ parents
    
    for (let index = 0; index < users.length; index++) {
      const item = users[index] ? users[index].trim() : '';
      if (item == '')
        continue;
      let isnoPhone = true;
      let isnoEmail = true;
      let usercode = item.match(/\d{8,10}/);
      let userInfo = null;
      let owerId= null;
      
      if (usercode != null) {
        userInfo = await getCustomerDetail(usercode[0], 1);
      } else {
        userInfo = await getCustomerDetail(item);
      }
      if (userInfo) {
        // send sms
        if (userInfo.monther &&userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length > 0) {
          let phones = userInfo.monther.subForm_1;

          for (let index = 0; index < phones.length; index++) {
            const subForm = phones[index];
            let phone = subForm.text_2 ? subForm.text_2.trim() : '';
            if (phone.length > 0) {
              isnoPhone = false;
              console.log(' subForm.text_1:;:' + subForm.text_1);
              let codenum = '86';
              if (subForm.text_1) {
                codenum = subForm.text_1.text;
                codenum = codenum.split(" ")[1].replace(/^0+/, '');
                console.log('phonetype:;:' + codenum);
                phone =  codenum+ phone;
              }
              let type =1;// userInfo.monther.text_8.value;
              if(codenum !=='86'){
                type=2;
              }
              let childName = userInfo.child.text_2;
              autoSendSms(phone, type, childName, time);//, teacherName
            }
          }
        }
        if(userInfo.monther && userInfo.monther.ownerId && userInfo.monther.ownerId.length>0){
          owerId = userInfo.monther.ownerId[0].name;
        }
        // send email
        let email_address = userInfo.monther.text_86 ? userInfo.monther.text_86.value : null;
        if (email_address && email_address.length > 0) {
          isnoEmail = false;
          //sendEmail(email_address, 'Reminders for new classes', '', `Please remind your child ${item} to attend ${time}’s class. Pls ignore if you have already reported an absence.`);
        }
        if (isnoPhone && isnoEmail) {
          noPhoneList.push(item);
          ownerList.push(owerId);
          owerId=null;
        }
      } else {
        noPhoneList.push(item);
        ownerList.push(owerId);
      }
    }
    console.log('noPhoneList:', noPhoneList);
    if (noPhoneList.length > 0) {
      const pers = [...new Set(noPhoneList)];
      if (pers && pers.length > 0) {
        sendEmail(emailConfig.receive, '参与人联系方式缺失提醒', '', `联系方式缺失。参与人：${pers.join(',')}     课程标题：${title}     课程时间：${time} ${tz}   负责人：${ownerList.join(',')}`);
      }
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

async function DoRunTotal(date) {
  try {
    console.log('开始执行统计任务:', date);
    let data = await fetchTeamUpCalendar(date, date);
    if (data != null && data.length > 0) {
      data = data.filter(item => {
        return item.who && item.who.length > 0;
      });

      for (let i = 0; i < data.length; i++) {
        const eventData = data[i];

        let teacherInfo = teacherData[eventData.subcalendar_id];

        // 使用 moment.js 计算时长
        const startDate = moment(eventData.start_dt);
        const endDate = moment(eventData.end_dt);
        const duration = moment.duration(endDate.diff(startDate));
        const hours = duration.asHours().toFixed(2); // 计算时长（小时），保留2位小数

        const body = {
          eventid: eventData.id,
          subid: eventData.subcalendar_id,
          title: eventData.title,
          teacher: teacherInfo.name,
          student: '',
          parent: '',
          sdate: eventData.start_dt,
          edate: eventData.end_dt,
          hours: hours,
          date: date,
          tz: eventData.tz,
          who: eventData.who,
          type: 'teacher'
        };
        InsertTotalData(body);

        const who = eventData.who;
        let users = who.split(/[,，]+/);
        for (let j = 0; j < users.length; j++) {
          const username = users[j];
          if (username != '') {
            let usercode = username.match(/\d{8,10}/);
            let userInfo = null;
            if (usercode != null) {
              userInfo = await getCustomerDetail_check(usercode[0], 1);
            } else {
              userInfo = await getCustomerDetail_check(username);
            }
            if (userInfo) {
              if (userInfo.code == 0) {
                const body = {
                  eventid: eventData.id,
                  subid: eventData.subcalendar_id,
                  title: eventData.title,
                  teacher: teacherInfo.name,
                  student: userInfo.child.text_2 + ' ' + userInfo.child.serialNo,
                  parent: userInfo.monther.text_2 + ' ' + userInfo.monther.serialNo,
                  sdate: eventData.start_dt,
                  edate: eventData.end_dt,
                  hours: hours,
                  date: date,
                  tz: eventData.tz,
                  who: eventData.who,
                  type: 'parent'
                };
                InsertTotalData(body);
              }else{
                logMessage(`Get customer information failed: ${userInfo}-username:${username}`, 'error');
                const body = {
                  eventid: eventData.id,
                  subid: eventData.subcalendar_id,
                  title: eventData.title,
                  teacher: teacherInfo.name,
                  student: username,
                  parent: username+'-未找到家长信息',
                  sdate: eventData.start_dt,
                  edate: eventData.end_dt,
                  hours: '0',
                  date: date,
                  tz: eventData.tz,
                  who: eventData.who,
                  type: 'parent'
                };
                InsertTotalData(body);
              }
            }else{
              logMessage(`Get customer information failed: ${userInfo}-username:${username}`, 'error');
              const body = {
                eventid: eventData.id,
                subid: eventData.subcalendar_id,
                title: eventData.title,
                teacher: teacherInfo.name,
                student: username,
                parent: username+'-未找到家长信息',
                sdate: eventData.start_dt,
                edate: eventData.end_dt,
                hours: '0',
                date: date,
                tz: eventData.tz,
                who: eventData.who,
                type: 'parent'
              };
              InsertTotalData(body);
            }
          }
        }
      }
    }
    console.log('执行统计任务--finsish:', date);
  } catch (error) {
    console.log(error.stack);
  }
}



module.exports = { scheduleLoad, DoRunTotal };
