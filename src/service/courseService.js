
const db = require('../libs/db');
const config = require('../config/config');
const moment = require('moment');
const { sendEmail } = require('../service/emailService');
const { logMessage } = require('../libs/logger');
const ejs = require('ejs');
const path = require('path');
const { fetchTeamUpCalendar, updateAnEvent } = require('../service/teamupService');
const messageService = require('../service/messageService');
const teacherData = require('../config/teacher.json');
const { StuInsertData } = require('./studentDetailService')
const studentDetailService = require('../service/studentDetailService');
const { replaceNumberToNull, formatDate, formatDateTime, formatTime, ejsHtml } = require('../libs/common');
const { getCustomerDetail } = require('../service/xbbService');
const { SendSms_parent } = require('../service/smsService');

const emailConfig = config.email;
const smsConfig = config.sms;

async function InsertData(info) {
    try {
        let class_level = '';
        let class_size = '';
        let is_trial_class = '';
        let class_category = '';
        let is_full = '0';

        is_full = info.signup_count == info.signup_limit ? '1' : '0';
        class_level = info.custom.class_level ? info.custom.class_level.join(',') : '-';
        class_size = info.custom.class_size ? info.custom.class_size.join(',') : '-';
        is_trial_class = info.custom.is_trial_class ? info.custom.is_trial_class.join(',') : '-';
        class_category = info.custom.class_category ? info.custom.class_category.join(',') : '-';

        const stmt = db.prepare("INSERT INTO courses (id, subcalendar_id, title, teacher, who,  start_dt, end_dt,date, tz, class_level, class_size,signed_up,is_trial_class,class_category,is_full,attend,status,value2) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

        stmt.run(info.id, info.subcalendar_id, info.title, info.teacherName, info.who, info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, info.signup_count, is_trial_class, class_category, is_full, '1', '1', info.is_new||'0');

        stmt.finalize();
        await StuInsertData(info.id, info.subcalendar_id, info.who);
        return true;
    } catch (error) {
        logMessage(`InsertData-course error，${error.message}`, 'error');
        return false;
    }
}
async function GetData(date, subcalendar_id) {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM courses where date='${date}' and subcalendar_id='${subcalendar_id}'`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        logMessage(`GetData error，${error.message}`, 'error');
        return null;
    }
}
async function GetDataAll(sdate, edate) {
    try {
        let sql = `SELECT * FROM courses`;
        return await new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    return resolve([]);
                }
                resolve(rows);
            })
        });
    } catch (error) {
        logMessage(`GetDataAll error，${error.message}`, 'error');
        return [];
    }
}
async function EditData(id, attend) {
    try {
        // 如果不出席发邮件提醒，修改teamup状态
        if (attend == 9) {
            let couData = await GetDataByid(id);
            if (couData)
                sendMail(couData);

            // edit teamup
            let upTitle = couData.title+"[decline]";
            let upData = await updateAnEvent(id, {who: '', title: upTitle });
            if(upData){
                logMessage(`edit teamup success`, 'info');
                let sql = `update courses set attend='${attend}', value2='0', id = '${upData.id}', who='', title="${upTitle}"  where id ='${id}'`;
                let result = await new Promise((resolve, reject) => {
                    db.run(sql, (err, data) => {
                        if (err) {
                            resolve(false);
                        }
                        resolve(true);
                    });
                });
                
                // 课程取消给家长发短信通知
                if(smsConfig.sendToParent){
                    let stus = couData.who.split(/[,，]+/);
                    for (let index = 0; index < stus.length; index++) {
                        const studentName = stus[index];
                        if(studentName.trim().length == 0){
                            continue;
                        }
                        sendSmsToParent(studentName, couData.start_dt, '99');
                        
                        let usercode = studentName.match(/\d{8,10}/);
                        let ucode='';
                        if (usercode != null) {
                            ucode=usercode[0];
                        }
                        let uname = studentName.replace(ucode, '').trim();
                        await new Promise((resolve, reject) => {
                            let sql2 = `delete from student_detail where course_id = '${couData.id}' and (name='${uname}' or code='${ucode}')`;
                            db.run(sql2, function(err) {
                                if (err) {
                                    return resolve(null);
                                }
                                resolve(this.lastID);
                            });
                        });
                    }
                }
                return result;
            }else{
                logMessage(`edit teamup failed`, 'error');
                return false;
            }
        }else{
            let result = await new Promise((resolve, reject) => {
                db.run(`update courses set attend=${attend}, value2='0' where id ='${id}'`, (err, data) => {
                    if (err) {
                        resolve(false);
                    }
                    resolve(true);
                });
            });
            return result;
        }
    } catch (error) {
        logMessage(`EditData error，${error.message}`, 'error');
        return false;
    }
}
async function EditStuData(id, student, value1) {
    try {
        let resdata = await new Promise((resolve, reject) => {
            db.run(`update courses set student='${student}', value1='${value1}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        if (resdata) {
            let couData = await GetDataByid(id);
            if (couData) {
                let students = JSON.parse(student).map(x => {
                    if (x.state == 0) {
                        x.state = 'Normal';
                    } else if (x.state == 1) {
                        x.state = 'Late';
                    } else {
                        x.state = 'Absent';
                    }
                    return x;
                });
                // 渲染 EJS 模板
                return await new Promise((resolve, reject) => {
                    ejs.renderFile(path.join(process.cwd(), 'src', 'views', 'report.ejs'), { students, value1 }, (err, html) => {
                        if (err) {
                            console.error('Error rendering EJS template:', err);
                            // res.status(500).send('Error rendering template');
                            resolve(false);
                        }

                        // 发送邮件
                        sendEmail(emailConfig.receive, `课程反馈表-${couData.title}`, '', html);
                        logMessage(`课程反馈表-${couData.title} ` + html, 'info');

                        resolve(true);
                    });
                });
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        logMessage(`EditStuData error，${error.message}`, 'error');
        return false;
    }
}
// 修改学生上课状态
async function SignStudentStatus(id, code, state) {
    try {
        let couData = await GetDataByid(id);
        if (couData) {
            let rs = await studentDetailService.update(id,{state, code});
           if(rs!=null){
            return true;
           }else{
            return false;
           }
        } else
            return false;
    } catch (error) {
        logMessage(`SignStudentStatus error，${error.message}`, 'error');
        return false;
    }
}

async function SaveInfo(body){
    try {
        const { id, students, preview, homework, previewfiles, homeworkfiles } = body;
        let result = await new Promise((resolve, reject) => {
            db.run(`update courses set preview='${preview}', homework='${homework}',value1='${previewfiles}', value2='${homeworkfiles}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });

        students.forEach(async student => {
            let resdata = await new Promise((resolve, reject) => {
                db.run(`update student_detail set read=${student.read}, write=${student.write}, level=${student.level}, evaluate='${student.evaluate}', remarks='${student.remarks}', homework='${student.homework}' where course_id ='${id}' and code='${student.code}'`, (err, data) => {
                    if (err) {
                        resolve(false);
                    }
                    resolve(true);
                });
            });
        });
        return result;
    } catch (error) {
        logMessage(`SaveInfo error，${error.message}`, 'error');
        return false;
    }
}

async function GetDataByid(id) {
    try {
        return await new Promise((resolve, reject) => {
            db.get(`select * from courses where id='${id}'`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        return null;
    }
}
async function Clear() {
    db.serialize(() => {
        db.run("Delete courses where 1=1;");
    });
}

function sendMail(couData) {
    try {
        var fpath = path.join(__dirname, `../public/email_reminderTeacher.html`);

        let start_dt = formatDateTime(couData.start_dt, couData.tz);
        let end_dt = formatTime(couData.end_dt, couData.tz);
        let who = replaceNumberToNull(couData.who);
        
        const html = ejsHtml(fpath, {title: couData.title, teacher: couData.teacher, who, start_dt, end_dt, email: emailConfig.receive});
        let msg = `Teacher ${couData.teacher}'s Late Absent Reminder`;

        sendEmail(emailConfig.receive, msg, '', html);

        logMessage(`${msg}. Participants: ${who} Course title: ${couData.title} Course time: ${start_dt}-${end_dt} ${couData.tz}`, 'info');
    } catch (error) {
        logMessage(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}
async function sendMailSignStatus(id, studentName, state) {
    try {
        let couData = await GetDataByid(id);

        var fpath = path.join(__dirname, `../public/email_reminderStudent.html`);
        couData.who = replaceNumberToNull(couData.who);
        couData.start_dt = formatDateTime(couData.start_dt, couData.tz);
        couData.end_dt = formatTime(couData.end_dt, couData.tz);
        couData.email = emailConfig.receive;

        studentName = replaceNumberToNull(studentName).replace(" ", ""); 

        let msg = state == 1 ? `Student ${studentName}'s Late Reminder` : `Student ${studentName}'s Absent Reminder`;

        const html = ejsHtml(fpath, {state, studentName, couData, emailConfig, msg});
        sendEmail(emailConfig.receive, msg, '', html);
        // 给家长发短信
        // 如果迟到或者缺课给家长发短信提醒
        if(smsConfig.sendToParent){
            sendSmsToParent(studentName, couData.start_dt, state);
        }

        logMessage(`${msg}. Participants: ${couData.who} Course title: ${couData.title} Course time: ${couData.start_dt}-${couData.end_dt} ${couData.tz}`, 'info');
    } catch (error) {
        logMessage(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}
/**
 * 学生迟到/缺课给家长发短信提醒
 * @param {*} studentName 
 * @param {*} time 
 * @param {*} state 
 */

async function sendSmsToParent(studentName, time, state) {
    try {
        let usercode = studentName.match(/\d{8,10}/);
        let userInfo = null;
        
        if (usercode != null) {
          userInfo = await getCustomerDetail(usercode[0], 1);
        } else {
          userInfo = await getCustomerDetail(studentName);
        }
        if (userInfo) {
          // send sms
          if (userInfo.monther &&userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length > 0) {
            let phones = userInfo.monther.subForm_1;
            for (let index = 0; index < phones.length; index++) {
                const subForm = phones[index];
                let phone = subForm.text_2 ? subForm.text_2.trim() : '';
                if (phone.length > 0) {
                  let codenum = '86';
                  if (subForm.text_1) {
                    codenum = subForm.text_1.text;
                    codenum = codenum.split(" ")[1].replace(/^0+/, '');
                    phone =  codenum+ phone;
                  }
                
                  let user = userInfo.child.text_2;
                  let type ='迟到';
                  if(state==1){ 
                    type = '迟到';
                  }else if(state==9){
                    type = '缺课';
                  }else{
                    type = '取消';
                  }
                  SendSms_parent(phone, {user, time, type});
                }
              }
          }
        }
    } catch (error) {
        logMessage(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}

/**
 * 校验课程信息，who/time变更后 需要提醒
 */
function CheckCourseInfo(oldInfo, newInfo) {
    if (oldInfo.who != newInfo.who || oldInfo.start_dt != newInfo.start_dt || oldInfo.end_dt != newInfo.end_dt) {
        return true;
    }
    return false;
}

async function CheckCourse(sdt,edt) {
    try {
        console.log('开始校验新课程！！！'+new Date());
        // let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        // let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        // let data = await fetchTeamUpCalendar('2024-06-01', '2024-09-21');
        // let list = await GetDataAll(dateNow, date_end);
        //data = data.filter(x=>x.who && x.who.trim().length > 0);
        let data = await fetchTeamUpCalendar(sdt,edt);
        let list = await GetDataAll(sdt,edt);
        if (data != null && data.length > 0) {
            for (let index = 0; index < data.length; index++) {
                let item = data[index];
                let id = item.id;
                let ischange = false;
                let oldInfo = list.find(x => x.id == id);
                let code = item.subcalendar_id;
                let name = teacherData[item.subcalendar_id] ? teacherData[item.subcalendar_id].name : 'no teacher name';

                if(oldInfo){
                    ischange = CheckCourseInfo(oldInfo, item);
                    UpdateCourseInfo(oldInfo, item);
                }else{
                    if(item.who.trim().length > 0){
                        ischange = true;
                        item.teacherName = name;
                        item.is_new = '1';
                        InsertData(item);
                    }
                }
                // 新课程提醒
                if(ischange){
                    let msg = `New course reminder for ${item.title}`;
                    console.log(msg+'::'+name+';;code'+code);
                    const cdt = moment().format('YYYY-MM-DD HH:mm:ss')
                    messageService.InsertData({code, name, msg, type: 'NewClass', id, cdt});
                }
            }
        }
        console.log('结束校验新课程！！！'+new Date());
    } catch (error) {
        logMessage(`CheckCourse error:${error.message}`, 'error');
    }
}

async function UpdateCourseInfo(oldInfo, newInfo) {
    try {
        let result = await new Promise((resolve, reject) => {
            db.run(`update courses set who='${newInfo.who}', start_dt = '${newInfo.start_dt}', end_dt = '${newInfo.end_dt}' where id ='${oldInfo.id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        if(result){
            if(oldInfo.who != newInfo.who){
                let oldStudents = oldInfo.who.split(/[,，]+/).map(s => s.trim());
                let newStudents = newInfo.who.split(/[,，]+/).map(s => s.trim());
                let removedStudents = oldStudents.filter(student => !newStudents.includes(student));
                console.log('Removed students:', removedStudents);
                removedStudents.forEach(async student => {
                    let usercode = student.match(/\d{8,10}/);
                    let ucode='';
                    if (usercode != null) {
                        ucode=usercode[0];
                    }
                    let uname = student.replace(ucode, '').trim();
                    await new Promise((resolve, reject) => {
                        db.run(`delete student_detail where course_id = '${oldInfo.id}' and (name='${uname}' or code='${ucode}')`, function(err) {
                            if (err) {
                                return resolve(null);
                            }
                            resolve(this.lastID);
                        });
                    });
                });
                let addedStudents = newStudents.filter(student => !oldStudents.includes(student));
                console.log('Added students:', addedStudents);
               
                await StuInsertData(newInfo.id, newInfo.subcalendar_id, addedStudents.join(','));
            }
        }
       
    } catch (error) {
        logMessage(`UpdateCourseInfo error:${error.message}`, 'error');
    }
}
/**
 * 初始化课程
 */
async function InitCourse() {
    try {
        let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        let data = await fetchTeamUpCalendar('2024-10-01', date_end);
        // let data = await fetchTeamUpCalendar('2024-10-04', '2024-10-04');
        data = data.filter(x => (x.who && x.who.length > 0) || x.signup_count>0);
        if (data != null && data.length > 0) {
            //Clear();

            const stmt = db.prepare("INSERT INTO courses (id, subcalendar_id, title, teacher, who, start_dt, end_dt, date, tz, class_level, class_size, signed_up, is_trial_class,class_category, is_full, attend, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

            const stmt_detail = db.prepare("INSERT INTO student_detail (course_id, subcalendar_id, name, code, state, parent_name, parent_code, read, write, level, evaluate, remarks, homework) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
            let class_level = '';
            let class_size = '';
            let is_trial_class = '';
            let class_category = '';
            let is_full = '0';
            data.forEach(info => {
                let teacherInfo = teacherData[info.subcalendar_id];
                let teacherName = '';
                if (teacherInfo == null) {
                    console.log('未找到老师信息' + info.subcalendar_id);
                    logMessage(`InitCourse: Teacher information not found.[${info.subcalendar_id}]`, 'error');
                } else {
                    teacherName = teacherInfo.name;
                }
                is_full = info.signup_count == info.signup_limit ? '1' : '0';
                class_level = info.custom.class_level ? info.custom.class_level.join(',') : '-';
                class_size = info.custom.class_size ? info.custom.class_size.join(',') : '-';
                is_trial_class = info.custom.is_trial_class ? info.custom.is_trial_class.join(',') : '-';
                class_category = info.custom.class_category ? info.custom.class_category.join(',') : '-';

                stmt.run(info.id, info.subcalendar_id, info.title, teacherName, info.who, info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, info.signups.map(x=>x.name).join(','), is_trial_class, class_category, is_full, '1', '1');

                info.who.split(/[,，]+/).forEach(student => {
                    if(student.trim().length >0){
                        let usercode = student.trim().match(/\d{8,10}/);
                        let ucode='';
                        if (usercode != null) {
                            ucode=usercode[0];
                        }
                        stmt_detail.run(info.id, info.subcalendar_id, student, ucode, '0', '', '', 0, 0, 0, '', '', '');
                    }
                })
            })
            stmt_detail.finalize();
            stmt.finalize();
        } else {
            logMessage('InitCourse: not found TeamUp calendar data', 'info');
        }
    } catch (error) {
        logMessage(`InitCourse error:${error.message}`, 'error');
    }
}

module.exports = { InsertData, GetData, EditData, EditStuData, SignStudentStatus, sendMailSignStatus, CheckCourse, InitCourse, GetDataByid, SaveInfo };
