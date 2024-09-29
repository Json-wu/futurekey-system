const express = require('express');
const router = express.Router();
const _ = require('underscore');
const path = require('path');
const { GetTotalData, GetTotalDataBySubid } = require('../service/totalService');
const moment = require('moment');

router.get('', (req, res) => {
    res.sendFile(path.join(__dirname, `../public/classTotal.html`));
});

router.get('/getdata', async (req, res) => {
    const { sDate, eDate } = req.query;
    const data = await GetTotalData(sDate, eDate);
    let resData = [];
    let teachers = _.groupBy(_.filter(data, (item)=>{return item.type=='teacher'}), 'teacher');
    let parents = _.groupBy(_.filter(data, (item)=>{return item.type=='parent'}), 'student');
    for (const key in teachers) {
        if (Object.prototype.hasOwnProperty.call(teachers, key)) {
            const teacher = teachers[key];
            let duration = _.reduce(teacher, (total, item) => total + Number(item.hours), 0);
            resData.push({ name: key, duration: Number(duration.toFixed(2)), type: 'teacher', items: teacher });
        }
    }
    for (const key in parents) {
        if (Object.prototype.hasOwnProperty.call(parents, key)) {
            const parent = parents[key];
            let duration = _.reduce(parent, (total, item) => total + Number(item.hours), 0);
            resData.push({ name: key, duration: Number(duration.toFixed(2)), type: 'parent', items: parent });
        }
    }
    // 计算续费率
    // 获取计算月份
    let sMonth = new Date(sDate).getMonth();
    let firstDay = moment(sDate).startOf('month').format('YYYY-MM-DD');
    let lastDay = moment(sDate).endOf('month').format('YYYY-MM-DD');
    let prevMonthFirstDay = moment(firstDay).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
    let prevMonthLastDay = moment(firstDay).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

    // 获取上个月学生数据
    const data_lastM = await GetTotalData(prevMonthFirstDay, prevMonthLastDay);
    let student1 = _.groupBy(_.filter(data_lastM, (item)=>{return item.type=='parent'}), 'student');
    let student1Arr = [];
    for (const key in student1) {
        if (Object.prototype.hasOwnProperty.call(student1, key)) {
            student1Arr.push(key);
        }
    }
    // 获取本月学生数据
    const data_nowM = await GetTotalData(firstDay, lastDay);
    let student2 = _.groupBy(_.filter(data_nowM, (item)=>{return item.type=='parent'}), 'student');
    let student2Arr = [];
    for (const key in student2) {
        if (Object.prototype.hasOwnProperty.call(student2, key)) {
            student2Arr.push(key);
        }
    }

    // 找出student2Arr和student1Arr的交集
    let intersection = _.intersection(student2Arr, student1Arr);
    resData.push({ name: 'per', msg: sMonth + '月份，学生续费率为：'+(intersection.length * 100/student1Arr.length).toFixed(1)+'%', type: 'per', students: intersection });
   
    res.json({ code: 0, msg: 'ok', data: resData });
});

router.post('/getdatabysubid', async (req, res) => {
    const { subid, sDate, eDate } = req.body;
    const data = await GetTotalDataBySubid(subid, sDate, eDate);
    let resData = [];
    let teachers = _.groupBy(_.filter(data, (item)=>{return item.type=='teacher'}), 'teacher');
    //let parents = _.groupBy(_.filter(data, (item)=>{return item.type=='parent'}), 'student');
    for (const key in teachers) {
        if (Object.prototype.hasOwnProperty.call(teachers, key)) {
            const teacher = teachers[key];
            let duration = _.reduce(teacher, (total, item) => total + Number(item.hours), 0);
            resData.push({ name: key, duration: Number(duration.toFixed(2)), type: 'teacher', items: teacher });
        }
    }
    // for (const key in parents) {
    //     if (Object.prototype.hasOwnProperty.call(parents, key)) {
    //         const parent = parents[key];
    //         let duration = _.reduce(parent, (total, item) => total + Number(item.hours), 0);
    //         resData.push({ name: key, duration: Number(duration.toFixed(2)), type: 'parent', items: parent });
    //     }
    // }
    // // 计算续费率
    // // 获取计算月份
    // let sMonth = new Date(sDate).getMonth();
    // let firstDay = moment(sDate).startOf('month').format('YYYY-MM-DD');
    // let lastDay = moment(sDate).endOf('month').format('YYYY-MM-DD');
    // let prevMonthFirstDay = moment(firstDay).subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
    // let prevMonthLastDay = moment(firstDay).subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

    // // 获取上个月学生数据
    // const data_lastM = await GetTotalData(prevMonthFirstDay, prevMonthLastDay);
    // let student1 = _.groupBy(_.filter(data_lastM, (item)=>{return item.type=='parent'}), 'student');
    // let student1Arr = [];
    // for (const key in student1) {
    //     if (Object.prototype.hasOwnProperty.call(student1, key)) {
    //         student1Arr.push(key);
    //     }
    // }
    // // 获取本月学生数据
    // const data_nowM = await GetTotalData(firstDay, lastDay);
    // let student2 = _.groupBy(_.filter(data_nowM, (item)=>{return item.type=='parent'}), 'student');
    // let student2Arr = [];
    // for (const key in student2) {
    //     if (Object.prototype.hasOwnProperty.call(student2, key)) {
    //         student2Arr.push(key);
    //     }
    // }

    // // 找出student2Arr和student1Arr的交集
    // let intersection = _.intersection(student2Arr, student1Arr);
    // resData.push({ name: 'per', msg: sMonth + '月份，学生续费率为：'+(intersection.length * 100/student1Arr.length).toFixed(1)+'%', type: 'per', students: intersection });
   
    res.json({ code: 0, msg: 'ok', data: resData });
});


module.exports = router;