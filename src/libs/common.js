const moment = require('moment');
const crypto = require('crypto');
const teacher = require('../config/teacher.json');
const fs = require('fs');
const ejs = require('ejs');
const timezoneSet = 'Asia/Shanghai';


/*
* 获取当前日期
*/
function getDateNow() {
    return moment().format('YYYY-MM-DD');
}
/*
* 获取当前时间
*/
function getDateTimeNow() {
    return moment().format('YYYY-MM-DD HH:mm');
}
/*
* 获取当前时间加30分钟
*/
function getDatetimeAddMin(min) {
    return moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm');
}
/*
* 签名
* @param {string} bodystr 需要签名的字符串
* @param {string} token 签名密钥
*/
function sign(bodystr, token) {
    // 需要签名的消息
    //const message = 'Hello, world!';
    let message = (bodystr + token);//.replace(/\s*/g,"")
    // 创建SHA256签名
    const hash = crypto.createHash('sha256');
    hash.update(message);
    const signature = hash.digest('hex');

    // console.log(`Message: ${message}`);
    // console.log(`SHA256 Signature: ${signature}`);

    return signature;
}

function getSubEventId(teacher_name) {
    let sub_eventid='';
    for (const key in teacher) {
        if (Object.prototype.hasOwnProperty.call(teacher, key)) {
            const element = teacher[key];
            if (element.name === teacher_name) {
                sub_eventid = key;
            }
        }
    }
    return sub_eventid;
}

function replaceNumberToNull(str){
    return str? str.replace(/\d+/g,''):str;
}

function formatDate(date, timezoneSet) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatDateTime(date, timezoneSet) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
function formatTime(date, timezoneSet) {
    if (date == undefined) {
        date = new Date();
    } else {
        date = new Date(date);
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneSet != timeZone) {
        date = new Date(date.toLocaleString('en-US', { timeZone: timezoneSet }));
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function ejsHtml(fpath, data){
    var html_source = fs.readFileSync(fpath, 'utf-8');
    return ejs.render(html_source, data);
}

module.exports = { getDateNow, getDateTimeNow, getDatetimeAddMin, sign, getSubEventId,replaceNumberToNull, formatDate, formatDateTime, formatTime, ejsHtml };