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
    // Update the user's profile in the database
    const user = await User.findById(req.user._id);
    
    // Ensure the user document is found
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the fields in the database
    user.programmingLanguages = languages;
    user.toolsSoftware = tools;
    user.softSkills = softSkills;

    await user.save();  // Save the updated data

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

module.exports = router;
