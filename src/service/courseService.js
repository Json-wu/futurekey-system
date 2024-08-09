
const db = require('../libs/db');

async function InsertData(id,subid,title,teacher,student,attend,time,date){
    try {
        const stmt = db.prepare("INSERT INTO courses (id,subid,title,teacher,student,attend,time,date) VALUES (?,?,?,?,?,?,?,?)");
        stmt.run(id,subid,title,teacher,student,attend,time,time.substr(0,10));  
        stmt.finalize();
        return true;
    } catch (error) {
        console.log('InsertData error'+error.message);
        return false;
    }
}
async function GetData(date,subid){
    try {
        return await new Promise((resolve, reject)=>{
            db.all(`SELECT * FROM courses where date='${date}' and subid='${subid}'`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
             })
        });
    } catch (error) {
        console.log('GetData error'+error.message);
        return null;
    }
}
async function EditData(id,attend ){
    try {
        return await new Promise((resolve, reject)=>{
            db.run(`update courses set attend=${attend} where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
                });
        });
    } catch (error) {
        console.log('EditData error'+error.message);
        return false;
    }
}
async function EditStuData(id,student ){
    try {
        return await new Promise((resolve, reject)=>{
            db.run(`update courses set student='${student}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
                });
        });
    } catch (error) {
        console.log('EditStuData error'+error.message);
        return false;
    }
}

module.exports = { InsertData, GetData, EditData,EditStuData };
