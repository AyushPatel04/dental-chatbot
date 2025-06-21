const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

console.log("🧪 API Key Loaded:", !!process.env.OPENAI_API_KEY);

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
    const isDoc = [
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ].includes(mime);

    if (isImage && size > 2 * 1024 * 1024)
      return cb(new Error("Image files must be 2MB or less"));
    if (isDoc && size > 5 * 1024 * 1024)
      return cb(new Error("Document files must be 5MB or less"));
    if (!isImage && !isDoc && mime !== "text/plain" && mime !== "application/rtf")
      return cb(new Error("Unsupported file type"));

    cb(null, true);
  }
});

let lastUploadedFilePath = "";

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded or invalid type" });
  lastUploadedFilePath = req.file.path;
  console.log("📎 Uploaded File Path:", lastUploadedFilePath);
  res.json({ filePath: req.file.filename });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.options("/chat", cors());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  console.log("✅ Incoming message:", message);

  try {
    let payload;
    const wantsImageAnalysis = lastUploadedFilePath;

    if (wantsImageAnalysis) {
      console.log("🧠 Preparing image for GPT-4o...");

      const imageBuffer = fs.readFileSync(path.resolve(__dirname, lastUploadedFilePath));
      const base64Image = imageBuffer.toString("base64");

      const safeText =
        typeof message === "string" && message.trim().length > 0
          ? message.trim()
          : "Please analyze this image.";

      payload = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: safeText
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ]
      };
    } else {
      payload = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: String(message || "") }]
      };
    }

    console.log("📤 Sending to OpenAI...");
    const response = await openai.chat.completions.create(payload);
    const reply = response.choices[0].message.content;
    console.log("🤖 GPT Reply:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ OpenAI API Error:", err.response?.data || err.message);
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
