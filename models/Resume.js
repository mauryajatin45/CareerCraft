const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },

  // Textual feedback fields
  formattingFeedback: String,
  clarityFeedback: String,
  technicalDepthFeedback: String,
  missingElements: String,
  suggestedImprovements: String,

  // ✅ Grading rubric as a single embedded object, not an array
  gradingRubric: {
    formatting: { type: Number },
    clarity: { type: Number },
    technicalDepth: { type: Number },
    completeness: { type: Number }
  }
});

module.exports = mongoose.model('Resume', resumeSchema);
