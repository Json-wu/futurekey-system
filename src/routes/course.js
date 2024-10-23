const express = require('express');
const router = express.Router();
const moment = require('moment');
const courseService = require('../service/courseService');
const studentDetailService = require('../service/studentDetailService');
const leaveService = require('../service/leaveService');

// teacher's page
router.get('', (req, res) => {
    res.sendFile(path.join(__dirname, `../public/classPlan.html`));
});
router.post('/InsertData', async (req, res) => {
    const { id, title, teacher, student, attend, time } = req.body;
    try {
        const result = await courseService.InsertData(id, title, teacher, student, attend, time);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to sumit.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to sumit.' });
    }
});

router.post('/GetData', async (req, res) => {
    const { date, subid } = req.body;
    try {
        const result = await courseService.GetData(date,subid);
        if (result != null) {
            for (let index = 0; index < result.length; index++) {
                let item = result[index];
                item.student = await studentDetailService.GetDataAll(item.id);
                let leave = await leaveService.getLeaveByid(item.id, item.start_dt, item.end_dt);
                item.isleave = leave ==null ? false : true;
            }
            res.status(200).json({ code: 0, msg: 'ok', data: result });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to get.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});
router.get('/QueryById', async (req, res) => {
    const cid = req.query.id;
    try {
        const result = await courseService.GetDataByid(cid);
        if (result != null) {
            result.student = await studentDetailService.GetDataAll(result.id);
            res.status(200).json({ code: 0, msg: 'ok', data: result });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to get.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});
router.post('/EditData', async (req, res) => {
    const { id, attend } = req.body;
    try {
        const result = await courseService.EditData(id, attend);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
    }
});
router.post('/EditStuData', async (req, res) => {
    const { id, student, value1 } = req.body;
    try {
        const result = await courseService.EditStuData(id, student, value1);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
    }
});
var setSendMail = null;

router.post('/SignStudentStatus', async (req, res) => {
    const { id, code, name, state } = req.body;
    try {
        const result = await courseService.SignStudentStatus(id, code, state);
        if (result) {
            // if(setSendMail != null){
            //     clearTimeout(setSendMail);
            // }
            if(state == 9 || state == 1){
                // setSendMail = setTimeout(() => {
                //     console.log('5 seconds have passed!');
                    // 可以在这里执行其他操作，例如发送响应或处理其他任务
                   await courseService.sendMailSignStatus(id, name, state);
                //     clearTimeout(setSendMail);
                // }, 5000);
            }
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
    }
});

router.get('/init',  async (req, res)=>{
    let result = await courseService.InitCourse();
    res.status(200).json(result);
})

router.post('/SaveInfo', async (req, res) => {
    try {
        const result = await courseService.SaveInfo(req.body);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to sumit.' });
        }
    } catch (error) {
        console.log(`Failed to sumit. ${error.message}`);
        res.status(500).json({ code: 1, msg: 'Failed to sumit.' });
    }
});

router.get('/refresh', async (req, res) => {
    try {
        console.log(`任务task_newClass执行:开始校验新课程！！！`, new Date());
        let startDate = moment().subtract(1, 'week').format('YYYY-MM-DD');
        let endDate = moment().add(4, 'weeks').format('YYYY-MM-DD');
        let isok = await courseService.CheckCourse(startDate, endDate);
        if(isok){
            console.log(`任务task_newClass执行:校验新课程成功！！！`, new Date());
             // 返回刷新成功
            res.send('refresh success');
        }else{
            console.log(`任务task_newClass执行:校验新课程失败！！！`, new Date());
            // 返回刷新失败
            res.send('refresh fail');
        }
    } catch (error) {
        res.send(error.message);
    }
})



module.exports = router;
