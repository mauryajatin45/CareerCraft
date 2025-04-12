const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to format Gemini response for HTML rendering
function formatJobMarketData(rawText) {
  if (!rawText) return "No data available.";

  return rawText
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Convert **bold** to <strong>
    .replace(/\n\s*\*\s(.*?)(?=\n|$)/g, '<li>$1</li>')  // Convert * bullet points to <li>
    .replace(/\n{2,}/g, '</ul><br><ul>')               // Paragraph separation with <ul>
    .replace(/^/, '<ul>')                              // Start first list
    .concat('</ul>');                                  // Close last list
}

router.route('/job-market')
  .get((req, res) => {
    res.render('index');
  })
  .post(async (req, res) => {
    const { jobTitle, location } = req.body;

    try {
      const contentRequest = `Provide job market insights for the position of "${jobTitle}" in "${location}", including salary, growth trends, hype, and market conditions.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: contentRequest }] }]
      });

      const data = response?.candidates?.[0]?.content?.parts?.[0]?.text || "No data available";

      const formattedData = formatJobMarketData(data);

      res.render('results', {
        jobTitle,
        location,
        jobMarketDataFormatted: formattedData,
      });

    } catch (error) {
      console.error('Error generating AI content:', error);
      res.status(500).send('Error fetching data. Please try again later.');
    }
  });

module.exports = { router };
