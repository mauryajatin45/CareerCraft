const { generateResumeContent } = require('../services/aiService');
const { generatePDF } = require('../services/pdfService');
const { getAISuggestions } = require('../services/aiService');


exports.showBuilder = (req, res) => {
  res.render('resumeBuilder.ejs');
};

exports.generateResume = async (req, res) => {
  try {
    const resumeData = req.body;
    const resumeContent = await generateResumeContent(resumeData);
    res.json({ success: true, resume: resumeContent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generatePDF = async (req, res) => {
  try {
    const { htmlContent } = req.body;
    const pdfBuffer = await generatePDF(htmlContent);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAISuggestions = async (req, res) => {
    try {
      const { prompt, context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: "Prompt is required" 
        });
      }
  
      const suggestions = await getAISuggestions(prompt, context || {});
      res.json({ 
        success: true, 
        suggestions: suggestions.suggestions || [],
        examples: suggestions.examples || []
      });
    } catch (error) {
      console.error("Controller Error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Failed to get AI suggestions" 
      });
    }
  };