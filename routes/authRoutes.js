const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();
const isAuthenticated  = require('../middleware/Authenticated');

// Signup route
router.get('/signup', (req, res) => {
    res.render('auth/signup.ejs');
});

router.post('/signup', async (req, res) => {
    const { username, password, name } = req.body;

    // Basic validation
    if (!username || !password || !name) {
        req.flash('error', 'Please fill in all fields.');
        return res.redirect('/signup');
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.flash('error', 'Username already exists.');
            return res.redirect('/signup');
        }

        const newUser = new User({ username, password, name });
        await newUser.save();

        req.flash('success', 'You are now registered!');
        res.redirect('/login');
    } catch (err) {
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/signup');
    }
});

// Login route
router.get('/login', (req, res) => {
    res.render('auth/login.ejs', {
        error_message: req.flash('error'),
        success_message: req.flash('success')
    });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/', (req, res) => {
    res.render('home.ejs', { user: req.user });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

router.get('/profile', isAuthenticated, (req, res) => {
    res.render('auth/profile.ejs', { user: req.user });
});


module.exports = {router};
