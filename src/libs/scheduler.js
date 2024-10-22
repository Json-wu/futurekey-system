// scheduler.js
const schedule = require('node-schedule');
const db = require('../libs/db');
const moment = require('moment');
const momenttz = require('moment-timezone');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const config = require('../config/config');
const { logMessage } = require('./logger');
const { GETstudentList, getStudentDetail, getCustomerInfo} = require('../service/xbbService');
const { autoSendSms, SendSms_teacher } = require('../service/smsService');
const { sendEmail } = require('../service/emailService');
const teacherData = require('../config/teacher.json');
const { CheckCourse } = require('../service/courseService');
const { getDateNow, ejsHtml } = require('./common');
const path = require('path');
const { sendBotMsg } = require('../service/botService');
const { SyncStudentInfo, queryStudentInfo } = require('../service/studentService');

const emailConfig = config.email;
const timerSet_class = config.timerSet_class;
const timerSet_total = config.timerSet_total;
const timerSet_newclass = config.timerSet_newclass;
const timerSet_syncXBB = config.timerSet_syncXBB;

/*
  * 课程提醒任务：每20分钟执行一次
  * minute: 0-59
  * hour: 0-23
  * date: 1-31
  * month: 0-11
  * dayOfWeek: 0-6
  */
const rule_class = new schedule.RecurrenceRule();
rule_class.minute = timerSet_class.minute;

/**
 * 课时统计任务：每天凌晨0点5分执行
 */
const rule_total = new schedule.RecurrenceRule();
rule_total.hour = timerSet_total.hour;
rule_total.minute = timerSet_total.minute;

/**
 * 新课检测任务：每小时执行一次
 */
const rule_newClass = new schedule.RecurrenceRule();
rule_newClass.minute = timerSet_newclass.minute;

const rule_syncXBB = new schedule.RecurrenceRule();
// rule_syncXBB.hour = timerSet_syncXBB.hour;
rule_syncXBB.minute = timerSet_syncXBB.minute;


// 定义任务
async function task_class() {
  console.log(`任务task_class执行:开始校验开课提醒！！！`, new Date());
  classReminder();
}

async function task_total() {
  const date = moment().subtract(1, 'days').format('YYYY-MM-DD');
  console.log(`任务task_total执行:开始计算${date}课时统计！！！`, new Date());
  DoRunTotal(date);
}

async function task_newClass() {
  console.log(`任务task_newClass执行:开始校验新课程！！！`, new Date());
  let date_s = moment().format('YYYY-MM-DD');
  let date_e = moment().add(30,'day').format('YYYY-MM-DD');
  CheckCourse(date_s, date_e);
}

// 同步销帮帮数据
async function task_syncXbbData() {
  console.log(`任务task_syncXbbData执行:开始同步销帮帮数据！！！`, new Date());
  await syncXbbData();
}

let sdt='2024-08-10';
async function task_newClass2() {
  console.log(`任务task_newClass执行:开始校验新课程！！！`,sdt);
  let dateNow = sdt;
  let date_end = moment(dateNow).add(1, 'day').format('YYYY-MM-DD');
  CheckCourse(dateNow, date_end);
  sdt = date_end;
}
/**
 * 初始化课时统计任务
 */
var job2=null;
var i =113;
async function task_init() {
  console.log('任务task_init执行:', new Date());
  i = i-1;
  const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
  if(i==0 || date=='2024-09-21'){
    console.log('任务task_init cancle:'+date, new Date());
    job2.cancel();
    return;
  }
  console.log(date,new Date());
  DoRunTotal(date);
}

function scheduleLoad() {
  // 调度任务
    if(timerSet_class.enable){
      console.log('已启动定时开课提醒任务！！！', new Date());
      schedule.scheduleJob(rule_class, task_class);
    }
    if(timerSet_total.enable){
      console.log('已启动自动计算课时统计任务！！！', new Date());
      schedule.scheduleJob(rule_total, task_total);
    }
    if(timerSet_newclass.enable){
      console.log('已启动自动校验新课任务！！！', new Date());
      schedule.scheduleJob(rule_newClass, task_newClass);
      //schedule.scheduleJob('*/30 * * * * *', task_newClass2);
    }
    if(timerSet_syncXBB.enable){
      console.log('已启动销帮帮学生数据同步！！！', new Date());
      schedule.scheduleJob(rule_syncXBB, task_syncXbbData);
      //schedule.scheduleJob('*/30 * * * * *', task_newClass2);
    }
    // 初始化课时统计
    //job2 = schedule.scheduleJob('*/30 * * * * *', task_init);
}

/**
 * 课程开始前15分钟，给老师和学生发送短信提醒；
 * 从Teamup平台获取到排课信息；从销售帮获取到学生和老师电话号码/邮件
 */
async function classReminder() {
  try {
    // logMessage(new Date() + '开始校验提前课程提醒.', 'info');
    const data = await fetchTeamUpCalendar(getDateNow(), getDateNow());
    if (data != null && data.length > 0) {
      let title = "";
      let users = [];
      let sub_eventId = "";
      let time = "";
      let noWhoList = [];
      let dateNow = moment().seconds(0).milliseconds(0).utc();
      let date_end = moment(dateNow).add(timerSet_class.timeout, 'minute').utc();
      // logMessage(`查询到当天日历条数：${data.length}`, 'info');
      let sendData = data.filter(item => {
        let dt = (momenttz.tz(item.start_dt, item.tz)).utc();
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
      // logMessage(`筛选出稍后需要提醒的课程条数：${sendData.length}`, 'info');
      for (let index = 0; index < sendData.length; index++) {
        const info = sendData[index];
        title = info.title;
        sub_eventId = info.subcalendar_id;
        time = momenttz.tz(info.start_dt, info.tz).format('YYYY-MM-DD HH:mm');
        var userName = info.who;//.replace(/\s*/g,"");
        if (userName.length > 0) {
          users = userName.split(/[,，]+/);
          await remind(info.id, sub_eventId, users, time, title, info.tz);
        }
        // logMessage(`classInfo:>> title: ${title},time: ${time},tz:${info.tz}, sub_eventId:${sub_eventId},who:${userName}`, 'info');
      }
    } else {
      // logMessage('not found TeamUp calendar data', 'info');
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
      if(teacherInfo.enable_email==1){
        teacherName = teacherInfo.name;
        // send msg to teacher  teacherName
        try {
          var dt = moment(new Date(time)).format('YYYY-MM-DD');
          var fpath = path.join(__dirname, `../public/email.html`);
          const html =ejsHtml(fpath, { teacherName, users, emailConfig, sub_eventid, time, tz, dt });
          sendEmail(teacherInfo.email, 'New Class Notification', '', html);
        } catch (error) {
          logMessage(`Failed send email to teacher.: ${error.message}`, 'error');
        }
      }
    }
    users = users.filter(x => x != '');
    
    for (let index = 0; index < users.length; index++) {
      const item = users[index] ? users[index].trim() : '';
      if (item == '')
        continue;
      let isnoPhone = true;
      let isnoEmail = true;
      let usercode = item.match(/\d{8,10}/);
      if (usercode != null) {
        usercode = usercode[0];
      }else{
        usercode=null;
      }
      let userInfo = await queryStudentInfo(item,usercode);
      let owerId= null;
      if (userInfo) {
        if(!userInfo.parent_phone){
          noPhoneList.push(item);
          sendBotMsg('text',`您的学员【${item}】的客户联系电话和邮箱缺失，请及时补充。@${owerId}`, []);
        }else{
          let phone = userInfo.parent_phone;
          let type =1;
          if(userInfo.parent_areacode!='86'){
            type=2;
          }
          autoSendSms(phone, type, userInfo.name, time, tz);
        }
      } else {
        noPhoneList.push(item);
        ownerList.push(owerId);
        sendBotMsg('text',`未找到学员【${item}】相关信息，请相关人员检查学员姓名是否正确。[课程标题：${title}          课程时间：${time} ${tz}]`, ['@all']);
      }
    }
    if (noPhoneList.length > 0) {
      sendEmail(emailConfig.receive, '参与人联系方式缺失提醒', '', `联系方式缺失。参与人：${noPhoneList.join(',')}             课程标题：${title}             课程时间：${time} ${tz}           负责人：${ownerList.join(',')}`);
    }
  } catch (error) {
    logMessage(`Failed to remind: ${error.message}`, 'error');
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
        const hours = duration.asHours().toFixed(1); // 计算时长（小时），保留2位小数

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
            // let userInfo = null;

            if (usercode != null) {
              usercode = usercode[0];
            }else{
              usercode=null;
            }
            let userInfo = await queryStudentInfo(username,usercode);
            if (userInfo) {
              if (userInfo.code == 0) {
                const body = {
                  eventid: eventData.id,
                  subid: eventData.subcalendar_id,
                  title: eventData.title,
                  teacher: teacherInfo.name,
                  student: userInfo.name + ' ' + userInfo.code,
                  parent: username+'-未找到家长信息',
                  sdate: eventData.start_dt,
                  edate: eventData.end_dt,
                  hours: hours,
                  date: date,
                  tz: eventData.tz,
                  who: eventData.who,
                  type: 'parent'
                };
                if(userInfo.monther){
                  body.parent = userInfo.parent_name + ' ' + userInfo.parent_code;
                }
                InsertTotalData(body);
              }else{
                logMessage(`Get customer information failed: username:${username}`, 'error');
                const body = {
                  eventid: eventData.id,
                  subid: eventData.subcalendar_id,
                  title: eventData.title,
                  teacher: teacherInfo.name,
                  student: username,
                  parent: username+'-未找到家长信息',
                  sdate: eventData.start_dt,
                  edate: eventData.end_dt,
                  hours: hours,
                  date: date,
                  tz: eventData.tz,
                  who: eventData.who,
                  type: 'parent'
                };
                InsertTotalData(body);
              }
            }else{
              logMessage(`Get customer information failed2:-username:${username}`, 'error');
              const body = {
                eventid: eventData.id,
                subid: eventData.subcalendar_id,
                title: eventData.title,
                teacher: teacherInfo.name,
                student: username,
                parent: username+'-未找到家长信息',
                sdate: eventData.start_dt,
                edate: eventData.end_dt,
                hours: hours,
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

async function InsertTotalData(body) {
  try {
      const { eventid, subid, title, teacher, student, parent,sdate, edate, hours,date, tz, who, type } = body;
      return await new Promise((resolve, reject) => {
          db.run("INSERT INTO class_his (eventid, subid, title, teacher, student, parent,sdate, edate, hours,date, tz, who, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)", [eventid, subid, title, teacher, student, parent,sdate, edate, hours,date, tz,who, type], function(err) {
              if (err) {
                  return resolve(null);
              }
              resolve(this.lastID);
          });
      });
  } catch (error) {
      logMessage(`InsertData-class_his error，${error.message}`, 'error');
      return null;
  }
}


async function checkTimes(){
  if(times>14){
    await sleep(1);
    times=0;
  }
}
let times=0;
async function syncXbbData() {
  try {
    console.log('syncXbbData is start!!!', new Date())
    times++;
    await checkTimes();
    let studentList = await GETstudentList(1);
    let total = studentList.result.totalPage;
    await upStudent(studentList.result.list);
    for (let page = 2; page <= total; page++) {
      console.log('sync xbb data on page:'+page, new Date());
      times++;
      await checkTimes();
      studentList = await GETstudentList(page);
      await upStudent(studentList.result.list);
    }
   console.log('syncXbbData is ok!!!', new Date())
  } catch (error) {
    console.log('syncXbbData error.',error.message);
  }
}


async function upStudent(datalist){
  try {
    for (let index = 0; index < datalist.length; index++) {
      const stu = datalist[index];
      times++;
      // 获取学生信息
      await checkTimes();
      let studentData = await getStudentDetail(stu.dataId);
      let studentInfo = studentData && studentData.result ? studentData.result.data: null;
      times++;
      // 获取家长信息
      let customInfo;
      if(stu.data && stu.data.text_1){
        await checkTimes();
        let customData = await getCustomerInfo(stu.data.text_1);
        customInfo = customData && customData.result ? customData.result.data: null;
        times++;
      }

      // 更新学生信息表
      let parent_name='';
      let parent_code='';
      let parent_phone=[];
      let parent_areacode=[];
      let parent_email='';
      if(customInfo){
        parent_name = customInfo.text_2;
        parent_code = customInfo.serialNo;
        if(customInfo.subForm_1 && customInfo.subForm_1.length>0){
          customInfo.subForm_1.forEach(tel => {
            if(tel && tel.text_2){
              parent_phone.push(tel.text_2);
            }
           
            if(tel && tel.text_1 && tel.text_1.text){
              parent_areacode.push(tel.text_1.text.split(" ")[1].replace(/^0+/, ''));
            }
            if(tel && tel.text_86){
              parent_email = tel.text_86;
            }
          });
        }
      }

      let sale_name=[];
      if(customInfo.ownerId && customInfo.ownerId.length>0){
        customInfo.ownerId.forEach(item=>{
          if(item && item.name){
            sale_name.push(item.name);
          }
        })
      }
      if(customInfo.coUserId  && customInfo.coUserId.length>0){
        customInfo.coUserId.forEach(item=>{
          if(item && item.name){
            sale_name.push(item.name);
          }
        })
      }
      await SyncStudentInfo(studentInfo.text_2, studentInfo.serialNo, parent_code, parent_name, parent_phone.join(','), parent_areacode.join(','), parent_email,'',sale_name.join(','), '', '' );
    }
  } catch (error) {
    console.log('upStudent error.',error.message);
  }
}

// 等待指定秒数后再执行
async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}


module.exports = { scheduleLoad, DoRunTotal };
