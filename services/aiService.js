const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

async function generateResumeContent(resumeData) {
  const prompt = `
    Create a professional resume based on the following information:
    Name: ${resumeData.name}
    Title: ${resumeData.title}
    Experience: ${JSON.stringify(resumeData.experience)}
    Education: ${JSON.stringify(resumeData.education)}
    Skills: ${resumeData.skills.join(', ')}
    Summary: ${resumeData.summary}

    Format the resume in HTML with the following structure:
    1. Clean, professional header with name and contact info
    2. Professional summary section
    3. Work experience with bullet points
    4. Education section
    5. Skills section
    6. Use proper HTML tags and minimal inline styling
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function getAISuggestions(prompt, context) {
  try {
    const fullPrompt = `...`; // Your prompt construction
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Failed to generate suggestions");
  }
}

module.exports = { generateResumeContent, getAISuggestions };