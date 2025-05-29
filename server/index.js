const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();

// 🔍 DEBUG: Check if API key is loaded
console.log("🧪 API Key Loaded:", !!process.env.OPENAI_API_KEY);

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.options("/chat", cors()); // Ensure preflight requests are handled

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("✅ Incoming message:", message);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    const reply = response.choices[0].message.content;
    console.log("🤖 GPT Reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ OpenAI API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "OpenAI error" });
  }
});

const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
