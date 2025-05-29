# 🦷 Dental Chatbot

<<<<<<< HEAD
© 2025 Ayush Patel and Aditya Rao. All Rights Reserved.

This project and its source code are protected by copyright law. No part of this repository may be copied, reproduced, distributed, or used in any way without the express written permission of the authors.

For licensing inquiries or permission requests, contact: ayush81304@gmail.com

---

An AI-powered chatbot that helps users describe dental symptoms and receive helpful responses. Built with React (frontend) and Node.js/Express (backend), and powered by OpenAI's GPT model.
=======
A simple AI-powered chatbot that helps users describe dental symptoms and receive helpful responses. Built with React (frontend) and Node.js/Express (backend), and powered by OpenAI's GPT model.
>>>>>>> origin/master

---

## 🚀 Features

- Users can type symptoms (e.g., "toothache", "arm hurts") and receive AI-generated guidance.
- Frontend built in React.
- Backend uses Express and OpenAI's API.
- CORS configured for local development (`localhost:3000` & `localhost:5000`).

---

## 🛠️ Tech Stack

- React
- Node.js / Express
- OpenAI API
- CORS
- dotenv

---

## 📦 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/AyushPatel04/dental-chatbot.git
cd dental-chatbot
```

### 2. Install dependencies

Backend
```bash
cd server
npm install
```
Frontend
```bash
cd ../client
npm install
```
### 3. Set up environment variables

Create a .env file in the server folder
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Run the application

Start Backend
```bash
cd server
node index.js
```
Start Frontend
```bash
cd ../client
npm start
```
Then visit http://localhost:3000 in your browser.

