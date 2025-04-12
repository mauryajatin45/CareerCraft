const express = require('express');
const router = express.Router();

// Define your routes here
router.get('/job-market', (req, res) => {
  res.send('Job Market Home');
});

module.exports = { router };
