const moment = require('moment');
const db = require('../libs/db');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const { getCustomerDetail_check } = require('../service/xbbService');

/**
 * 获取家长信息不完整的学生名单
 */
async function GetStudentNoInfo(date){
    try {
        let noPhoneList = new Set();
        let sameName = new Set();
        let sDate = moment(date).format('YYYY-MM-DD');
        let eDate = moment(date).add(30, 'days').format('YYYY-MM-DD');
        let data = await fetchTeamUpCalendar(sDate, eDate);
        if (data != null && data.length > 0) {
            data = data.filter(item=>{
                return item.who && item.who.length>0;
            });
            for (let i = 0; i < data.length; i++) {
                const who = data[i].who;
                let users = who.split(/[,，]+/);
                for (let j = 0; j < users.length; j++) {
                    const username = users[j];
                    if(username!=''){
                        console.log('username：'+username);
                        let isnoPhone = true;
                        let isnoEmail = true;
                        let userInfo = await getCustomerDetail_check(username);
                        if (userInfo) {
                            if(userInfo.code==0){
                                if (userInfo.monther.subForm_1 && userInfo.monther.subForm_1.length > 0) {
                                    let phones = userInfo.monther.subForm_1;
                                    
                                    for (let m = 0; m < phones.length; m++) {
                                      const subForm = phones[m];
                                      let phone = subForm.text_2 ? subForm.text_2.trim(): '';
                                      if (phone.length > 0) {
                                        isnoPhone = false;
                                      }
                                    }
                                  } 
                                  let email_address = userInfo.monther.text_86 ? userInfo.monther.text_86.value : null;
                                  if (email_address && email_address.length > 0) {
                                    isnoEmail = false;
                                  }
                                  if(isnoPhone && isnoEmail){
                                    noPhoneList.add(username);
                                  }
                            }else{
                                sameName.add(userInfo.name);
                            }
                        }else{
                          noPhoneList.add(username);
                        }
                    }
                }
            }
        }
        return {
            code: 0,
            data: {
                noPhoneList: [...noPhoneList],
                sameName: [...sameName]
            }
        }
    } catch (error) {
        return {
            code: 0,
            data: '',
            msg: 'GetStudentNoInfo error'
        };
    }
}

async function SyncStudentInfo(name, code, parent_code, parent_name, parent_phone, parent_areacode, parent_email, sale_code, sale_name, sale_phone, sale_email){
    try {
        let sql = `SELECT * FROM students WHERE code = '${code}' `;
        let stu= await new Promise((resolve, reject) => {
            db.get(sql, (err, data) => {
                if (err) {
                    return resolve(null);
                }
                resolve(data);
            })
        });
        if(stu==null){
            await new Promise((resolve, reject) => {
                db.run("INSERT INTO students (name, code, parent_code, parent_name, parent_phone, parent_areacode, parent_email, sale_code, sale_name, sale_phone, sale_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [name, code, parent_code, parent_name, parent_phone, parent_areacode, parent_email, sale_code, sale_name, sale_phone, sale_email], function(err) {
                    if (err) {
                        return resolve(null);
                    }
                    resolve(this.lastID);
                });
            });
        }else{
             await new Promise((resolve, reject) => {
                db.run(`update students set name='${name}',parent_code='${parent_code}', parent_name='${parent_name}',parent_phone='${parent_phone}', parent_areacode='${parent_areacode}',  parent_email='${parent_email}', sale_code='${sale_code}', sale_name='${sale_name}', sale_phone='${sale_phone}', sale_email='${sale_email}' where code='${code}'`, function(err) {
                    if (err) {
                        return resolve(null);
                    }
                    resolve(this.lastID);
                });
            });
        }
    } catch (error) {
        console.log('SyncStudentInfo Error.'+error.message);
    }
}

async function queryStudentInfo(name, code){
    try {
        if(code){
            let sql = `SELECT * FROM students WHERE code = '${code}' `;
            let stu= await new Promise((resolve, reject) => {
                db.get(sql, (err, data) => {
                    if (err) {
                        return resolve(null);
                    }
                    resolve(data);
                })
            });
            return stu;
        }
         sql = `SELECT * FROM students WHERE name = '${name}' `;
         stu= await new Promise((resolve, reject) => {
            db.all(sql, (err, data) => {
                if (err) {
                    return resolve(null);
                }
                resolve(data);
            })
        });
        if(stu && stu.length==1){
            return stu[0];
        }else{
         return null;
        }
    } catch (error) {
        console.log('queryStudentInfo error.'+error.message, new Date());
        return null;
    }
}

module.exports = { GetStudentNoInfo,SyncStudentInfo, queryStudentInfo };