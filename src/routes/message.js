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


module.exports = router;
