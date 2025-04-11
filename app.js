const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const ejsMate = require("ejs-mate");
const LocalStrategy = require("passport-local").Strategy; 
const methodOverride = require('method-override');
require('dotenv').config(); // 🔥 Load environment variables from .env

const Resume = require('./models/Resume'); // Assuming you have a Resume model

// Import routes and passport strategy
const authRoutes = require('./routes/authRoutes');
const skillAssessment = require('./routes/skillAssessment');
const temp = require('./routes/temp');
const resumeRoutes = require('./routes/resume-interview'); // Assuming you have a resume-interview route

const User = require('./models/User'); 
require('./config/passport')(passport); 

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

// MongoDB Atlas connection using environment variable
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

// Flash messages middleware
app.use(flash());

// Session options using MongoStore and secret from .env
const sessionOptions = {
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));

// Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'No user found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return done(null, false, { message: 'Incorrect password' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Flash message globals
app.use((req, res, next) => {
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  next();
});

// This goes before all your routes
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use(express.json()); 

// Routes
app.use("/", authRoutes);
app.use("/", skillAssessment);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('404.ejs');
});

// Server start
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
