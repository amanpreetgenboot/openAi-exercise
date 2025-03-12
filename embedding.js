const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" }); 
    const response = await model.embedContent(text);
    return response.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

module.exports = { generateEmbedding };
