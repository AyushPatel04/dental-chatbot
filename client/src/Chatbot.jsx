import { useState, useRef, useEffect } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! What brings you in today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

    // Respond with appointment link if user said yes
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
        }, 800); // Slight delay for realism
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
        <div className="chatbot-container">
          <div className="chatbot-ui">
            {/* Minimize Button */}
            <div className="flex justify-center mb-1">
              <button
                className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"
                onClick={() => setIsOpen(false)}
              >
                💬
              </button>
            </div>

            <h2 className="text-center text-lg font-bold text-[#004d4d] mb-1">
              Dental AI Assistant
            </h2>

            {/* Scrollable Messages */}
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

            {/* Input Bar */}
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
