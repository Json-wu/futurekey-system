
const db = require('../libs/db');
const moment = require('moment');
const { logMessage } = require('../libs/logger');
const courseService = require('./courseService');

async function InsertData(body) {
    try {
        const { code, name, reason, comment, date, courseChecks } = body;
        const create_date = moment().format('YYYY-MM-DD HH:mm:ss');
        let isok = true;
        for (let index = 0; index < courseChecks.length; index++) {
            const courseId = courseChecks[index];
            let leave = await getLeaveByid(courseId, date);
            if(leave != null){
                continue;
            }
            // 创建请假记录
            let courseData = await courseService.GetDataByid(courseId);
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
