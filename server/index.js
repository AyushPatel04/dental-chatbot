const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const path =require("path");
const fs = require("fs");

dotenv.config();
const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
// Increased JSON payload limit to handle base64 image data from the client
app.use(express.json({ limit: '10mb' }));

// --- VERCEL DEPLOYMENT NOTE ---
// The following functions use `fs` to read and write to local JSON files (`appointments.json`, `logs.json`).
// Vercel's serverless functions have a temporary and read-only filesystem.
// This means any data written to these files will NOT persist between requests or server restarts.
// For a production environment on Vercel, you MUST replace this with a persistent storage solution
// like Vercel KV, Vercel Postgres, or an external database (e.g., MongoDB, PlanetScale).

const APPOINTMENT_LOG_FILE = path.join("/tmp", "appointments.json");
const LOG_FILE = path.join("/tmp", "logs.json");

// Helper function to ensure the temporary directory exists
const ensureTmpDir = () => {
    const tmpDir = path.join("/tmp");
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
};

const readAppointments = () => {
    ensureTmpDir();
    try {
        if (fs.existsSync(APPOINTMENT_LOG_FILE)) {
            const data = fs.readFileSync(APPOINTMENT_LOG_FILE, "utf8");
            return JSON.parse(data || "[]");
        }
    } catch (err) {
        console.error("Error reading or parsing appointments file:", err);
    }
    return [];
};

// REMOVED: The /upload endpoint is not compatible with a stateless server environment like Vercel.
// Image data will be sent directly to the endpoints that need it as a base64 string.

app.post("/extract-info", async (req, res) => {
  // The client now sends a base64 data URL in the request body.
  const { imageDataUrl } = req.body;
  if (!imageDataUrl) return res.status(400).json({ error: "No image data provided for extraction." });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `You are a data extraction tool. Analyze the image of the insurance card and extract the following fields: provider, memberId, memberName. Return the data ONLY in a valid JSON object format. Example: {"provider": "Example Insurance", "memberId": "X12345", "memberName": "John Doe"}. Do not include any text outside of the JSON object.` },
          // The base64 data URL is sent directly to OpenAI.
          { type: "image_url", image_url: { url: imageDataUrl } },
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

app.post("/chat", async (req, res) => {
  // The client now sends a base64 data URL instead of a file path.
  const { message, imageDataUrl } = req.body;

  if (imageDataUrl) {
    try {
      const prompt = message || "Please analyze this image from a dental perspective.";

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `You are a helpful dental assistant AI named Kaysee. A user has provided an image and a question about a potential dental issue. Your task is to offer general, safe advice based on what is visible and explain what a dentist might typically look for. **You must not provide a diagnosis.** Your primary goal is to be helpful while strongly encouraging the user to seek professional care for a proper diagnosis. Frame your response as helpful information, not a medical conclusion. User's question: "${prompt}"` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        }],
      });
      return res.json({ reply: response.choices[0].message.content });
    } catch (err) {
       console.error("Error in /chat with image:", err);
       return res.status(500).json({ error: "OpenAI image analysis error" });
    }
  }

  // Text-only chat logic remains the same
  try {
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

    if (!isTopicRelevant) {
        return res.json({ reply: "I'm sorry, I can only answer questions related to dentistry." });
    }

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

app.post("/log", (req, res) => {
  ensureTmpDir();
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

app.post("/book-appointment", (req, res) => {
  ensureTmpDir();
  const appointmentData = { ...req.body, submissionTimestamp: new Date().toISOString() };
  const appointments = readAppointments();
  
  const isBooked = appointments.some(app => app.bookingDay === appointmentData.bookingDay && app.timeSlot === appointmentData.timeSlot);
  if (isBooked) {
      return res.status(409).json({ error: "This time slot is no longer available." });
  }

  appointments.push(appointmentData);
  fs.writeFile(APPOINTMENT_LOG_FILE, JSON.stringify(appointments, null, 2), (writeErr) => {
    if (writeErr) {
      console.error("Failed to log appointment:", writeErr);
      return res.status(500).send("Failed to save appointment");
    }
    console.log("New Appointment Booking Request:", JSON.stringify(appointmentData, null, 2));
    res.status(200).json({ message: "Appointment booked successfully and logged." });
  });
});

app.get("/get-appointments", (req, res) => {
    const appointments = readAppointments();
    res.json(appointments);
});

app.get("/get-booked-slots", (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ error: "Date query parameter is required." });
    }
    const appointments = readAppointments();
    const bookedSlots = appointments
        .filter(app => app.bookingDay === date)
        .map(app => app.timeSlot);
    res.json(bookedSlots);
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));