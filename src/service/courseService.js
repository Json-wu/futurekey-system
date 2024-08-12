
const db = require('../libs/db');
const config = require('../config/config');
const { sendEmail } = require('../service/emailService');
const { logMessage } = require('../libs/logger');
const ejs = require('ejs');
const path = require('path');

const emailConfig = config.email;
async function InsertData(id, subid, title, teacher, student, attend, time,tz) {
    try {
        const stmt = db.prepare("INSERT INTO courses (id,subid,title,teacher,student,attend,time,date,tz) VALUES (?,?,?,?,?,?,?,?,?)");
        stmt.run(id, subid, title, teacher, student, attend, time, time.substr(0, 10),tz);
        stmt.finalize();
        return true;
    } catch (error) {
        logMessage(`InsertData error，${error.message}`, 'error');
        return false;
    }
}
async function GetData(date, subid) {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM courses where date='${date}' and subid='${subid}'`, (err, data) => {
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
async function EditStuData(id, student) {
    try {
        let resdata = await new Promise((resolve, reject) => {
            db.run(`update courses set student='${student}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        if (resdata) {
            let couData = await GetDataByid(id);
            if (couData) {
                let students = JSON.parse(student).map(x=>{
                    if(x.state ==0){
                        x.state = 'Normal';
                    }else  if(x.state ==0){
                        x.state = 'Late';
                    }else{
                        x.state = 'Absent';
                    }
                    return x;
                });
                // 渲染 EJS 模板
                return await new Promise((resolve, reject) => {
                    ejs.renderFile(path.join(process.cwd(), 'src', 'views', 'report.ejs'), { students }, (err, html) => {
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

module.exports = { InsertData, GetData, EditData, EditStuData, SignStudentStatus, sendMailSignStatus };
