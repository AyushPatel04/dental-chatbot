import { useState, useRef, useEffect } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! What brings you in today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://localhost:5050/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { text: data.reply, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Error contacting AI server:", err);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* GREEN BUTTON */}
      {!isOpen && (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
        >
          💬
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-ui flex flex-col h-full">
            {/* MINIMIZE */}
            <div className="flex justify-center mb-2">
              <button
                className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"
                onClick={() => setIsOpen(false)}
              >
                💬
              </button>
            </div>

            <h2 className="text-center text-lg font-bold text-[#004d4d] mb-2">
              Dental AI Assistant
            </h2>

            {/* MESSAGES */}
            <div className="overflow-y-auto flex flex-col gap-2 mb-2 pr-1" style={{ maxHeight: "300px" }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-2 text-sm max-w-[75%] break-words relative
                      ${msg.sender === "user"
                        ? "bg-[#6fcf97] text-white rounded-2xl rounded-br-none"
                        : "bg-white text-[#004d4d] rounded-2xl rounded-bl-none"}`}
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT */}
            <div className="flex mt-2">
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptom"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                className="send-btn"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
