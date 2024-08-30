const express = require('express');
const router = express.Router();
const planService = require('../service/planService');
const path = require('path');

// 课程预告表
router.get('', (req, res) => {
    res.sendFile(path.join(__dirname, `../public/classPlan.html`));
});

router.post('',async (req, res) => {
    try {
        const rid = await planService.InsertData(req);
        if (rid!=null) {
            res.status(200).json({ code: 0, msg: 'ok', data: rid });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to add.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to add.' });
    }
});

router.put('/:id',async (req, res) => {
    try {
        const result = await planService.EditData(req);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to edit.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to edit.' });
    }
});



// 获取所有课程
router.get('/query', async (req, res) => {
    try {
        const result = await planService.GetData();
        if (result != null) {
            res.status(200).json({ code: 0, msg: 'ok', data: result });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to get.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});

// 删除课程
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await planService.DeleteById(Number(id));
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok', data: result });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to delete.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to delete.' });
    }
});


module.exports = router;
