const { default: axios } = require("axios");

// 调用企业微信根据用户名获取用户code信息接口
async function GetAccessToken() {
    const result = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wwcd39031e5010a6f3&corpsecret=l59HysOjNS0aR_iiTCw8SvXbT0Xlb5y93Wra-vppmkE`);
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

module.exports = { GetQywxUserList };