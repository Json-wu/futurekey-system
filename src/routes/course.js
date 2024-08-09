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
    const { date } = req.body;
    try {
        const result = await courseService.GetData(date);
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

module.exports = router;
