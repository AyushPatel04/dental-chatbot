import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";

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

    if (
      appointmentPrompted &&
      (lowerInput.includes("yes") || lowerInput.includes("sure") || lowerInput.includes("okay"))
    ) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Great! You can set your appointment here: [Google Form Link]",
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
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {isOpen && (
        <div className={`chatbot-container${isMaximized ? " maximized" : ""}`}>
          <div className="chatbot-ui">
            {/* LeadBot-Style Header */}
            <div className="chatbot-top-header">
              <div className="header-left">
                <button
                  className="expand-btn"
                  onClick={() => setIsMaximized((m) => !m)}
                  title={isMaximized ? "Minimize" : "Maximize"}
                >
                  <img src={expandIcon} alt="Toggle size" width={20} height={20} />
                </button>
              </div>
              <div className="header-center">
                <img src={botProfile} alt="Bot Avatar" className="bot-avatar" />
                <div className="bot-details">
                  <div className="bot-name">DentalBot</div>
                  <div className="bot-status">🟢 Online Now</div>
                </div>
              </div>
              <div className="header-right">
                <button className="minimize-btn" onClick={() => setIsOpen(false)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} fade-in`}
                >
                  {msg.sender === "bot" && ( <img src={botProfile} alt="Bot Avatar" className="message-avatar" />)}
                  <div className={`chat-message ${msg.sender}`} style={{ whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-row">
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply to DentalBot..."
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
