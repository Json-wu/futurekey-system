const express = require('express');
const router = express.Router();
const messageService = require('../service/messageService');
const path = require('path');

// 消息
router.get('',async (req, res) => {
    try {
        const items = await messageService.GetMsg(req.query.code);
        res.status(200).json({ code: 0, msg: 'ok', data: items });
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});

router.get('/read/:id', async (req, res) => {
    try {
        const result = await messageService.update(req.params.id);
        if (result) {
            res.status(200).json({ code: 0, msg: 'ok' });
        } else {
            res.status(500).json({ code: 1, msg: 'Failed to read.' });
        }
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to read.' });
    }
});


module.exports = router;
