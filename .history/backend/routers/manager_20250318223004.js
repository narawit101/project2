const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/pending',async(req,res)=>{
    try {
        const result = await pool.query("SELECT*FROM field WHERE status='รอตรวจสอบ'");
        res.json(result.rows);
    }
    catch(error){
        res.status(500).json({error:'Database error fetching pending fields'});
    }
});
module.exports = router;