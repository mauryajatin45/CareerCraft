const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mentorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    expertise: {
        type: String,
        required: true
    },
    experienceYears: {
        type: Number,
        required: true
    },
    bio: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    linkedin: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hash middleware
mentorSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Password compare method
mentorSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Mentor', mentorSchema);
