const mongoose = require('mongoose');

// Updated MCQ Schema (QnA Schema)
const mcqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }, // correct answer
  options: {
    type: [
      {
        option: { type: String, required: true },
        isCorrect: { type: Boolean, required: true }
      }
    ],
    required: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const MCQ = mongoose.model('MCQ', mcqSchema);

module.exports = MCQ;
