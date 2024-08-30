
const db = require('../libs/db');
const { sendEmail } = require('./emailService');
const { logMessage } = require('../libs/logger');
const { getSubEventId } = require('../libs/common');

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
async function GetTotalData(sdate, edate) {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`select * from class_his where date >= '${sdate}' AND date <='${edate}' order by id desc`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        logMessage(`GetTotalData-class_his error，${error.message}`, 'error');
        return null;
    }
}

module.exports = { InsertTotalData, GetTotalData};
