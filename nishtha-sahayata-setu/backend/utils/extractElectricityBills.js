const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

async function extractElectricityBills(files) {
  // Use a Multimodal model (Gemini 1.5 Flash is recommended for extraction tasks)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const extracted = [];

  for (const file of files) {
    const bytes = file.buffer;

    const result = await model.generateContent([
      {
        inlineData: {
          data: bytes.toString("base64"),
          mimeType: file.mimetype,
        },
      },
      `
      Extract the electricity bill details in JSON format. 
      Do not include markdown formatting (like \`\`\`json). Just return the raw JSON object.
      
      Required fields:
      {
        "elec_account_no": "Consumer number or Account ID",
        "bill_amount": "Total amount due",
        "bill_date": "Date bill was generated",
        "due_date": "Date payment is due",
        "delay_days": "difference between bill_date and due_date, if bill_date > due_date, then calculate delay_days as the difference between them or else 0",
      }
      `
    ]);

    const responseText = result.response.text();

    // Safety: Clean the text in case the model returns Markdown backticks
    const cleanedText = responseText.replace(/```json|```/g, "").trim();

    try {
      extracted.push(JSON.parse(cleanedText));
    } catch (error) {
      console.error("Failed to parse JSON for a file:", error);
      // Push an error object or null so the loop continues
      extracted.push({ error: "Failed to parse bill data" }); 
    }
  }

  return extracted;
}

module.exports = { extractElectricityBills };