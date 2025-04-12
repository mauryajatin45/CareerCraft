const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// Resume Builder Routes
router.get('/builder', resumeController.showBuilder);
router.post('/generate', resumeController.generateResume);
router.post('/generate-pdf', resumeController.generatePDF);
router.post('/ai-suggestions', resumeController.getAISuggestions);

module.exports = router;