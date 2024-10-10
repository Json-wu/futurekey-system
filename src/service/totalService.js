
const db = require('../libs/db');
const { sendEmail } = require('./emailService');
const { logMessage } = require('../libs/logger');
const { getSubEventId } = require('../libs/common');
const { DoRunTotal } = require('../libs/scheduler');

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

async function GetTotalDataBySubid(subid, sdate, edate) {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`select * from class_his where subid='${subid}' AND date >= '${sdate}' AND date <='${edate}' order by id desc`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        logMessage(`GetTotalDataBySubid-class_his error，${error.message}`, 'error');
        return null;
    }
}

async function InitData(s_date, e_date){
    try {
        db.run(`DELETE FROM class_his where date >= '${s_date}' AND date <='${e_date}';`);
        console.log('InitData: 已删除class_his  '+s_date+'至'+e_date);
        
        let currentDate = new Date(s_date);
        const endDate = new Date(e_date);

        while (currentDate <= endDate) {
            let date = currentDate.toISOString().split('T')[0];
            console.log(date);
            DoRunTotal(date);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return {code: 0, msg: `InitData-class_his success ${s_date} to ${e_date}`};
    } catch (error) {
        return {code: 1, msg:`InitData-class_his error，${error.message}`};
    }
}

module.exports = { InsertTotalData, GetTotalData, GetTotalDataBySubid, InitData };
