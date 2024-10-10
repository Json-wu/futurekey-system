const { default: axios } = require("axios");

const corpsecret = process.env.QYWX_CORPSECRET;
const corpid = process.env.QYWX_CORPID;
// 调用企业微信根据用户名获取用户code信息接口
async function GetAccessToken() {
    const result = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`);
    return result.data;
}
async function GetQywxUserList() {
    try {
        let acData = await GetAccessToken();
        let access_token = acData.access_token;
        const result = await axios.post(`https://qyapi.weixin.qq.com/cgi-bin/user/list_id?access_token=${access_token}`, {});
        return result.data;
    } catch (error) {
        return error.message;
    }
}

async function GetIdByPhone(phone) {
    try {
        let acData = await GetAccessToken();
        let access_token = acData.access_token;
        const result = await axios.post(
            `https://qyapi.weixin.qq.com/cgi-bin/user/getuserid?access_token=${access_token}`,
            { mobile: phone },
            { headers: { 
                'Host': 'qyapi.weixin.qq.com'
            } }
        );
        return result.data;
    } catch (error) {
        return error.message;
    }
}

module.exports = { GetQywxUserList, GetIdByPhone };