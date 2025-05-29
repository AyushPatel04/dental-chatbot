import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png"; // Your expand/minimize icon

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! What brings you in today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [appointmentPrompted, setAppointmentPrompted] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const lowerInput = input.trim().toLowerCase();
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUserMessageCount((count) => count + 1);

    // Appointment prompt logic (optional, from your code)
    if (
      appointmentPrompted &&
      (lowerInput.includes("yes") || lowerInput.includes("sure") || lowerInput.includes("okay"))
    ) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Great! You can set your appointment here: https://docs.google.com/forms/d/e/1FAIpQLSfdL4jPbQ5TfYHccOk8fm73q07qyknY8jCZ-onGu5dV4UnORg/viewform?usp=header",
          sender: "bot"
        }
      ]);
      return;
    }

    try {
      const res = await fetch("http://localhost:5050/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { text: data.reply, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);

      // Prompt to set appointment after 3 user messages
      if (userMessageCount + 1 === 3 && !appointmentPrompted) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              text: "Would you like to set an appointment with us?",
              sender: "bot",
            },
          ]);
          setAppointmentPrompted(true);
        }, 800);
      }
    } catch (err) {
      console.error("Error contacting AI server:", err);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* Floating green chat button */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {/* Main chatbot window */}
      {isOpen && (
        <div className={`chatbot-container${isMaximized ? " maximized" : ""}`}>
          <div className="chatbot-ui">
            {/* Header with expand/minimize (left) and chat icon (center) */}
            <div className="chatbot-header">
              {/* Left: Expand/minimize arrow */}
              <button
                className="expand-btn"
                onClick={() => setIsMaximized((m) => !m)}
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                <img
                  src={expandIcon}
                  alt={isMaximized ? "Minimize" : "Maximize"}
                  style={{ width: 24, height: 24 }}
                />
              </button>
              {/* Center: White chat bubble icon */}
              <div className="chatbot-center-icon">
                <button
                  className="chat-center-btn"
                  onClick={() => setIsOpen(false)}
                  title="Minimize"
                >
                  {/* SVG chat bubble */}
                  <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                    <rect x="2" y="4" width="24" height="18" rx="5" fill="#fff" stroke="#b2dfdb" strokeWidth="2" />
                    <circle cx="8" cy="13" r="1.5" fill="#b2dfdb" />
                    <circle cx="14" cy="13" r="1.5" fill="#b2dfdb" />
                    <circle cx="20" cy="13" r="1.5" fill="#b2dfdb" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Title */}
            <h2 className="text-center text-lg font-bold text-[#004d4d] mb-1 mt-8">
              Dental AI Assistant
            </h2>
            {/* Messages */}
            <div className="messages-container">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} fade-in`}
                >
                  {msg.sender === "bot" && (
                    <div className="avatar">🦷</div>
                  )}
                  <div
                    className={`chat-message ${msg.sender}`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input bar */}
            <div className="chat-input-row">
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptom"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button className="send-btn" onClick={handleSend}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
