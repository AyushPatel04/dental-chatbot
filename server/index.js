const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const multer = require("multer");
const path = require("path");

dotenv.config();
const app = express();

console.log("\uD83E\uDDEA API Key Loaded:", !!process.env.OPENAI_API_KEY);

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedTypes = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/heic",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain", "application/rtf"
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const size = parseInt(req.headers["content-length"] || "0");
    const isImage = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/heic"].includes(mime);
    const isDoc = ["application/pdf", "application/msword",
                   "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mime);

    if (isImage && size > 2 * 1024 * 1024)
      return cb(new Error("Image files must be 2MB or less"));
    if (isDoc && size > 5 * 1024 * 1024)
      return cb(new Error("Document files must be 5MB or less"));
    if (!isImage && !isDoc && mime !== "text/plain" && mime !== "application/rtf")
      return cb(new Error("Unsupported file type"));

    cb(null, true);
  }
});

let lastUploadedFileUrl = "";

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded or invalid type" });
  const filePath = `uploads/${req.file.filename}`;
  const fullUrl = `https://dental-chatbot-backend.onrender.com/${filePath}`;
  lastUploadedFileUrl = fullUrl;
  console.log("\uD83D\uDCCE Uploaded File:", fullUrl);
  res.json({ filePath });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.options("/chat", cors());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("\u2705 Incoming message:", message);
  try {
    let payload;
    const wantsImageAnalysis = message.toLowerCase().includes("analyze") && lastUploadedFileUrl;

    if (wantsImageAnalysis) {
      console.log("\uD83E\uDDE0 Sending GPT-4o image analysis request...");
      payload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", content: "Please analyze this image." },
              { type: "image_url", image_url: { url: lastUploadedFileUrl } }
            ]
          }
        ],
        response_format: "text"
      };
    } else {
      payload = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      };
    }

    console.log("\uD83D\uDCEC Payload sent to OpenAI:", JSON.stringify(payload, null, 2));
    const response = await openai.chat.completions.create(payload);
    const reply = response.choices[0].message.content;
    console.log("\uD83E\uDD16 GPT Reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("\u274C OpenAI API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "OpenAI error" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("file")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const PORT = 5050;
app.listen(PORT, () => console.log(`\uD83D\uDE80 Server running on port ${PORT}`));
