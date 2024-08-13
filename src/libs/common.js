const moment = require('moment');
const crypto = require('crypto');

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
module.exports = { getDateNow, getDateTimeNow, getDatetimeAddMin, sign };