
const db = require('../libs/db');
const { logMessage } = require('../libs/logger');

async function update(id,info){
    let sql =`update student_detail set `;
    if(info.hasOwnProperty('state')){
        sql+=`state='${info.state}',`;
    }
    if(info.hasOwnProperty('read')){
        sql+=`read='${info.read}',`;
    }
    if(info.hasOwnProperty('write')){
        sql+=`write='${info.write}',`;
    }
    if(info.hasOwnProperty('level')){
        sql+=`level='${info.level}',`;
    }
    if(info.hasOwnProperty('evaluate')){
        sql+=`evaluate='${info.evaluate}',`;
    }
    if(info.hasOwnProperty('remarks')){
        sql+=`remarks='${info.remarks}',`;
    }
    if(info.hasOwnProperty('homework')){
        sql+=`homework='${info.homework}',`;
    }
    sql = sql.substring(0, sql.length - 1);
    sql+=`where id=${id}`;
    return await new Promise((resolve, reject) => {
        db.run(sql, function(err) {
            if (err) {
                return resolve(null);
            }
            resolve(this.lastID);
        });
    });
}


async function GetDataAll(course_id) {
    try {
        let sql = `SELECT * FROM student_detail where course_id='${course_id}' order by id asc`;
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

module.exports = { update, GetDataAll };
