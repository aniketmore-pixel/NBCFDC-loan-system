const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("Testing connection...");
    // We try to count tokens just to ping the model endpoint
    const info = await model.countTokens("Hello");
    console.log("✅ SUCCESS! Model found. Token count:", info.totalTokens);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.log("\nIf you see 404 here, double-check that your API Key is from Google AI Studio (aistudio.google.com), NOT Google Cloud Vertex AI.");
  }
}

listModels();