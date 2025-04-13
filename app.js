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
require('dotenv').config();
const ngrok = require('ngrok'); // include ngrok

const Resume = require('./models/Resume');

// Import routes and passport strategy
const {router: authRoutes} = require('./routes/authRoutes');
const { router: skillAssessmentRouter } = require('./routes/skillAssessment');
const { router: jobMarketRouter } = require('./routes/job-market');
const {router: resumeRoutes} = require('./routes/resume-interview');
const { router: interviewPrepRouter } = require('./routes/interview-prep');
const { router: networkRoutes } = require('./routes/network'); 
const { router: careerSuggestion  } = require('./routes/carrer-suggestions'); 
const airesumeRoutes = require('./routes/resume');

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

app.use(flash());

const sessionOptions = {
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGO_URI
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));

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

app.use((req, res, next) => {
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use(express.json());

app.use("/", authRoutes);
app.use("/", skillAssessmentRouter); 
app.use("/", careerSuggestion);
app.use("/", jobMarketRouter);
app.use("/", resumeRoutes);
app.use("/", interviewPrepRouter);
app.use("/", networkRoutes);
app.use('/resume', airesumeRoutes);

// New route for video call page
app.get('/video-call', (req, res) => {
  res.render('video-call');
});

app.use((req, res) => {
  res.status(404).render('404.ejs');
});

const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('A user connected: ', socket.id);
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', socket.id);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    socket.on('offer', (data) => {
      socket.to(roomId).emit('offer', data);
    });
    socket.on('answer', (data) => {
      socket.to(roomId).emit('answer', data);
    });
    socket.on('candidate', (data) => {
      socket.to(roomId).emit('candidate', data);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', socket.id);
      console.log('User disconnected: ', socket.id);
    });
  });
});

// Start the HTTP server and then create an ngrok tunnel
server.listen(port, async () => {
  console.log(`🚀 Server is running on port ${port}`);
  try {
    const url = await ngrok.connect(port);
    console.log(`ngrok tunnel established at: ${url}`);
  } catch (error) {
    console.error('Error starting ngrok tunnel:', error);
  }
});
