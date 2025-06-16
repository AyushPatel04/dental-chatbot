const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const multer = require("multer");
const path = require("path");

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

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Allowed MIME types for upload
const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf"
];

// Set up Multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const size = parseInt(req.headers["content-length"] || "0");

    const isImage = [
      "image/jpeg", "image/jpg", "image/png", "image/gif", "image/heic"
    ].includes(mime);

    const isDoc = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ].includes(mime);

    if (isImage && size > 2 * 1024 * 1024) {
      return cb(new Error("Image files must be 2MB or less"));
    }
    if (isDoc && size > 5 * 1024 * 1024) {
      return cb(new Error("Document files must be 5MB or less"));
    }

    if (!isImage && !isDoc && mime !== "text/plain" && mime !== "application/rtf") {
      return cb(new Error("Unsupported file type"));
    }

    cb(null, true);
  }
});

// Track the last uploaded image URL
let lastUploadedFileUrl = "";

// Upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded or invalid type" });

  const filePath = `uploads/${req.file.filename}`;
  const fullUrl = `https://dental-chatbot-backend.onrender.com/${filePath}`;
  lastUploadedFileUrl = fullUrl;
  console.log("📎 Uploaded File:", fullUrl);
  res.json({ filePath });
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chat endpoint
app.options("/chat", cors());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("✅ Incoming message:", message);

  try {
    let payload;

    const wantsImageAnalysis =
      message.toLowerCase().includes("analyze") && lastUploadedFileUrl;

    if (wantsImageAnalysis) {
      console.log("🧠 Sending GPT-4o image analysis request...");

      payload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", content: "Please analyze this image." },
              {
                type: "image_url",
                image_url: {
                  url: lastUploadedFileUrl
                }
              }
            ]
          }
        ],
        response_format: "text" // <--- Ensures compatibility with basic usage
      };
    } else {
      payload = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      };
    }

    console.log("📤 Payload sent to OpenAI:", JSON.stringify(payload, null, 2));

    const response = await openai.chat.completions.create(payload);
    const reply = response.choices[0].message.content;
    console.log("🤖 GPT Reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ OpenAI API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "OpenAI error" });
  }
});

// Handle upload/format errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("file")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
