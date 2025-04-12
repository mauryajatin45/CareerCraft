const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const MCQ = require('../models/qna');  // Import the MCQ model
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load environment variables
const Assessment = require('../models/Assessment'); 

// Make sure you set this environment variable in .env or hardcode for testing
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');


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

  // Expect arrays of strings from the front end.
  const { languages, tools, softSkills } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Convert each string into an object with a default level 'Beginner'.
    user.programmingLanguages = (Array.isArray(languages)
      ? languages.map(lang => ({ name: lang, level: 'Beginner' }))
      : []);
    user.toolsSoftware = (Array.isArray(tools)
      ? tools.map(tool => ({ name: tool, level: 'Beginner' }))
      : []);
    user.softSkills = (Array.isArray(softSkills)
      ? softSkills.map(skill => ({ name: skill, level: 'Beginner' }))
      : []);

    await user.save();

    // Redirect to the Gemini questions route after updating skills.
    res.redirect('/skill-assessment/gemini-questions');
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});



// Route to get questions from the Google GenAI API
router.get('/skill-assessment/gemini-questions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in first' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Extract topics from user's skills.
    const programmingLanguages = Array.isArray(user.programmingLanguages)
      ? user.programmingLanguages.map(skill => skill.name || skill)
      : [];
    const toolsSoftware = Array.isArray(user.toolsSoftware)
      ? user.toolsSoftware.map(skill => skill.name || skill)
      : [];
    const softSkills = Array.isArray(user.softSkills)
      ? user.softSkills.map(skill => skill.name || skill)
      : [];

    const totalQuestions = 10;

    // --- Gemini Setup ---
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // --- Helper Functions ---

    // Fetch questions
    const fetchGenAIQuestions = async (topic, count, retries = 3) => {
      try {
        const result = await model.generateContent([
          `Generate ${count} unique multiple-choice questions (only the question texts, no answers) on the topic: ${topic}. List one per line.`
        ]);
        const response = await result.response;
        const text = await response.text();

        const generatedQuestions = text.split('\n').filter(q => q.trim());
        return generatedQuestions;
      } catch (error) {
        if (retries > 0) {
          console.warn(`Retrying fetch for topic ${topic}... attempts left: ${retries}`);
          return await fetchGenAIQuestions(topic, count, retries - 1);
        } else {
          console.error(`Error fetching questions for ${topic}:`, error);
          return [];
        }
      }
    };

    // Fetch correct answer
    const fetchGenAIAnswer = async (question, retries = 3) => {
      try {
        const result = await model.generateContent([
          `Provide a concise correct answer for the following question:\n${question}`
        ]);
        const response = await result.response;
        const text = await response.text();

        return text.trim();
      } catch (error) {
        if (retries > 0) {
          console.warn(`Retrying answer generation for question "${question}"... attempts left: ${retries}`);
          return await fetchGenAIAnswer(question, retries - 1);
        } else {
          console.error(`Error fetching answer for question "${question}":`, error);
          return '';
        }
      }
    };

    // Generate options
    const generateOptions = (correctAnswer) => {
      const options = [
        { option: correctAnswer, isCorrect: true },
        { option: `Distractor A for ${correctAnswer}`, isCorrect: false },
        { option: `Distractor B for ${correctAnswer}`, isCorrect: false }
      ];
      return options.sort(() => Math.random() - 0.5); // Shuffle options randomly
    };

    let allQuestions = [];

    // Add a question to DB
    const addQuestions = async (topic, count, category) => {
      const questions = await fetchGenAIQuestions(topic, count);
      for (const question of questions) {
        const answerText = await fetchGenAIAnswer(question);
        if (!answerText) continue;

        const optionsArr = generateOptions(answerText);

        const mcq = new MCQ({
          question,
          answer: answerText,
          options: optionsArr,
          createdBy: user._id,
          category
        });

        const savedMCQ = await mcq.save();
        allQuestions.push(savedMCQ);

        console.log("Saved MCQ:", savedMCQ);

        if (allQuestions.length >= count) break;
      }
    };

    // --- End Helper Functions ---

    // Check for existing user MCQs
    let userMCQs = await MCQ.find({ createdBy: user._id }).limit(totalQuestions);

    if (userMCQs.length === 0) {
      const topics = [];
      topics.push(...programmingLanguages.slice(0, 4));
      topics.push(...toolsSoftware.slice(0, 3));
      topics.push(...softSkills.slice(0, 3));

      while (topics.length < totalQuestions) {
        topics.push("general");
      }

      for (let i = 0; i < totalQuestions; i++) {
        await addQuestions(topics[i], 1, "mixed");
      }

      allQuestions = allQuestions.slice(0, totalQuestions);
      allQuestions.sort(() => Math.random() - 0.5);

      userMCQs = allQuestions;
    } else {
      allQuestions = userMCQs;
    }

    // --- Pagination Logic: 1 question per page ---
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const questionsPerPage = 1;
    const totalPages = Math.ceil(allQuestions.length / questionsPerPage);
    const currentQuestions = allQuestions.slice((page - 1) * questionsPerPage, page * questionsPerPage);

    res.render('qna.ejs', {
      questions: currentQuestions,
      currentPage: page,
      totalPages,
      currentQuestionIndex: (page - 1) * questionsPerPage,
      userMCQs
    });

  } catch (error) {
    console.error("Error generating GenAI questions:", error);
    res.status(500).json({ success: false, message: 'Error generating questions' });
  }
});



router.post('/skill-assessment/gemini-questions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in first' });
    }

    const answers = req.body.answers;
    console.log("📝 Received answers:", answers);

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'No answers submitted or invalid format' });
    }

    const submittedAnswers = [];

    for (const answerObj of answers) {
      const { mcqId, yourAnswer } = answerObj;

      if (!mcqId || typeof yourAnswer !== 'string') {
        console.warn(`❌ Skipping invalid entry:`, answerObj);
        continue;
      }

      const question = await MCQ.findById(mcqId);
      if (!question) {
        console.warn(`⚠️ MCQ not found with ID: ${mcqId}`);
        continue;
      }

      const isCorrect = question.answer.trim().toLowerCase() === yourAnswer.trim().toLowerCase();

      // Optionally update the MCQ with the user's answer
      question.myAnswer = yourAnswer;
      await question.save();

      submittedAnswers.push({
        question: question.question,
        answer: question.answer,
        yourAnswer,
        isCorrect
      });
    }

    if (submittedAnswers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid answers were processed' });
    }

    // Store in session for later viewing
    req.session.performanceData = submittedAnswers;
    console.log("📊 Performance data stored in session:", req.session.performanceData);

    // Save to Assessment collection
    const assessment = new Assessment({
      user: req.user._id,
      answers: submittedAnswers
    });

    await assessment.save();
    console.log("✅ Assessment saved:", assessment);

    // Return redirect instruction
    res.json({
      success: true,
      message: 'Assessment submitted successfully',
      redirectUrl: '/skill-assessment/performance'
    });
  } catch (error) {
    console.error("🚨 Error submitting answers:", error);
    res.status(500).json({ success: false, message: 'Something went wrong while submitting your answers' });
  }
});



router.get('/skill-assessment/performance', async (req, res) => {
  const data = req.session.performanceData;

  if (!data || data.length === 0) {
    return res.render('performance', { 
      success_message: '', 
      error_message: '', 
      insights: [], 
      chartData: { correct: 0, incorrect: 0 },
      skillsData: {}
    });
  }

  // Counters for number of correct answers per category.
  const skillCategories = {
    "Programming": 0,
    "Tools/Software": 0,
    "Soft Skills": 0
  };

  // Totals for questions per category.
  const skillTotals = {
    "Programming": 0,
    "Tools/Software": 0,
    "Soft Skills": 0
  };

  // Build insights array and classify each question into a skill category.
  const insights = data.map(item => {
    const isCorrect = item.answer.trim().toLowerCase() === item.yourAnswer.trim().toLowerCase();

    // Default skill type
    let skillType = "Programming";
    const q = item.question.toLowerCase();

    // Change skillType based on certain keywords in the question.
    if (q.includes("tool") || q.includes("software") || q.includes("odoo") || q.includes("framework") ||
        q.includes("database") || q.includes("version control") || q.includes("git") ||
        q.includes("ui") || q.includes("ux")) {
      skillType = "Tools/Software";
    } else if (q.includes("communication") || q.includes("team") ||
               q.includes("problem solving") || q.includes("soft skill") ||
               q.includes("collaboration") || q.includes("leadership")) {
      skillType = "Soft Skills";
    }

    // Count total questions and correct responses per category.
    skillTotals[skillType]++;
    if (isCorrect) skillCategories[skillType]++;

    return {
      question: item.question,
      answer: item.answer,
      yourAnswer: item.yourAnswer,
      isCorrect,
      skillType
    };
  });

  const correctCount = insights.filter(item => item.isCorrect).length;
  const incorrectCount = insights.length - correctCount;

  const chartData = {
    correct: correctCount,
    incorrect: incorrectCount
  };

  // Calculate percentage per skill category.
  const skillsData = {};
  for (const skill in skillCategories) {
    const total = skillTotals[skill];
    const correct = skillCategories[skill];
    skillsData[skill] = total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  // Function to map percentage to skill level.
  function mapPercentageToLevel(percent) {
    if (percent >= 80) return 'Advanced';
    else if (percent >= 50) return 'Intermediate';
    else return 'Beginner';
  }

  // Update the user's skill levels based on the overall performance in each category.
  if (req.user) {
    // For each programming language update the level.
    if (req.user.programmingLanguages && req.user.programmingLanguages.length > 0) {
      req.user.programmingLanguages.forEach(skill => {
        skill.level = mapPercentageToLevel(skillsData["Programming"]);
      });
    }
    // For each tool/software skill update the level.
    if (req.user.toolsSoftware && req.user.toolsSoftware.length > 0) {
      req.user.toolsSoftware.forEach(skill => {
        skill.level = mapPercentageToLevel(skillsData["Tools/Software"]);
      });
    }
    // For each soft skill update the level.
    if (req.user.softSkills && req.user.softSkills.length > 0) {
      req.user.softSkills.forEach(skill => {
        skill.level = mapPercentageToLevel(skillsData["Soft Skills"]);
      });
    }
    await req.user.save();
  }

  res.render('performance', {
    success_message: 'Performance loaded successfully!',
    error_message: '',
    insights,
    chartData,
    skillsData
  });
});


module.exports = {
  router,
  genAI
};
