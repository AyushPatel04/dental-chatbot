import { useState, useRef, useEffect } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! What brings you in today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
<<<<<<< HEAD
=======
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [appointmentPrompted, setAppointmentPrompted] = useState(false);
>>>>>>> origin/master
  const messagesEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

<<<<<<< HEAD
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
=======
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
>>>>>>> origin/master

    try {
      const res = await fetch("http://localhost:5050/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const botMessage = { text: data.reply, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
<<<<<<< HEAD
=======

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
>>>>>>> origin/master
    } catch (err) {
      console.error("Error contacting AI server:", err);
    }
  };

<<<<<<< HEAD
  // Auto-scroll to latest message
=======
>>>>>>> origin/master
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
<<<<<<< HEAD
      {/* GREEN BUTTON */}
      {!isOpen && (
        <button
          className="chatbot-toggle"
          onClick={() => setIsOpen(true)}
        >
=======
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
>>>>>>> origin/master
          💬
        </button>
      )}

<<<<<<< HEAD
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-ui flex flex-col h-full">
            {/* MINIMIZE */}
            <div className="flex justify-center mb-2">
=======
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-ui">

            {/* Minimize Button */}
            <div className="flex justify-center mb-1">
>>>>>>> origin/master
              <button
                className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs"
                onClick={() => setIsOpen(false)}
              >
                💬
              </button>
            </div>

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/master
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
<<<<<<< HEAD
            </div>

            {/* INPUT */}
            <div className="flex mt-2">
=======
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="chat-input-row">
>>>>>>> origin/master
              <input
                className="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptom"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
<<<<<<< HEAD
              <button
                className="send-btn"
                onClick={handleSend}
              >
                Send
              </button>
            </div>
=======
              <button className="send-btn" onClick={handleSend}>
                Send
              </button>
            </div>

>>>>>>> origin/master
          </div>
        </div>
      )}
    </>
  );
}
