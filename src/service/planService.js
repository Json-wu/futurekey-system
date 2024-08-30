
const db = require('../libs/db');
const config = require('../config/config');
const { sendEmail } = require('./emailService');
const { logMessage } = require('../libs/logger');
const { getSubEventId } = require('../libs/common');

const emailConfig = config.email;
async function InsertData(req) {
    try {
        const { title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, teacher_name,is_full,signedup } = req.body;
        const subevent_id = getSubEventId(teacher_name);

        return await new Promise((resolve, reject) => {
            db.run("INSERT INTO class_plan (title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, teacher_name, subevent_id, is_full, signedup) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, teacher_name, subevent_id, is_full, signedup], function(err) {
                if (err) {
                    return resolve(null);
                }
                resolve(this.lastID);
            });
        });
        
        // const stmt = db.prepare("INSERT INTO class_plan (title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, teacher_name, subevent_id, is_full, signedup) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        // stmt.run(title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, teacher_name, subevent_id, is_full, signedup);
        // stmt.finalize();
        // return true;
    } catch (error) {
        logMessage(`InsertData-class_plan error，${error.message}`, 'error');
        return null;
    }
}
async function EditData(req) {
    try {
        const { id } = req.params;
        const { title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize } = req.body;

        const stmt = db.prepare("UPDATE class_plan SET title = ?, startTime = ?, endTime = ?, homework = ?, who = ?, classLevel = ?, isTrialClass = ?, classCategory = ?, classSize = ? WHERE id = ?");
        stmt.run(title, startTime, endTime, homework, who, classLevel, isTrialClass, classCategory, classSize, id);
        stmt.finalize();
        return true;
    } catch (error) {
        logMessage(`EditData error，${error.message}`, 'error');
        return false;
    }
}
async function GetData() {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`select * from class_plan order by id desc`, (err, data) => {
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

async function DeleteById(id) {
    try {
        return await new Promise((resolve, reject) => {
            db.run(`DELETE FROM class_plan WHERE id=${id}`, (err) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            })
        });
    } catch (error) {
        return false;
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

module.exports = { InsertData, GetData, EditData, GetData, sendMailSignStatus, DeleteById };
