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

  const handleSend = async (overrideText) => {
    const messageToSend = overrideText ?? input.trim();
    if (!messageToSend) return;

    const userMessage = { text: messageToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUserMessageCount((count) => count + 1);

    try {
      const res = await fetch("https://dental-chatbot-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("https://dental-chatbot-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const imageUrl = `https://dental-chatbot-backend.onrender.com/${data.filePath}`;

      setMessages((prev) => [
        ...prev,
        {
          text: imageUrl,
          sender: "user",
          isImage: true
        },
        {
          text: "Image uploaded. Feel free to ask a question about it!",
          sender: "bot"
        }
      ]);
    } catch (err) {
      console.error("Image upload failed:", err);
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
            <div className="chatbot-top-header">
              <div className="header-left">
                <button className="expand-btn" onClick={() => setIsMaximized((m) => !m)}>
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
                <button className="minimize-btn" onClick={() => setIsOpen(false)}>✕</button>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} fade-in`}
                >
                  {msg.sender === "bot" && <img src={botProfile} alt="Bot Avatar" className="message-avatar" />}
                  <div className={`chat-message ${msg.sender}`} style={{ whiteSpace: "pre-line" }}>
                    {msg.isImage ? (
                      <img src={msg.text} alt="User upload" style={{ maxWidth: "200px", borderRadius: "8px" }} />
                    ) : (
                      msg.text
                    )}
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
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.heic,.pdf,.doc,.docx,.txt,.rtf"
                id="fileUpload"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
              <label htmlFor="fileUpload" className="upload-btn" title="Upload file">📎</label>
              <button className="send-btn" onClick={() => handleSend()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
