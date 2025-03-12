const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const { storeWebpageContent } = require("./storeContent");
const { retrieveRelevantChunks } = require("./retreiveChunks");

const app = express();
const port = process.env.PORT;

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function fetchWebpageContent(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching webpage:", error);
    throw new Error("Failed to fetch webpage content.");
  }
}

async function extractAnswerFromWebpage(url, html, query) {
  const $ = cheerio.load(html);
  const webpageText = $("body").text();

  // Store scraped content into Pinecone
  await storeWebpageContent(url, webpageText);

  // Retrieve relevant chunks using the query
  const relevantText = await retrieveRelevantChunks(query);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Answer the following question based on the text below:\n\nQuestion: ${query}\n\nText: ${relevantText}`;

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (error) {
    console.error("Error extracting answer:", error);
    throw new Error("Failed to extract answer from content.");
  }
}

async function extractAnswerFromWebpage(html, query) {
  const $ = cheerio.load(html);
  const webpageText = $("body").text();

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Answer the following question based on the text below:\n\nQuestion: ${query}\n\nText: ${webpageText}`;

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (error) {
    console.error("Error extracting answer:", error);
    throw new Error("Failed to extract answer from content.");
  }
}

app.post("/extract", async (req, res) => {
  const { url, query } = req.body;

  if (!url || !query) {
    return res.status(400).json({ error: "Both URL and query are required." });
  }

  try {
    const html = await fetchWebpageContent(url);
    const answer = await extractAnswerFromWebpage(url, html, query);

    res.json({
      url,
      query,
      answer,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/extract-legal", async (req, res) => {
  const { agreementText } = req.body;

  if (!agreementText) {
    return res.status(400).json({ error: "Agreement text is required." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Extract the following details from the legal agreement:
    1. Name of the parties
    2. Payment amount
    3. Payment method
    4. Payment date
    5. Two-line description of the agreement

    Agreement Text: 
    """${agreementText}"""
    
    Provide the output in JSON format like this:
    {
      "parties": ["Party 1", "Party 2"],
      "paymentAmount": "$X",
      "paymentMethod": "Payment Method",
      "paymentDate": "YYYY-MM-DD",
      "description": "Two-line summary"
    }
    `;

    const response = await model.generateContent(prompt);
    const extractedText = response.response.text().trim();
    
    const jsonMatch = extractedText.match(/```json\n([\s\S]*?)\n```/);
    let extractedData;
    try {
      extractedData = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(extractedText);
    } catch (error) {
      extractedData = { error: "Failed to parse JSON", rawResponse: extractedText };
    }

    res.json({ agreementText, extractedData });
  } catch (error) {
    console.error("Error extracting legal agreement details:", error);
    res.status(500).json({ error: "Failed to extract legal details." });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
