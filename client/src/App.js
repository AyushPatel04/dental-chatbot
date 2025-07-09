import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "./Chatbot";
import Dashboard from "./Dashboard";
import "./App.css";

// A simple component to represent the main page with the chatbot
function ChatbotPage() {
  return (
    <div className="App">
      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatbotPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
