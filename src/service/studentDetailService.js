
const db = require('../libs/db');
const { logMessage } = require('../libs/logger');
const { getCustomerDetail_check } = require('./xbbService');

async function update(id,info){
    let sql ='';
    if(info.state==9){
        sql = `delete from student_detail where id = '${info.code}';`;
    }else {
        sql =`update student_detail set `;
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
        sql+=` where id = '${info.code}';`;
    }
    
    return await new Promise((resolve, reject) => {
        db.run(sql, function(err) {
            if (err) {
                return resolve(null);
            }
            resolve(true);
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

async function StuInsertData(course_id, subcalendar_id, users, is_new){
    try {
        const stmt = db.prepare("INSERT INTO student_detail (course_id, subcalendar_id, name, code, parent_name, parent_code, state, read, write, level, evaluate, remarks, homework, value2) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        for (let index = 0; index < users.length; index++) {
            let username = users[index] ? users[index].trim() : '';
            if (username == '')
              continue;
           
            let usercode = username.match(/\d{8,10}/);
            let userInfo = null;
            let parent_name = '';
            let parent_code = '';
            
            if (usercode != null) {
                usercode = usercode[0];
              //userInfo = await getCustomerDetail_check(usercode, 1);
            } else {
              //userInfo = await getCustomerDetail_check(username);
            }
            // if (userInfo && userInfo.code==0) {
            //     usercode = userInfo.child.serialNo;
            //     parent_name = userInfo.monther.text_2;
            //     parent_code = userInfo.monther.serialNo;
            // }
            stmt.run(course_id, subcalendar_id, username, usercode, '', '', '0', '0', '0', '0', '', '', '',is_new);
        }
        stmt.finalize();
    } catch (error) {
        console.log(error);
    }
}

module.exports = { update, GetDataAll, StuInsertData };
