const moment = require('moment');
const crypto = require('crypto');

function getDateNow() {
    return moment().format('YYYY-MM-DD');
}
function getDateTimeNow() {
    return moment().format('YYYY-MM-DD HH:mm');
}

function getDatetimeAddMin(min) {
    return moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm');
}

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