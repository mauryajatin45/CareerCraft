const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

router.get("/skill-assessment",(req,res)=>{
    res.render("skillAssessment.ejs");
})

module.exports = router;
