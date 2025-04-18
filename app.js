const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const ejsMate = require("ejs-mate");
const methodOverride = require('method-override');
require('dotenv').config();
// const ngrok = require('ngrok');
const http = require('http');
const socketIO = require('socket.io');

// Models
const Resume = require('./models/Resume');
const User = require('./models/User');

// Import configured passport
require('./config/passport')(passport);

// Import routes
const { router: authRoutes } = require('./routes/authRoutes');
const { router: skillAssessmentRouter } = require('./routes/skillAssessment');
const { router: jobMarketRouter } = require('./routes/job-market');
const { router: resumeRoutes } = require('./routes/resume-interview');
const { router: interviewPrepRouter } = require('./routes/interview-prep');
const { router: networkRoutes } = require('./routes/network');
const { router: careerSuggestion } = require('./routes/carrer-suggestions');
const airesumeRoutes = require('./routes/resume');
const { router: mentorRoutes } = require('./routes/mentor');

// Initialize app
const app = express();
const port = process.env.PORT || 3000;

// MongoDB Atlas connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// View engine and static files
app.engine("ejs", ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(flash());

// Session configuration
const sessionOptions = {
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
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

// Global template variables
app.use((req, res, next) => {
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/', skillAssessmentRouter);
app.use('/', careerSuggestion);
app.use('/', jobMarketRouter);
app.use('/', resumeRoutes);
app.use('/', interviewPrepRouter);
app.use('/', networkRoutes);
app.use('/resume', airesumeRoutes);
app.use('/', mentorRoutes);

// Video call page
// app.get('/video-call', (req, res) => {
//   res.render('video-call');
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).render('404.ejs');
// });

// // Socket.io setup
// const server = http.createServer(app);
// const io = socketIO(server);

// io.on('connection', (socket) => {
//   console.log('🟢 User connected:', socket.id);

//   socket.on('join-room', (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit('user-connected', socket.id);
//     console.log(`🔗 Socket ${socket.id} joined room ${roomId}`);

//     socket.on('offer', (data) => {
//       socket.to(roomId).emit('offer', data);
//     });

//     socket.on('answer', (data) => {
//       socket.to(roomId).emit('answer', data);
//     });

//     socket.on('candidate', (data) => {
//       socket.to(roomId).emit('candidate', data);
//     });

//     socket.on('disconnect', () => {
//       socket.to(roomId).emit('user-disconnected', socket.id);
//       console.log('User disconnected:', socket.id);
//     });
//   });
// });

// Start server and ngrok tunnel
if (require.main === module) {
  app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
  });
} else {
  module.exports = app;
}