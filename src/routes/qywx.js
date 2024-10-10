const express = require('express');
const router = express.Router();
const qywxService = require('../service/qywxService');

// 根据用户手机号获取用户id
router.post('/GetIdByPhone',async (req, res) => {
    try {
        const data = await qywxService.GetIdByPhone(req.body.phone);
        res.status(200).json({ code: 0, msg: 'ok', data });
    } catch (error) {
        res.status(500).json({ code: 1, msg: 'Failed to get.' });
    }
});


module.exports = router;
