const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const isAuthenticated = require('../middleware/Authenticated');

// Resume Builder Routes
router.get('/builder', isAuthenticated, resumeController.showBuilder);
router.post('/generate', isAuthenticated, resumeController.generateResume);
router.post('/generate-pdf', isAuthenticated, resumeController.generatePDF);
router.post('/ai-suggestions', isAuthenticated, resumeController.getAISuggestions);

module.exports = router;