const express = require('express');
const router = express.Router();
const leaveService = require('../service/leaveService');
const path = require('path');

// 请假
router.get('',async (req, res) => {
    try {
        const items = await leaveService.GetDataAll();
        res.status(200).json({ code: 0, msg: 'ok', data: items });
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});

module.exports = router;
