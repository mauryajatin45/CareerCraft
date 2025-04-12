const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Route to display career suggestions
router.get('/career-suggestions', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in to view career suggestions' });
    }
  
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
  
    // Use the user data to generate career suggestions
    const { programmingLanguages, toolsSoftware, softSkills } = user;
  
    // Example logic to suggest careers based on the user's skills
    const suggestions = [];
  
    if (programmingLanguages.includes('JavaScript')) {
      suggestions.push('Frontend Developer');
    }
    if (programmingLanguages.includes('Python')) {
      suggestions.push('Data Scientist');
    }
    if (toolsSoftware.includes('AWS')) {
      suggestions.push('Cloud Engineer');
    }
    if (softSkills.includes('Leadership')) {
      suggestions.push('Project Manager');
    }
  
    res.render('career-suggestion', {
      suggestions: suggestions.length > 0 ? suggestions : ['No career suggestions available based on current skills.'],
    });
  });
  

module.exports = router;
