// teamup.js
const axios = require('axios');
const config = require('../config/config');
const { logMessage } = require('../libs/logger');
const { sign } = require('../libs/common');
const { sendEmail } = require('./emailService');


const emailConfig = config.email;
const token = process.env.XBB_TOKEN;
const corpid = process.env.XBB_CORPID;
const userid = process.env.XBB_USERID;

async function getCustomerDetail(userName, type){
  try {
    let resData={};
    let names=[];
    let userData = await getStudentData(userName, type);
    if(userData && userData.code==1 && userData.result.list.length>0){
      for (let index = 0; index < userData.result.list.length; index++) {
        const element = userData.result.list[index];
        let dataId = element.dataId;
        let studentDetail = await getStudentDetail(dataId);
        let userinfo = await getCustomerInfo(studentDetail.result.data.text_1);
        if(studentDetail.result.data.text_17 && studentDetail.result.data.text_17.text=='在读'){
          names.push(userName);
          resData = {
            monther: userinfo.result.data,
            child: studentDetail.result.data
          };
        }
      }
      if(names.length>1){
        // 学生重名，邮件提醒
        sendEmail(emailConfig.receive, '学生姓名重名提醒', '', `学生姓名：${userName}`);
      }else{
        return resData;
      }
    }
    // if(userData && userData.code==1 && userData.result.list.length>0){
    //   if(userData.result.list.length==1){
    //     let dataId = userData.result.list[0].dataId;
    //     let studentDetail = await getStudentDetail(dataId);
    //     let userinfo = await getCustomerInfo(studentDetail.result.data.text_1);
    //     if(userinfo.code==1){
    //       return {
    //         monther: userinfo.result.data,
    //         child: studentDetail.result.data
    //       }
    //     }
    //   }else{
    //     // 学生重名，邮件提醒
    //     sendEmail(emailConfig.receive, '学生姓名重名提醒', '', `学生姓名：${userName}`);
    //   }
    // }
    return null;
  } catch (error) {
    logMessage(`Error getCustomerDetail: ${error.message}`,'error');
    console.log(`Error getCustomerDetail: ${error.message}`);
    return null;
  }
}
async function getCustomerDetail_check(userName){
  try {
    let resData={};
    let names=[];
    let userData = await getStudentData(userName);
    if(userData && userData.code==1 && userData.result.list.length>0){
      for (let index = 0; index < userData.result.list.length; index++) {
        const element = userData.result.list[index];
        let dataId = element.dataId;
        let studentDetail = await getStudentDetail(dataId);
        let userinfo = await getCustomerInfo(studentDetail.result.data.text_1);
        if(studentDetail.result.data.text_17 && studentDetail.result.data.text_17.text=='在读'){
          names.push(userName);
          resData = {
            code: 0,
            monther: userinfo.result.data,
            child: studentDetail.result.data
          };
        }
      }
      if(names.length>1){
        return {
          code: 1,
          name: userName
        }
      }else{
        return resData;
      }
      // if(userData.result.list.length >0){
      //   let dataId = userData.result.list[0].dataId;
      //   let studentDetail = await getStudentDetail(dataId);
      //   let userinfo = await getCustomerInfo(studentDetail.result.data.text_1);
      //   if(userinfo.code==1){
      //     return {
      //       code: 0,
      //       monther: userinfo.result.data,
      //       child: studentDetail.result.data
      //     }
      //   }
      // }else{
        
      //   return {
      //     code: 1,
      //     name: userName
      //   }
      // }
    }
    return null;
  } catch (error) {
    logMessage(`Error getCustomerDetail: ${error.message}`,'error');
    console.log(`Error getCustomerDetail: ${error.message}`);
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
      logMessage(`Error fetching getCustomerInfo: ${response.statusText}`,'error');
      // throw new Error(`Error fetching customerDetail: ${response.statusText}`);
    }
    return response.data;
  } catch (error) {
    logMessage(`Error getCustomerInfo: ${error.message}`,'error');
    console.log(`Error getCustomerInfo: ${error.message}`);
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
async function getStudentData(userName, type) {
  try {
    let body = {
      "conditions": [
      {
        "attr": "text_2",
        "symbol": "equal",
        "value": [
          userName
        ]
      }
    ],
      "formId": '9474161',
      "corpid": corpid,
      "userId": userid
    };
    if(type==1){
      body = {
        "conditions": [
        {
          "attr": "text_1",
          "symbol": "equal",
          "value": [
            userName
          ]
        }
      ],
        "formId": '9474161',
        "corpid": corpid,
        "userId": userid
      };
    }
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

module.exports = { getCustomerDetail, getCustomerDetail_check };
