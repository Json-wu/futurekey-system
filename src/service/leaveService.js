
const db = require('../libs/db');
const moment = require('moment');
const { logMessage } = require('../libs/logger');
const courseService = require('./courseService');
const {sendToAdmin} = require('./emailService');
const { sendBotMsg } = require('./botService');
const config = require('../config/config');
const { sendSmsToParent } = require('./courseService');
const { formatDateTime, formatTime } = require('../libs/common');

const emailConfig = config.email;
const smsConfig = config.sms;

async function InsertData(body) {
    try {
        const { code, name, reason, comment, date, courseChecks } = body;
        const create_date = moment().format('YYYY-MM-DD HH:mm:ss');
        let isok = true;
        for (let index = 0; index < courseChecks.length; index++) {
            const courseId = courseChecks[index];
            let courseData = await courseService.GetDataByid(courseId);
            let leave = await getLeaveByid(courseId, courseData.start_dt, courseData.end_dt);
            if(leave != null){
                continue;
            }
            // 创建请假记录
            let id = await createData({
                code,
                name,
                start_dt: courseData.start_dt,
                end_dt: courseData.end_dt,
                status: 0,
                create_date,
                reason,
                comment,
                courseId
            });
            if(id == null){
                logMessage(`InsertData-leave error，${courseData.title}`, 'error');
                isok = false;
            }else{
                // 老师请假之后，发送邮件给管理员,给微信机器人发消息，发送短信给家长
                sendToAdmin('About teacher’s request for leave',`Teacher ${courseData.teacher} has requested for leave from the course "${courseData.title}" on ${courseData.date}`);
                sendBotMsg('markdown',`Teacher <font color=\"warning\">${courseData.teacher}</font> has requested for leave from the course <font color=\"info\">${courseData.title}</font>。\n>course time：<font color=\"comment\">${formatDateTime(courseData.start_dt, courseData.tz)} ~ ${formatTime(courseData.end_dt, courseData.tz)}</font>\n>who：<font color=\"comment\">${courseData.who}</font>\n>signed up：<font color=\"comment\">${courseData.signed_up}</font>`,['@all']);
                 // 课程取消给家长发短信通知
                 if(smsConfig.sendToParent){
                    let whos = courseData.who.split(/[,，]+/);
                    let signs = courseData.signed_up.split(',');
                    let stus = whos.concat(signs).filter(x=>x.trim().length>0);
                    for (let index = 0; index < stus.length; index++) {
                        const studentName = stus[index];
                        if(studentName.trim().length == 0){
                            continue;
                        }
                        sendSmsToParent(studentName, courseData.start_dt, '99', courseData.tz);
                    }
                }
            }
        }
        return isok;
    } catch (error) {
        logMessage(`InsertData-leave error，${error.message}`, 'error');
        return false;
    }
}
async function createData(body) {
    return await new Promise((resolve, reject) => {
        db.run("INSERT INTO leave (code, name, start_dt, end_dt, status, create_date, reason, comment, courseId) VALUES (?, ?, ?, ?, ?, ?,?,?,?)", [body.code, body.name, body.start_dt, body.end_dt, 0, body.create_date, body.reason, body.comment, body.courseId ], function(err) {
            if (err) {
                return resolve(null);
            }
            resolve(this.lastID);
        });
    });
}
async function update(id){
    return await new Promise((resolve, reject) => {
        db.run(`update leave set status=1 where id=${id}`, function(err) {
            if (err) {
                return resolve(null);
            }
            resolve(this.lastID);
        });
    });
}


async function GetDataAll() {
    try {
        let sql = `SELECT * FROM leave  order by create_date desc`;
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

async function getLeaveByid(courseId, start_dt, end_dt) {
    try {
        let sql = `SELECT * FROM leave WHERE courseId = '${courseId}' AND start_dt == '${start_dt}' AND end_dt == '${end_dt}'`;
        return await new Promise((resolve, reject) => {
            db.get(sql, (err, data) => {
                if (err) {
                    return resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        logMessage(`GetDataAll error，${error.message}`, 'error');
        return null;
    }
}

module.exports = { InsertData, update, GetDataAll, getLeaveByid };
