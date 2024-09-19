
const db = require('../libs/db');
const config = require('../config/config');
const moment = require('moment');
const { sendEmail } = require('../service/emailService');
const { logMessage } = require('../libs/logger');
const ejs = require('ejs');
const path = require('path');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const messageService = require('../service/messageService');
const teacherData = require('../config/teacher');

const emailConfig = config.email;
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

        const stmt = db.prepare("INSERT INTO courses (id, subcalendar_id, title, teacher, who,  start_dt, end_dt,date, tz, class_level, class_size,signed_up,is_trial_class,class_category,is_full,attend,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

        stmt.run(info.id, info.subcalendar_id, info.title, info.teacherName, info.who, info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, info.signup_count, is_trial_class, class_category, is_full, '1', '1');

        stmt.finalize();
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
        let result = await new Promise((resolve, reject) => {
            db.run(`update courses set attend=${attend} where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        // 如果不出席发邮件提醒
        if (result && attend == 9) {
            let couData = await GetDataByid(id);
            if (couData)
                sendMail(couData);
        }
        return result;
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

async function SignStudentStatus(id, studentName, state) {
    try {
        let couData = await GetDataByid(id);
        if (couData) {
            let student = JSON.parse(couData.student);
            student.forEach(x => {
                if (x.name == studentName) {
                    x.state = state;
                }
            })
            return await new Promise((resolve, reject) => {
                db.run(`update courses set student='${JSON.stringify(student)}' where id ='${id}'`, (err, data) => {
                    if (err) {
                        resolve(false);
                    }
                    resolve(true);
                });
            });
        } else
            return false;
    } catch (error) {
        logMessage(`SignStudentStatus error，${error.message}`, 'error');
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
        let students = JSON.parse(couData.student).map(x => x.name).join(',');
        sendEmail(emailConfig.receive, '老师课程不出席提醒', '', `参与人：${students}     课程标题：${couData.title}     课程时间：${couData.time}  ${couData.tz}`);
        logMessage(`老师课程不出席提醒  .参与人：${students}     课程标题：${couData.title}     课程时间：${couData.time}  ${couData.tz}`, 'info');
    } catch (error) {
        logMessage(`老师课程不出席提醒邮件发送失败，，${error.message}`, 'error');
    }
}
async function sendMailSignStatus(id, studentName, state) {
    try {
        let couData = await GetDataByid(id);
        let students = JSON.parse(couData.student).map(x => x.name).join(',');

        let msg = state == 1 ? `学生[${studentName}]迟到提醒` : `学生[${studentName}]缺课提醒`;
        sendEmail(emailConfig.receive, msg, '', `参与人：${students}     课程标题：${couData.title}     课程时间：${couData.time}  ${couData.tz}`);
        logMessage(`${msg}  .参与人：${students}     课程标题：${couData.title}     课程时间：${couData.time}  ${couData.tz}`, 'info');
    } catch (error) {
        logMessage(`老师课程不出席提醒邮件发送失败，，${error.message}`, 'error');
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

async function CheckCourse() {
    try {
        console.log('开始校验新课程！！！'+new Date());
        let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        let data = await fetchTeamUpCalendar(dateNow, date_end);
        let list = await GetDataAll(dateNow, date_end);
        //data = data.filter(x=>x.who && x.who.trim().length > 0);
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
                }else{
                    if(item.who.trim().length > 0){
                        ischange = true;
                        item.teacherName = name;
                        InsertData(item);
                    }
                }
                // 新课程提醒
                if(ischange){
                    let msg = `New course reminder for ${item.title}`;
                    console.log(msg+'::'+name+';;code'+code);
                    messageService.InsertData({code, name, msg, type: 'NewClass', id});
                }
            }
        }
        console.log('结束校验新课程！！！'+new Date());
    } catch (error) {
        logMessage(`CheckCourse error:${error.message}`, 'error');
    }
}
/**
 * 初始化课程
 */
async function InitCourse() {
    try {
        let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        let data = await fetchTeamUpCalendar('2024-06-01', date_end);
        data = data.filter(x => x.who && x.who.length > 0);
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

                stmt.run(info.id, info.subcalendar_id, info.title, teacherName, info.who, info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, info.signup_count, is_trial_class, class_category, is_full, '1', '1');

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

module.exports = { InsertData, GetData, EditData, EditStuData, SignStudentStatus, sendMailSignStatus, CheckCourse, InitCourse };
