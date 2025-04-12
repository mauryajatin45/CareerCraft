const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middlewares/authMiddleware");
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require("../models/User"); 

// Initialize Gemini AI with your API key and desired model
const genAI = new GoogleGenerativeAI("AIzaSyAewv81YC4MFQ9tv4N-FEiwsafp0JFuA6g");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


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
        // If the user message contains any personal query keyword, prepend the system instruction.
        if (personalQueries.some(query => userMessage.toLowerCase().includes(query))) {
            prompt = `You are Terzettoo AI. Always start your response with "I am Terzettoo AI, how can I assist you today?" before answering the user's query.\n\nUser: ${userMessage}\nTerzettoo AI:`;
        } else {
            // For all other queries, send the user message as-is.
            prompt = userMessage;
        }
        
        // Generate a response using the Gemini AI model
        const result = await model.generateContent(prompt);
        res.json({ response: result.response.text() });
    } catch (error) {
        console.error("Error generating AI response:", error);
        res.json({ response: "I'm sorry, I couldn't process that request." });
    }
});

module.exports = router;