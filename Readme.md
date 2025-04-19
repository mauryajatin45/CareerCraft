# CareerCraft: Career Development Platform

## Description

CareerCraft is a comprehensive career development platform developed by Team QUAD. This application helps users assess their skills, prepare for interviews, build resumes, and receive AI-powered career guidance tailored to their experience and goals.

## Team Members

- **UI/UX Designer**: Shivam Jatap
- **Frontend Developer**: Jigar Prajapati
- **Backend & Database**: Jatin Maurya
- **AI/ML Specialist**: Dhruv Chudasama

## Tech Stack

### Frontend
- **Template Engine**: EJS
- **Styling**: CSS, Bootstrap
- **Client-side Logic**: JavaScript

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: Passport.js
- **PDF Processing**: pdf-parse, pdf2json

### Database
- **Database**: MongoDB
- **ODM**: Mongoose
- **Session Storage**: connect-mongo

### AI/ML Integration
- **Google Generative AI**: Gemini-2.0-flash model for career advice and assessments
- **Third-party APIs**: Integration for interview preparation and job market analysis

### DevOps
- **Environment Variables**: dotenv
- **File Storage**: Cloudinary

## Features

### User Management
- **User Authentication**: Secure login and registration system with Passport.js
- **Mentor Registration**: Separate authentication flow for mentors

### Skill Assessment
- **Skill Inventory**: Track programming languages, tools/software, and soft skills
- **AI-Generated Assessments**: Custom questions based on user's skill profile
- **Performance Analytics**: Visual representation of assessment results

### Career Development
- **AI Career Advisor**: Conversational interface for career guidance
- **Multilingual Support**: Career advice in multiple languages
- **Career Path Recommendations**: Customized career suggestions

### Resume Building
- **Resume Upload**: PDF resume parsing and analysis
- **Feedback System**: AI-powered resume improvement suggestions
- **Missing Elements Detection**: Identify important missing components in resumes

### Interview Preparation
- **Role-specific Guides**: Customized interview preparation based on job role
- **Company Research**: Tailored advice for specific companies
- **Mock Interviews**: Practice with AI-generated questions

### Networking
- **Mentor Connection**: Connect with industry mentors
- **Mentor Dashboard**: Specialized interface for mentors

## Application Flow

1. **User Registration/Login**: Users create an account or log in
2. **Skill Assessment**: Users add their skills and take assessments to gauge proficiency
3. **Career Suggestions**: Based on skills and interests, AI provides career path recommendations
4. **Resume Building**: Users upload and improve their resumes with AI feedback
5. **Interview Preparation**: Users prepare for interviews with custom guides
6. **Mentorship**: Connect with mentors for personalized guidance

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- Google Generative AI API key

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env`
4. Start the application: `npm start`

## Contributing

Team QUAD welcomes contributions. Please feel free to submit pull requests or open issues for suggestions and bug reports.