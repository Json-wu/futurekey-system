const express = require('express');
const router = express.Router();
const courseService = require('../service/courseService');

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
    const { id, student } = req.body;
    try {
        const result = await courseService.EditStuData(id, student);
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
    const { id, studentName, state } = req.body;
    try {
        const result = await courseService.SignStudentStatus(id, studentName, state);
        if (result) {
            if(setSendMail != null){
                clearTimeout(setSendMail);
            }
            if(state == 9 || state == 1){
                setSendMail = setTimeout(() => {
                    console.log('5 seconds have passed!');
                    // 可以在这里执行其他操作，例如发送响应或处理其他任务
    
                    courseService.sendMailSignStatus(id, studentName, state);
                    clearTimeout(setSendMail);
                }, 5000);
            }
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to EditData.' });
    }
});



module.exports = router;
