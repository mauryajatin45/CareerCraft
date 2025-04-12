const express = require('express');
const router = express.Router();
const axios = require('axios');
const { marked } = require('marked');

// GET: Render the form
router.get('/interview-prep', (req, res) => {
    console.log("✅ Route HIT: /interview-prep");

    if (!req.user) return res.redirect('/login');

    res.render('interview-prep.ejs', {
        user: req.user,
        apiResult: null
    });
});

// POST: Fetch and parse interview guide
router.post('/interview-prep', async (req, res) => {
    const { role, company } = req.body;
    console.log("📤 Received input:", { role, company });

    try {
        const apiUrl = 'https://magicloops.dev/api/loop/73d6a2f5-7322-4ed8-81ae-593923314fc4/run';

        const response = await axios({
            method: 'get',
            url: apiUrl,
            headers: { 'Content-Type': 'application/json' },
            data: { role, company }
        });

        console.log("✅ API response received.");

        // Normalize content using marked
        const guide = response.data?.interviewGuide || "No guide found.";
        const htmlGuide = marked.parse(guide);

        res.render('interview-prep.ejs', {
            user: req.user,
            apiResult: {
                content: htmlGuide
            }
        });
    } catch (error) {
        console.error("❌ API error:", error.message);
        res.render('interview-prep.ejs', {
            user: req.user,
            apiResult: { error: "Failed to fetch interview preparation data." }
        });
    }
});

module.exports = { router };
