
const db = require('../libs/db');
const { logMessage } = require('../libs/logger');

const urls={
    'NewClass':'',
    'HomeWork':'',
    'Leave': ''
};

async function InsertData(body) {
    try {
        const { code, name, msg, type, url, create_date } = body;
        return await new Promise((resolve, reject) => {
            db.run("INSERT INTO message_info (code, name, msg, url, isread, create_date) VALUES (?, ?, ?, ?, ?, ?)", [code, name, msg, url, 0, create_date], function(err) {
                if (err) {
                    return resolve(null);
                }
                resolve(this.lastID);
            });
        });
    } catch (error) {
        logMessage(`InsertData-message_info error，${error.message}`, 'error');
        return null;
    }
}
async function update(id){
    return await new Promise((resolve, reject) => {
        db.run(`update message_info set isread=1 where id=${id}`, function(err) {
            if (err) {
                return resolve(false);
            }
            resolve(true);
        });
    });
}
async function count(code) {
    try {
        return await new Promise((resolve, reject) => {
            db.count(`select count(1) from message_info where code = '${code}' and isread=0`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        logMessage(`count-message_info error，${error.message}`, 'error');
        return 0;
    }
}

async function GetMsg(code) {
    try {
        let sql = `SELECT * FROM message_info where code='${code}' and isread=0 order by create_date desc`;
        return await new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    return resolve([]);
                }
                resolve(rows);
            })
        });
    } catch (error) {
        logMessage(`GetMsg error，${error.message}`, 'error');
        return [];
    }
}

module.exports = { InsertData, count, update, GetMsg };
