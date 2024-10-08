
const db = require('../libs/db');
const moment = require('moment');
const { logMessage } = require('../libs/logger');

async function InsertData(body) {
    try {
        const { code, name, start_dt, end_dt, reason, comment, courseId } = body;
        const create_date = moment().format('YYYY-MM-DD HH:mm:ss');
        return await new Promise((resolve, reject) => {
            db.run("INSERT INTO leave (code, name, start_dt, end_dt, status, create_date, reason, comment, courseId) VALUES (?, ?, ?, ?, ?, ?,?,?,?)", [code, name, start_dt, end_dt, 0, create_date, reason, comment, courseId ], function(err) {
                if (err) {
                    return resolve(null);
                }
                resolve(this.lastID);
            });
        });
    } catch (error) {
        logMessage(`InsertData-leave error，${error.message}`, 'error');
        return null;
    }
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

async function getLeaveByid(courseId, date){
    try {
        let st = moment(new Date(date)).format('YYYY-MM-DD')+' 00:00';
        let et = moment(new Date(date)).format('YYYY-MM-DD')+' 23:59';
        let sql = `SELECT * FROM leave where courseId = '${courseId}' or (start_dt == '${st}' and end_dt == '${et}')`;
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
