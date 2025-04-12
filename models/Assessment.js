const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssessmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
      yourAnswer: { type: String, required: true },
      isCorrect: { type: Boolean, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
