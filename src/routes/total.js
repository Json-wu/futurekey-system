const express = require('express');
const router = express.Router();
const _ = require('underscore');
const path = require('path');
const { GetTotalData } = require('../service/totalService');
const { type } = require('os');

router.get('', (req, res) => {
    res.sendFile(path.join(__dirname, `../public/classTotal.html`));
});

router.get('/getdata', async (req, res) => {
    const { sDate, eDate } = req.query;
    const data = await GetTotalData(sDate, eDate);
    let resData = [];
    let teachers = _.groupBy(_.filter(data, (item)=>{return item.type=='teacher'}), 'teacher');
    let parents = _.groupBy(_.filter(data, (item)=>{return item.type=='parent'}), 'parent');
    for (const key in teachers) {
        if (Object.prototype.hasOwnProperty.call(teachers, key)) {
            const teacher = teachers[key];
            let duration = _.reduce(teacher, (total, item) => total + Number(item.hours), 0);
            resData.push({ name: key, duration, type: 'teacher', items: teacher });
        }
    }
    for (const key in parents) {
        if (Object.prototype.hasOwnProperty.call(parents, key)) {
            const parent = parents[key];
            let duration = _.reduce(parent, (total, item) => total + Number(item.hours), 0);
            resData.push({ name: key, duration, type: 'parent', items: parent });
        }
    }
   
    res.json({ code: 0, msg: 'ok', data: resData });
});




module.exports = router;