const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require("../models/User"); 
const isAuthenticated = require("../middleware/Authenticated");

// Configure Gemini AI
const configureGemini = () => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCaHT5AUOdo2ejsOrvbE2SN_WUYW0NsyFo");
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

const model = configureGemini();

// Personal query detection middleware
const detectPersonalQuery = (message) => {
    const personalQueries = [
        "what is your name",
        "who are you",
        "your name",
        "tell me your name",
        "are you Career Craft ai"
    ];
    return personalQueries.some(query => message.toLowerCase().includes(query));
};

// Generate AI prompt based on message type
const generatePrompt = (message, isPersonal) => {
    if (isPersonal) {
        return `You are Career Craft AI. Always start your response with "I am Career Craft AI, how can I assist you today?" before answering the user's query.\n\nUser: ${message}\nCareer Craft AI:`;
    }
    
    return `You are Career Craft AI, a virtual career advisor for developers.
    
    Respond with:
    1. Career paths related to: "${message}"
    2. In-demand job roles
    3. Recommended online resources
    4. YouTube tutorial links/channels
    5. Learning roadmap if relevant
    
    Format clearly and helpfully.
    
    User: ${message}
    Career Craft AI:`;
};

// Handle chat requests
const handleChat = async (req, res) => {
    try {
        if (!req.body?.message?.trim()) {
            return res.status(400).json({ error: "Message is required" });
        }

        const userMessage = req.body.message.trim();
        const isPersonal = detectPersonalQuery(userMessage);
        const prompt = generatePrompt(userMessage, isPersonal);

        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        res.json({ response: response.replace(/\*\*/g, '') });

    } catch (error) {
        console.error("Chat Error:", error);
        const statusCode = error.response?.status || 500;
        const errorMessage = error.message || "Failed to process request";
        res.status(statusCode).json({ 
            response: "I'm having trouble processing your request. Please try again later.",
            error: errorMessage
        });
    }
};

// Routes
router.get("/career-suggestions", isAuthenticated, (req, res) => {
    res.render("carrerrSuggestion/career-suggestion", { 
        user: req.user,
        title: "Career Suggestions"
    });
});

router.post("/chat", express.json(), handleChat);

module.exports = { router };