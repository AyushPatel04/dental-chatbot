const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const allowedTypes = [
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/heic"
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype;
    const size = parseInt(req.headers["content-length"] || "0");
    const isImage = allowedTypes.includes(mime);
    if (!isImage) return cb(new Error("Unsupported file type"));
    if (size > 2 * 1024 * 1024) return cb(new Error("Image must be 2MB or less"));
    cb(null, true);
  }
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded or invalid type" });
  const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ filePath: req.file.filename, url: fullUrl });
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/chat", async (req, res) => {
  const { message, imageUrl } = req.body;
  try {
    const content = [];
    if (message?.trim()) content.push({ type: "text", text: message.trim() });
    if (imageUrl) {
      const imagePath = path.resolve(__dirname, "uploads", path.basename(imageUrl));
      const base64Image = fs.readFileSync(imagePath).toString("base64");
      content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } });
    }
    const response = await openai.chat.completions.create({
      model: imageUrl ? "gpt-4o" : "gpt-3.5-turbo",
      messages: [{ role: "user", content }]
    });
    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "OpenAI error" });
  }
});

const PORT = 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
