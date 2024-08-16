const moment = require('moment');
const { fetchTeamUpCalendar } = require('../service/teamupService');
const config = require('../config/config');
const { getCustomerDetail_check } = require('../service/xbbService');

const calendarKeyOrId = process.env.TEAMUP_KEY;
const apiKey = process.env.TEAMUP_APIKEY;

/**
 * 获取家长信息不完整的学生名单
 */
async function GetStudentNoInfo(date){
    try {
        let noPhoneList = new Set();
        let sameName = new Set();
        let sDate = moment(date).format('YYYY-MM-DD');
        let eDate = moment(date).add(30, 'days').format('YYYY-MM-DD');
        let data = await fetchTeamUpCalendar(calendarKeyOrId, apiKey, sDate, eDate);
        if (data != null && data.length > 0) {
            data = data.filter(item=>{
                return item.who && item.who.length>0;
            });
            for (let i = 0; i < data.length; i++) {
                const who = data[i].who;
                console.log(i);
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

module.exports = { GetStudentNoInfo };