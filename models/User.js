const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    preferredLanguages: {
        type: [String],  // Array of Strings to store programming languages
        required: false  // This can be optional depending on your use case
    },
    preferredTools: {
        type: [String],  // Array of Strings to store tools/software
        required: false  // This can be optional as well
    },
    softSkills: {
        type: [String],  // Array of Strings to store soft skills
        required: false  // This can be optional
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
