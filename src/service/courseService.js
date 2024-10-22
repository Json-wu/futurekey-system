
const db = require('../libs/db');
const config = require('../config/config');
const moment = require('moment');
const { sendEmail } = require('../service/emailService');
const { logMessage } = require('../libs/logger');
const ejs = require('ejs');
const path = require('path');
const { fetchTeamUpCalendar, updateAnEvent } = require('../service/teamupService');
const messageService = require('../service/messageService');
const teacherData = require('../config/teacher.json');
const { StuInsertData } = require('./studentDetailService')
const studentDetailService = require('../service/studentDetailService');
const { replaceNumberToNull, formatDate, formatDateTime, formatTime, ejsHtml, formatDateE } = require('../libs/common');
const { SendSms_parent } = require('../service/smsService');
const { SyncStudentInfo, queryStudentInfo } = require('../service/studentService');

const emailConfig = config.email;
const smsConfig = config.sms;

async function InsertData(info) {
    try {
        let class_level = '';
        let class_size = '';
        let is_trial_class = '';
        let class_category = '';
        let is_full = '0';

        is_full = info.signup_count == info.signup_limit ? '1' : '0';
        class_level = info.custom.special_requirement ? info.custom.special_requirement.join(',') : '-';
        class_size = info.custom.class_size ? info.custom.class_size.join(',') : '-';
        is_trial_class = info.custom.is_trial_class ? info.custom.is_trial_class.join(',') : '-';
        class_category = info.custom.class_category ? info.custom.class_category.join(',') : '-';

        let who = info.who.split(/[,，]+/).filter(x=>x).map(s => s.trim());
        let signups = info.signups.map(x=>x.name);

        const stmt = db.prepare("INSERT INTO courses (id, subcalendar_id, title, teacher, who,  start_dt, end_dt,date, tz, class_level, class_size,signed_up,is_trial_class,class_category,is_full,attend,status,value2,value3) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

        stmt.run(info.id, info.subcalendar_id, info.title, info.teacherName, who.join(','), info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, signups.join(','), is_trial_class, class_category, is_full, '0', '1', info.is_new||'0', info.series_id);

        stmt.finalize();
        
        let users = [];
       
        users = who.concat(signups).filter(x=>x).filter(x=>x.trim().length>0);
        if(users.length>0){
            await StuInsertData(info.id, info.subcalendar_id, users, info.is_new||'0');
        }else{
            console.log('课程没有学生！！！'+info.id);
        }
        return true;
    } catch (error) {
        console.log(`InsertData-course error，${error.message}`, 'error');
        return false;
    }
}
async function GetData(date, subcalendar_id) {
    try {
        return await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM courses where date='${date}' and subcalendar_id='${subcalendar_id}'`, (err, data) => {
                if (err) {
                    resolve(null);
                }
                resolve(data);
            })
        });
    } catch (error) {
        console.log(`GetData error，${error.message}`, 'error');
        return null;
    }
}
async function GetDataAll(sdate, edate) {
    try {
        let sql = `SELECT * FROM courses where date>='${sdate}' and date<='${edate}' order by date asc`;
        return await new Promise((resolve, reject) => {
            db.all(sql, (err, rows) => {
                if (err) {
                    return resolve([]);
                }
                resolve(rows);
            })
        });
    } catch (error) {
        console.log(`GetDataAll error，${error.message}`, 'error');
        console.log(`GetDataAll error，${error.message}`, 'error');
        return [];
    }
}
async function EditData(id, attend) {
    try {
        // 如果不出席发邮件提醒，修改teamup状态
        if (attend == 9) {
            let couData = await GetDataByid(id);
            if (couData)
                sendMail(couData);

            // edit teamup
            let upTitle = couData.title+"[declined]";
            let upData = await updateAnEvent(id, {who: '', title: upTitle });
            if(upData){
                console.log(`edit teamup success`, 'info');
                let sql = `update courses set attend='${attend}', value2='0', id = '${upData.id}', who='', title="${upTitle}"  where id ='${id}'`;
                let result = await new Promise((resolve, reject) => {
                    db.run(sql, (err, data) => {
                        if (err) {
                            resolve(false);
                        }
                        resolve(true);
                    });
                });
                
                // 课程取消给家长发短信通知
                if(smsConfig.sendToParent){
                    let whos = couData.who.split(/[,，]+/);
                    let signs = couData.signed_up.split(',');
                    let stus = whos.concat(signs).filter(x=>x.trim().length>0);
                    for (let index = 0; index < stus.length; index++) {
                        const studentName = stus[index];
                        if(studentName.trim().length == 0){
                            continue;
                        }
                        sendSmsToParent(studentName, couData.start_dt, '99', couData.tz);
                    }
                }

                // 删除学生信息
                await new Promise((resolve, reject) => {
                    let sql2 = `delete from student_detail where course_id = '${couData.id}';`;
                    db.run(sql2, function(err) {
                        if (err) {
                            return resolve(false);
                        }
                        resolve(true);
                    });
                });
                return result;
            }else{
                console.log(`edit teamup failed`, 'error');
                return false;
            }
        }else{
            let result = await new Promise((resolve, reject) => {
                db.run(`update courses set attend=${attend}, value2='0' where id ='${id}'`, (err, data) => {
                    if (err) {
                        return resolve(false);
                    }
                    resolve(true);
                });
            });
            if(result){
                let cdata = await new Promise((resolve, reject) => {
                    db.get(`select * from courses where value2='1' and date=(SELECT date FROM courses where  id='${id}') and subcalendar_id =(select subcalendar_id FROM courses where  id='${id}')`, (err, data) => {
                        if (err) {
                            resolve(null);
                        }
                        resolve(data);
                    })
                });
                if(!cdata){
                    db.run(`update message_info set isread='1' where url =(SELECT date FROM courses where  id='${id}') and code =(select subcalendar_id FROM courses where  id='${id}')`);
                }
            }
            return result;
        }
    } catch (error) {
        console.log(`EditData error，${error.message}`, 'error');
        return false;
    }
}
async function EditStuData(id, student, value1) {
    try {
        let resdata = await new Promise((resolve, reject) => {
            db.run(`update courses set student='${student}', value1='${value1}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        if (resdata) {
            let couData = await GetDataByid(id);
            if (couData) {
                let students = JSON.parse(student).map(x => {
                    if (x.state == 0) {
                        x.state = 'Normal';
                    } else if (x.state == 1) {
                        x.state = 'Late';
                    } else {
                        x.state = 'Absent';
                    }
                    return x;
                });
                // 渲染 EJS 模板
                return await new Promise((resolve, reject) => {
                    ejs.renderFile(path.join(process.cwd(), 'src', 'views', 'report.ejs'), { students, value1 }, (err, html) => {
                        if (err) {
                            console.error('Error rendering EJS template:', err);
                            // res.status(500).send('Error rendering template');
                            resolve(false);
                        }

                        // 发送邮件
                        sendEmail(emailConfig.receive, `课程反馈表-${couData.title}`, '', html);
                        console.log(`课程反馈表-${couData.title} ` + html, 'info');

                        resolve(true);
                    });
                });
            } else {
                return false;
            }
        } else {
            return false;
        }
    } catch (error) {
        console.log(`EditStuData error，${error.message}`, 'error');
        return false;
    }
}
// 修改学生上课状态
async function SignStudentStatus(id, code, state) {
    try {
        let couData = await GetDataByid(id);
        if (couData) {
            let rs = await studentDetailService.update(id,{state, code});
           if(rs!=null){
            return true;
           }else{
            return false;
           }
        } else
            return false;
    } catch (error) {
        console.log(`SignStudentStatus error，${error.message}`, 'error');
        return false;
    }
}

async function SaveInfo(body){
    try {
        const { id, students, preview, homework, previewfiles, homeworkfiles, unit, week, day } = body;
        let result = await new Promise((resolve, reject) => {
            db.run(`update courses set preview='${preview}', homework='${homework}',value4='${previewfiles}', value5='${homeworkfiles}', unit='${unit}', week='${week}', day='${day}' where id ='${id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });

        students.forEach(async student => {
            let resdata = await new Promise((resolve, reject) => {
                db.run(`update student_detail set read=${student.read}, write=${student.write}, level=${student.level}, evaluate='${student.evaluate}', remarks='${student.remarks}', homework='${student.homework}' where course_id ='${id}' and id='${student.code}'`, (err, data) => {
                    if (err) {
                        resolve(false);
                    }
                    resolve(true);
                });
            });
        });
        return result;
    } catch (error) {
        console.log(`SaveInfo error，${error.message}`, 'error');
        return false;
    }
}

async function GetDataByid(id) {
    try {
        return await new Promise((resolve, reject) => {
            db.get(`select * from courses where id='${id}'`, (err, data) => {
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
async function Clear() {
    db.serialize(() => {
        db.run("Delete from courses where 1=1;");
    });
}

function sendMail(couData) {
    try {
        var fpath = path.join(__dirname, `../public/email_reminderTeacher.html`);

        let start_dt = formatDateTime(couData.start_dt, couData.tz);
        let end_dt = formatTime(couData.end_dt, couData.tz);
        let who = replaceNumberToNull(couData.who);
        
        const html = ejsHtml(fpath, {title: couData.title, teacher: couData.teacher, who, start_dt, end_dt, email: emailConfig.receive, web_url: emailConfig.web_url, tz: couData.tz});
        let msg = `Teacher ${couData.teacher}'s Late Absent Reminder`;

        sendEmail(emailConfig.receive, msg, '', html);

        console.log(`${msg}. Participants: ${who} Course title: ${couData.title} Course time: ${start_dt}-${end_dt} ${couData.tz}`, 'info');
    } catch (error) {
        console.log(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}
async function sendMailSignStatus(id, sname, state) {
    try {
        let couData = await GetDataByid(id);

        var fpath = path.join(__dirname, `../public/email_reminderStudent.html`);
        couData.who = replaceNumberToNull(couData.who);
        couData.start_dt = formatDateTime(couData.start_dt, couData.tz);
        couData.end_dt = formatTime(couData.end_dt, couData.tz);
        couData.email = emailConfig.receive;

        let studentName = replaceNumberToNull(sname).replace(" ", ""); 

        let msg = state == 1 ? `Student ${studentName}'s Late Reminder` : `Student ${studentName}'s Absent Reminder`;

        const html = ejsHtml(fpath, {state, studentName, couData, emailConfig, msg});
        sendEmail(emailConfig.receive, msg, '', html);
        // 给家长发短信
        // 如果迟到或者缺课给家长发短信提醒
        if(smsConfig.sendToParent){
            sendSmsToParent(studentName, couData.start_dt, state, couData.tz);
        }
        // 学生缺课，更新课程表，更新teamup
        if(state==9){
            // 更新课程表
            let upbody={};
            couData = await GetDataByid(id);
            if (couData){
                let sql='update courses set';
                 // 替换who中的中文英文逗号统一为英文逗号
                couData.who = couData.who.replace(/[,，]+/g, ',');
                couData.signed_up = couData.signed_up.replace(/[,，]+/g, ',');
                if(couData.who.trim().length > 0 && couData.who.indexOf(sname) > -1){
                    couData.who = couData.who.replace(sname, '').replace(',,', ',').replace(/,$/, '').replace(/^,/, '');
                    sql+=` who='${couData.who}',`;
                    upbody.who = couData.who;
                }
                if(couData.signed_up.trim().length > 0 && couData.signed_up.indexOf(sname) > -1){
                    couData.signed_up = couData.signed_up.replace(sname, '').replace(',,', ',').replace(/,$/, '').replace(/^,/, '');
                    sql+=` signed_up='${couData.signed_up}',`;
                    upbody.signed_up = sname;
                }

                sql = sql.substring(0, sql.length - 1);
               
                if(sql!='update courses set'){
                    sql+= ` where id ='${id}'`;
                    let result = await new Promise((resolve, reject) => {
                        db.run(`update courses set who='${couData.who}', signed_up='${couData.signed_up}' where id ='${id}'`, (err, data) => {
                            if (err) {
                                resolve(false);
                            }
                            resolve(true);
                        });
                    });
                    // 更新teamup
                    let upData = await updateAnEvent(id, upbody);
                    if(upData && upData.id != id){
                        let sql = `update courses set id = '${upData.id}'  where id ='${id}'`;
                        let result = await new Promise((resolve, reject) => {
                            db.run(sql, (err, data) => {
                                if (err) {
                                    resolve(false);
                                }
                                resolve(true);
                            });
                        });
                    }
                }
            }
        }

        console.log(`${msg}. Participants: ${couData.who} Course title: ${couData.title} Course time: ${couData.start_dt}-${couData.end_dt} ${couData.tz}`, 'info');
    } catch (error) {
        console.log(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}
/**
 * 学生迟到/缺课给家长发短信提醒
 * @param {*} studentName 
 * @param {*} time 
 * @param {*} state 
 */

async function sendSmsToParent(studentName, time, state, tz) {
    try {
        let usercode = studentName.match(/\d{8,10}/);
        if (usercode != null) {
            usercode = usercode[0];
        }else{
            usercode=null;
        }
        let userInfo = await queryStudentInfo(studentName, usercode);
        if (userInfo) {
            let user = userInfo.name;
            let type ='迟到';
            if(state==1){ 
              type = '迟到';
            }else if(state==9){
              type = '缺课';
            }else{
              type = '取消';
            }

            let phone = userInfo.parent_phone;
            
            SendSms_parent(phone, {user, time, type, tz});
          }
    } catch (error) {
        console.log(`Failed to send teacher's absence reminder email, ${error.message}`, 'error');
    }
}

/**
 * 校验课程信息，who/time变更后 需要提醒
 */
function CheckCourseInfo(oldInfo, newInfo) {
    let new_singneds = newInfo.signups.map(x=>x.name).join(',');
    if((oldInfo.who.trim().length == 0 && newInfo.who.trim().length > 0) || (oldInfo.signed_up.trim().length == 0 && new_singneds.trim().length > 0)){
        newInfo.is_new = '1';
        return true;
    }
    if(oldInfo.start_dt != newInfo.start_dt || oldInfo.end_dt != newInfo.end_dt || oldInfo.class_category != newInfo.class_category || oldInfo.class_level != newInfo.class_level){
        newInfo.is_new = '2';
        return true;
    }
    if(oldInfo.who.trim()!= newInfo.who.trim() || oldInfo.title!= newInfo.title){
        newInfo.is_new = '0';
        return true;
    }
    // if (oldInfo.who != newInfo.who || oldInfo.start_dt != newInfo.start_dt || oldInfo.end_dt != newInfo.end_dt || oldInfo.signed_up != new_singneds) {
    //     return true;
    // }
    return false;
}

async function CheckCourse(sdt,edt) {
    try {
        console.log('开始校验新课程！！！'+new Date());
        let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        let date_start = moment(dateNow).subtract(30, 'day').utc().format('YYYY-MM-DD');
        let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        // let data = await fetchTeamUpCalendar('2024-06-01', '2024-09-21');
        // let list = await GetDataAll(dateNow, date_end);
        //data = data.filter(x=>x.who && x.who.trim().length > 0);
        let data = await fetchTeamUpCalendar(sdt,edt);
        let list = await GetDataAll(date_start,date_end);
        let series_idData = [];
        if (data != null && data.length > 0) {
            for (let index = 0; index < data.length; index++) {
                let item = data[index];
                let id = item.id;
                let ischange = false;
                let oldInfo = list.find(x => x.id == id);
                let code = item.subcalendar_id;
                let name = teacherData[item.subcalendar_id] ? teacherData[item.subcalendar_id].name : 'no teacher name';

                item.class_level = item.custom.special_requirement ? item.custom.special_requirement.join(',') : '-';
                item.class_category = item.custom.class_category ? item.custom.class_category.join(',') : '-';

                // if(item.title=='ceshi1017' || item.title=='test123[declined]' || item.title=='new class'){
                //     debugger;
                // }
                if(oldInfo){
                    ischange = CheckCourseInfo(oldInfo, item);
                    if(ischange){
                        // 保存series_id的消息
                        if(item.series_id != null){
                            if(item.title=='test111'){
                                debugger;
                            }
                            if(series_idData.indexOf(item.series_id)<0){
                                series_idData.push(item.series_id);
                            }else{
                                item.is_new = '0';
                                ischange = false;
                            }
                        }
                        item.attend='0';
                        if(item.is_new=='0'){
                            item.is_new = oldInfo.value2 || '0';
                            item.attend = oldInfo.attend || '0';
                        }
                        if(oldInfo.value2=='1'){
                            ischange = false;
                        }
                        await UpdateCourseInfo(oldInfo, item);
                    }
                }else{
                    if(item.who.trim().length > 0 || item.signups.length>0){
                        if(item.series_id!=null){
                            // 查询两个月内是否有相同series_id的课程
                            let hasoldInfo = list.find(x => x.series_id == item.series_id);
                            if(hasoldInfo){
                                item.is_new = '0';
                                ischange = false;
                                await InsertData(item);
                                continue;
                            }
                            if(series_idData.indexOf(item.series_id)<0){
                                series_idData.push(item.series_id);
                            }else{
                                item.is_new = '0';
                                ischange = false;
                                await InsertData(item);
                                continue;
                            }
                        }
                      
                        ischange = true;
                        item.teacherName = name;
                        item.is_new = '1';
                        await InsertData(item);
                        
                    }
                }
                // 新课程提醒
                if(ischange){
                    let msg = `${item.is_new=='1'? 'New' : 'Modify'} Class On ${formatDateE(item.start_dt, item.tz)}`;
                    const create_date = moment().format('YYYY-MM-DD HH:mm:ss')
                    messageService.InsertData({code, name, msg, type: item.is_new, url: formatDate(item.start_dt, item.tz), create_date});
                }
            }
        }
        console.log('结束校验新课程！！！'+new Date());
        return true;
    } catch (error) {
        console.log(`CheckCourse error:${error.message}`, 'error');
        return false;
    }
}

async function UpdateCourseInfo(oldInfo, newInfo) {
    try {
        let new_singneds = newInfo.signups.map(x=>x.name).join(',');
        let result = await new Promise((resolve, reject) => {
            db.run(`update courses set who='${newInfo.who}',title='${newInfo.title}', signed_up='${new_singneds}', start_dt = '${newInfo.start_dt}', end_dt = '${newInfo.end_dt}', class_level='${newInfo.class_level}', class_category='${newInfo.class_category}', value2='${newInfo.is_new}', attend='${newInfo.attend}', value3='${newInfo.series_id}' where id ='${oldInfo.id}'`, (err, data) => {
                if (err) {
                    resolve(false);
                }
                resolve(true);
            });
        });
        if(result){
            if(oldInfo.who != newInfo.who || oldInfo.signed_up != new_singneds){
                let who_old = oldInfo.who.split(/[,，]+/).filter(x=>x).map(s => s.trim());
                let signups_old = oldInfo.signed_up.split(',').map(x=>x.name).filter(x=>x);
                let oldStudents = who_old.concat(signups_old);

                let who_new = newInfo.who.split(/[,，]+/).filter(x=>x).map(s => s.trim());
                let signups_new = newInfo.signups.map(x=>x.name).filter(x=>x);
                let newStudents = who_new.concat(signups_new);

                let removedStudents = oldStudents.filter(student => !newStudents.includes(student));
                console.log('Removed students:', removedStudents);
                removedStudents.forEach(student => {
                    let usercode = student.match(/\d{8,10}/);
                    let ucode='';
                    if (usercode != null) {
                        ucode=usercode[0];
                    }
                    db.run(`delete from student_detail where course_id = '${oldInfo.id}' and (name='${student}' or code='${ucode}')`);
                    // await new Promise((resolve, reject) => {
                    //     db.run(`delete student_detail where course_id = '${oldInfo.id}' and (name='${student}' or code='${ucode}')`, function(err) {
                    //         if (err) {
                    //             return resolve(null);
                    //         }
                    //         resolve(this.lastID);
                    //     });
                    // });
                });
                let addedStudents = newStudents.filter(student => !oldStudents.includes(student));
                console.log('Added students:', addedStudents);
               
                if(addedStudents.length>0){
                    await StuInsertData(newInfo.id, newInfo.subcalendar_id, addedStudents, '1');
                }else{
                    console.log('课程没有学生！！！'+newInfo.id);
                }
            }
        }
    } catch (error) {
        console.log(`UpdateCourseInfo error:${error.message}`, 'error');
    }
}
/**
 * 初始化课程
 */
async function InitCourse() {
    try {
        db.run("DELETE FROM courses where 1=1;");
        console.log('已清空courses');
        db.run("DELETE FROM student_detail where 1=1;");
        console.log('已清空student_detail');


        let dateNow = moment().seconds(0).milliseconds(0).utc().format('YYYY-MM-DD');
        let date_end = moment(dateNow).add(30, 'day').utc().format('YYYY-MM-DD');
        let date_start = '2024-06-01';
        // let date_end ='2024-10-30';
        // let date_start ='2024-10-01';
        let data = await fetchTeamUpCalendar(date_start, date_end);
        // let data = await fetchTeamUpCalendar('2024-10-04', '2024-10-04');
        data = data.filter(x => (x.who && x.who.length > 0) || x.signup_count>0);
        if (data != null && data.length > 0) {
            //Clear();

            const stmt = db.prepare("INSERT INTO courses (id, subcalendar_id, title, teacher, who, start_dt, end_dt, date, tz, class_level, class_size, signed_up, is_trial_class,class_category, is_full, attend, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");

            const stmt_detail = db.prepare("INSERT INTO student_detail (course_id, subcalendar_id, name, code, state, parent_name, parent_code, read, write, level, evaluate, remarks, homework, value2) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
            let class_level = '';
            let class_size = '';
            let is_trial_class = '';
            let class_category = '';
            let is_full = '0';
            let signed_up ='';

            data.forEach(info => {
                let teacherInfo = teacherData[info.subcalendar_id];
                let teacherName = '';
                if (teacherInfo == null) {
                    console.log('未找到老师信息' + info.subcalendar_id);
                    console.log(`InitCourse: Teacher information not found.[${info.subcalendar_id}]`, 'error');
                } else {
                    teacherName = teacherInfo.name;
                }

                is_full = info.signup_count == info.signup_limit ? '1' : '0';
                class_level = info.custom.special_requirement ? info.custom.special_requirement.join(',') : '-';
                class_size = info.custom.class_size ? info.custom.class_size.join(',') : '-';
                is_trial_class = info.custom.is_trial_class ? info.custom.is_trial_class.join(',') : '-';
                class_category = info.custom.class_category ? info.custom.class_category.join(',') : '-';
                signed_up = info.signups.map(x=>x.name).join(',');

                stmt.run(info.id, info.subcalendar_id, info.title, teacherName, info.who, info.start_dt, info.end_dt, info.start_dt.substr(0, 10), info.tz, class_level, class_size, signed_up, is_trial_class, class_category, is_full, '1', '1');

                info.who.split(/[,，]+/).forEach(student => {
                    if(student.trim().length >0){
                        let usercode = student.trim().match(/\d{8,10}/);
                        let ucode='';
                        if (usercode != null) {
                            ucode=usercode[0];
                        }
                        stmt_detail.run(info.id, info.subcalendar_id, student, ucode, '0', '', '', 0, 0, 0, '', '', '','0');
                    }
                })
                signed_up.split(',').forEach(student => {
                    if(student.trim().length >0){
                        let usercode = student.trim().match(/\d{8,10}/);
                        let ucode='';
                        if (usercode != null) {
                            ucode=usercode[0];
                        }
                        stmt_detail.run(info.id, info.subcalendar_id, student, ucode, '0', '', '', 0, 0, 0, '', '', '','1');
                    }
                })
            })
            stmt_detail.finalize();
            stmt.finalize();
            return {code:0, msg: `${date_start}-${date_end} init complete`};
        } else {
            return {code:0, msg: `${date_start}-${date_end} not found TeamUp calendar data`};
        }
    } catch (error) {
        return {code:1, msg: `${date_start}-${date_end} InitCourse error:${error.message}`};
    }
}

module.exports = { InsertData, GetData, EditData, EditStuData, SignStudentStatus, sendMailSignStatus, CheckCourse, InitCourse, GetDataByid, SaveInfo, sendSmsToParent };
