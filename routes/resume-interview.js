const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const axios = require('axios');
const pdfParse = require('pdf-parse');
const PDFParser = require('pdf2json');
const Resume = require('../models/Resume');

// Helper: Extract with pdf2json
function extractWithPdf2Json(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on('pdfParser_dataError', err => reject(err.parserError));
    parser.on('pdfParser_dataReady', pdfData => {
      const text = pdfData?.formImage?.Pages?.map(page =>
        page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(' ')
      ).join('\n\n');
      resolve(text);
    });

    parser.parseBuffer(buffer);
  });
}

// GET route
router.get('/resume-interview', async (req, res) => {
  console.log("✅ Route HIT: /resume-interview");

  if (!req.user) return res.redirect('/login');

  try {
    const resume = await Resume.findOne({ user: req.user._id }).sort({ uploadedAt: -1 });
    console.log("📄 Resume:", resume);

    // Check if the resume needs processing: missingElements is empty
    const needsAnalysis = resume && (!resume.missingElements || resume.missingElements.trim() === "");

    if (resume && needsAnalysis) {
      console.log("🔍 No missing elements found. Extracting PDF...");

      const response = await axios.get(resume.pdfUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(response.data);

      let pdfText = await extractWithPdf2Json(pdfBuffer);

      // Fallback to pdf-parse if needed
      if (!pdfText || pdfText.trim().length < 20) {
        console.warn("⚠️ pdf2json failed, falling back to pdf-parse...");
        const fallback = await pdfParse(pdfBuffer);
        pdfText = fallback.text;
      }

      if (!pdfText || pdfText.trim() === "") {
        console.warn("🚨 Still no text found in resume.");
        return res.render('resume-interview.ejs', {
          user: req.user,
          resumeExists: true,
          resumeUrl: resume?.pdfUrl,
          error: "Could not extract text from PDF. Please upload a simpler resume format."
        });
      }

      console.log("📃 Extracted Resume Text (preview):", pdfText.slice(0, 300));

      // Call external AI API
      const analysisResponse = await axios.post('https://careercraft-y4el.onrender.com/analyze-text', {
        text: pdfText
      });

      const {
        formattingFeedback,
        clarityFeedback,
        technicalDepthFeedback,
        missingElements,
        suggestedImprovements,
        gradingRubric
      } = analysisResponse.data;

      // Save in MongoDB
      Object.assign(resume, {
        formattingFeedback,
        clarityFeedback,
        technicalDepthFeedback,
        missingElements,
        suggestedImprovements,
        gradingRubric: [gradingRubric]
      });

      await resume.save();
      console.log("✅ Resume updated with analysis 🎯");
    }

    // Render the page with existing or updated resume data
    res.render('resume-interview.ejs', {
      user: req.user,
      resumeExists: !!resume,
      resumeUrl: resume?.pdfUrl || "",
      clarityFeedback: resume?.clarityFeedback || "",
      formattingFeedback: resume?.formattingFeedback || "",
      technicalDepthFeedback: resume?.technicalDepthFeedback || "",
      missingElements: resume?.missingElements || "",
      suggestedImprovements: resume?.suggestedImprovements || ""
    });

  } catch (err) {
    console.error("❌ Error in GET /resume-interview:", err.message || err);
    res.status(500).send("Internal Server Error");
  }
});

// POST route
router.post('/resume-interview', upload.single('resume'), async (req, res) => {
  try {
    const pdfUrl = req.file.path;
    console.log("✅ PDF Uploaded to Cloudinary:", pdfUrl);

    const newResume = new Resume({
      user: req.user._id,
      pdfUrl
    });

    await newResume.save();
    console.log("📁 Resume saved to MongoDB");

    res.redirect('/resume-interview');
  } catch (err) {
    console.error("❌ Error uploading resume:", err.message);
    res.status(500).send("Error uploading resume");
  }
});

module.exports = {router};
