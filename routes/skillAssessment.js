const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const axios = require('axios');

// Render skill-assessment page
router.get('/skill-assessment', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please log in to view your profile' });
  }
  
  // Render the skill assessment page with user data
  res.render('skillAssessment', { user: req.user });
});

// Route to update skill assessment
router.post('/update-skill-assessment', async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in to update your profile' });
    }
  
    const { languages, tools, softSkills } = req.body;
  
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      user.programmingLanguages = languages;
      user.toolsSoftware = tools;
      user.softSkills = softSkills;
  
      await user.save();
  
      // Redirect to Gemini question generation
      res.redirect('/skill-assessment/gemini-questions');
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ success: false, message: 'Error updating profile' });
    }
  });
  

// Route to get questions from the Gemini API
router.get('/skill-assessment/gemini-questions', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Please log in first' });
      }
  
      const user = await User.findById(req.user._id);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const { programmingLanguages = [], toolsSoftware = [], softSkills = [] } = user;
  
      // Determine question distribution (e.g., 4 lang, 3 tools, 3 softSkills)
      const totalQuestions = 10;
      const languageCount = Math.min(4, programmingLanguages.length);
      const toolCount = Math.min(3, toolsSoftware.length);
      const softSkillCount = Math.min(3, softSkills.length);
  
      const questions = [];
  
      // Generate dummy questions (you'll later use Gemini API)
      for (let i = 0; i < languageCount; i++) {
        questions.push(`Explain a key concept of ${programmingLanguages[i]}`);
      }
  
      for (let i = 0; i < toolCount; i++) {
        questions.push(`How would you use ${toolsSoftware[i]} in a project?`);
      }
  
      for (let i = 0; i < softSkillCount; i++) {
        questions.push(`Describe a situation where you demonstrated ${softSkills[i]}`);
      }
  
      // Fill any remaining spots to total 10
      while (questions.length < totalQuestions) {
        questions.push("Describe a project where you used multiple skills effectively.");
      }
  
      // Shuffle questions for randomness (optional)
      questions.sort(() => Math.random() - 0.5);
  
      console.log("Generated Gemini Questions:");
      questions.forEach((q, i) => console.log(`${i + 1}. ${q}`));
  
      // Send success response or redirect somewhere else
      res.send("Questions generated and logged in terminal.");
  
    } catch (error) {
      console.error("Error generating Gemini questions:", error);
      res.status(500).json({ success: false, message: 'Error generating questions' });
    }
  });
  

module.exports = router;
