const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/heic"];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) return cb(new Error("Unsupported file type"), false);
    const size = parseInt(req.headers["content-length"] || "0");
    if (size > 5 * 1024 * 1024) return cb(new Error("Image must be 5MB or less"), false);
    cb(null, true);
  }
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded or invalid type" });
  const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url: fullUrl });
});

app.post("/extract-info", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided for extraction." });
  try {
    const imagePath = req.file.path;
    const base64Image = fs.readFileSync(imagePath).toString("base64");
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `You are a data extraction tool. Analyze the image of the insurance card and extract the following fields: provider, memberId, memberName. Return the data ONLY in a valid JSON object format. Example: {"provider": "Example Insurance", "memberId": "X12345", "memberName": "John Doe"}. Do not include any text outside of the JSON object.` },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      }],
      temperature: 0.1,
    });
    const jsonText = response.choices[0].message.content.replace(/```json\n|```/g, "").trim();
    res.json(JSON.parse(jsonText));
  } catch (err) {
    console.error("Error during info extraction:", err);
    res.status(500).json({ error: "Failed to extract information from image." });
  }
});

// Updated /chat endpoint with guardrails
app.post("/chat", async (req, res) => {
  const { message, imageUrl } = req.body;
  
  // If there's an image, it's almost certainly dental-related, so we bypass the topic check.
  if (imageUrl) {
    try {
      const imagePath = path.resolve(__dirname, "uploads", path.basename(imageUrl));
      const base64Image = fs.readFileSync(imagePath).toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;
      const prompt = message || "Please analyze this image from a dental perspective.";
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `You are a helpful dental assistant AI named Kaysee. A user has provided an image and a question about a potential dental issue. Your task is to offer general, safe advice based on what is visible and explain what a dentist might typically look for. **You must not provide a diagnosis.** Your primary goal is to be helpful while strongly encouraging the user to seek professional care for a proper diagnosis. Frame your response as helpful information, not a medical conclusion. User's question: "${prompt}"` },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        }],
      });
      return res.json({ reply: response.choices[0].message.content });
    } catch (err) {
       console.error("Error in /chat with image:", err);
       return res.status(500).json({ error: "OpenAI image analysis error" });
    }
  }

  // --- THIS IS THE NEW GUARDRAIL LOGIC for text-only messages ---
  try {
    // Step 1: Classify the user's message
    const topicCheck = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
            role: "system",
            content: "You are a topic classifier. Your only job is to determine if the user's message is related to dentistry, dental health, appointments, insurance, or a general greeting. Answer only with the word 'yes' or 'no'."
        }, {
            role: "user",
            content: message
        }],
        temperature: 0,
        max_tokens: 3
    });

    const isTopicRelevant = topicCheck.choices[0].message.content.toLowerCase().includes('yes');

    // Step 2: If not relevant, send a predefined response.
    if (!isTopicRelevant) {
        return res.json({ reply: "I'm sorry, I can only answer questions related to dentistry." });
    }

    // Step 3: If relevant, proceed with the normal chat response.
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
    });

    res.json({ reply: response.choices[0].message.content });

  } catch (err) {
    console.error("Error in /chat endpoint:", err);
    res.status(500).json({ error: "OpenAI error" });
  }
});

const LOG_FILE = path.join(__dirname, "logs.json");
app.post("/log", (req, res) => {
  const logData = { ...req.body, timestamp: new Date().toISOString() };
  fs.readFile(LOG_FILE, "utf8", (err, data) => {
    const logs = err ? [] : JSON.parse(data || "[]");
    logs.push(logData);
    fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), (writeErr) => {
      if (writeErr) return res.status(500).send("Failed to log");
      res.send("Logged");
    });
  });
});

const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
