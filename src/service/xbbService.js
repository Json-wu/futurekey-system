// teamup.js
const axios = require('axios');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const { sign } = require('../libs/common');


const xbbConfig = config.xbb;
const token = process.env.XBB_TOKEN;
const corpid = process.env.XBB_CORPID;
const userid = process.env.XBB_USERID;

async function getCustomerDetail(userName){
  try {
    let userData = await getStudentData(userName);
    if(userData && userData.code==1 && userData.result.list.length>0){
      let dataId = userData.result.list[0].dataId;
      let studentDetail = await getStudentDetail(dataId);
      let userinfo = await getCustomerInfo(studentDetail.result.data.text_1);
      if(userinfo.code==1){
        return {
          monther: userinfo.result.data,
          child: studentDetail.result.data
        }
      }
      return null;
    }
  } catch (error) {
    logMessage(`Error getStudentData: ${error.message}`,'error');
    console.log(`Error getStudentData: ${error.message}`);
    return null;
  }
}

async function getCustomerInfo(dataId) {
  try {
    const body = {
      "dataId": dataId,
      "corpid": corpid,
      "userId": userid
    };
    const headers = {
      headers: {
        'sign': sign(JSON.stringify(body), token)
      }
    };
    const response = await axios.post(`https://appapi.xbongbong.com/pro/v2/api/customer/detail`,body, headers);
  
    if (!response.status==200) {
      logMessage(`Error fetching customerDetail: ${response.statusText}`,'error');
      // throw new Error(`Error fetching customerDetail: ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    logMessage(`Error getStudentData: ${error.message}`,'error');
    console.log(`Error getStudentData: ${error.message}`);
    return null;
  }
}

// 获取表单
async function getPassList() {
  const body = {
    "saasMark": 2,
    "corpid": corpid,
    "userId": userid
  };
  let token = JSON.stringify(body).replace(/\s*/g,"")+token;
  token = sign(token);
  const headers = {
    headers: {
      'sign': token
    }
  };
  const response = await axios.post(`https://appapi.xbongbong.com/pro/v2/api/form/list`,body, headers);

  if (!response.status==200) {
    logMessage(`Error fetching customerDetail: ${response.statusText}`,'error');
    throw new Error(`Error fetching customerDetail: ${response.statusText}`);
  }
  return response.data;
}
// 获取学生数据列表
async function getStudentData(userName) {
  try {
    const body = {
      "conditions": [
      {
        "attr": "text_2",
        "symbol": "equal",
        "value": [
          userName
        ]
      },
      // {
      //   "attr": "serialNo",
      //   "symbol": "equal",
      //   "value": [
      //     "202408441"
      //   ]
      // }
    ],
      "formId": '9474161',
      "corpid": corpid,
      "userId": userid
    };
    const headers = {
      headers: {
        'sign': sign(JSON.stringify(body), token)
      }
    };
    const response = await axios.post(`https://appapi.xbongbong.com/pro/v2/api/paas/list`,body, headers);
  
    if (!response.status==200) {
      logMessage(`Error fetching customerDetail: ${response.statusText}`,'error');
      // throw new Error(`Error fetching customerDetail: ${response.statusText}`);
    }
    // console.log('getStudentData:'+JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    logMessage(`Error getStudentData: ${error.message}`,'error');
    console.log(`Error getStudentData: ${error.message}`);
    return null;
  }
}
// 获取学生详情
async function getStudentDetail(dataId) {
  try {
    const body = {
      "dataId": dataId,
      "corpid": corpid,
      "userId": userid
    };
    const headers = {
      headers: {
        'sign': sign(JSON.stringify(body), token)
      }
    };
    const response = await axios.post(`https://appapi.xbongbong.com/pro/v2/api/paas/detail`,body, headers);
  
    if (!response.status==200) {
      logMessage(`Error fetching customerDetail: ${response.statusText}`,'error');
      // throw new Error(`Error fetching customerDetail: ${response.statusText}`);
    }
    // console.log('getStudentDetail:'+JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    logMessage(`Error getStudentData: ${error.message}`,'error');
    console.log(`Error getStudentData: ${error.message}`);
    return null;
  }
}
// getPassList();
// getPassList2();

//getCustomerDetail('anne_808');

module.exports = { getCustomerDetail };
