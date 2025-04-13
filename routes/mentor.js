const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Passport strategy for mentors
passport.use('mentor-local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const mentor = await Mentor.findOne({ email });
        if (!mentor) return done(null, false, { message: 'No mentor found with this email.' });

        const isMatch = await mentor.comparePassword(password);
        if (!isMatch) return done(null, false, { message: 'Incorrect password.' });

        return done(null, mentor);
    } catch (err) {
        return done(err);
    }
}));

// Serialize and deserialize for mentors
passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: 'mentor' });
});
passport.deserializeUser(async (obj, done) => {
    try {
        const user = await Mentor.findById(obj.id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Mentor Sign Up
router.get('/mentor/signup', (req, res) => {
    res.render('mentor-signup', {user: req.user});
});

router.post('/mentor/signup', async (req, res) => {
    const { fullName, expertise, experienceYears, bio, email, password, linkedin } = req.body;
    try {
        const existing = await Mentor.findOne({ email });
        if (existing) {
            req.flash('error', 'Email already registered.');
            return res.redirect('/mentor/signup');
        }

        const newMentor = new Mentor({ fullName, expertise, experienceYears, bio, email, password, linkedin });
        await newMentor.save();
        req.flash('success', 'Mentor account created! You can now log in.');
        res.redirect('/mentor/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong during registration.');
        res.redirect('/mentor/signup');
    }
});

// Mentor Login
router.get('/mentor/login', (req, res) => {
    res.render('mentor-login');
});

router.post('/mentor/login', passport.authenticate('mentor-local', {
    successRedirect: '/mentor/dashboard',
    failureRedirect: '/mentor/login',
    failureFlash: true
}));

// Mentor Dashboard (Protected Route)
router.get('/mentor/dashboard', isMentorLoggedIn, (req, res) => {
    res.render('mentor-dashboard', { mentor: req.user });
});

function isMentorLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'Please log in as a mentor.');
    res.redirect('/mentor/login');
}

module.exports = { router };
