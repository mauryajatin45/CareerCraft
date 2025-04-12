const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require("../models/User"); 

// Initialize Gemini AI with your API key and desired model
const genAI = new GoogleGenerativeAI("AIzaSyCaHT5AUOdo2ejsOrvbE2SN_WUYW0NsyFo");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Render the chat page for authenticated users
router.get("/career-suggestions", (req, res) => {
    res.render("career-suggestion", { user: req.user });
});

// Route for the chatbot
router.post("/chat", async (req, res) => {
  try {
      const userMessage = req.body.message;
      
      // Define keywords/phrases for personal queries regarding the bot
      const personalQueries = [
          "what is your name",
          "who are you",
          "your name",
          "tell me your name",
          "are you terzettoo ai"
      ];

      let prompt;

      // For personal queries, prepend the system instruction
      if (personalQueries.some(query => userMessage.toLowerCase().includes(query))) {
          prompt = `You are Terzettoo AI. Always start your response with "I am Terzettoo AI, how can I assist you today?" before answering the user's query.\n\nUser: ${userMessage}\nTerzettoo AI:`;
      } else {
          // For other queries, structure the prompt for career suggestions and resources
          prompt = `
You are Terzettoo AI, a virtual career advisor for developers.

Respond with:
1. Career paths related to the skill or keyword: "${userMessage}"
2. In-demand job roles or opportunities
3. Recommended online resources (like freeCodeCamp, Coursera, etc.)
4. Specific YouTube video tutorial links or channels to learn this skill effectively
5. Optional: Include a brief learning roadmap or checklist if relevant.

Format your response clearly and helpfully.
          
User: ${userMessage}
Terzettoo AI:
`;
      }

      // Generate a response using the Gemini AI model
      const result = await model.generateContent(prompt);
      res.json({ response: result.response.text() });
  } catch (error) {
      console.error("Error generating AI response:", error);
      res.json({ response: "I'm sorry, I couldn't process that request." });
  }
});


module.exports = {router};