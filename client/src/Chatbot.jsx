import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";

export default function Chatbot() {
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi! What brings you in today?" }]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [appointmentPrompted, setAppointmentPrompted] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = async (overrideText) => {
    const messageToSend = overrideText ?? input.trim();
    if (!messageToSend && !previewImage) return;

    let finalImageUrl = null;

    if (previewImage) {
      const tempId = Date.now();
      const tempImageMessage = {
        id: tempId,
        sender: "user",
        isImage: true,
        text: previewImage.url
      };
      setMessages((prev) => [...prev, tempImageMessage]);

      const formData = new FormData();
      formData.append("image", previewImage.file);

      try {
        const res = await fetch("https://dental-chatbot-backend.onrender.com/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        finalImageUrl = data.url;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, text: finalImageUrl, isImage: true } : msg
          )
        );
      } catch (err) {
        console.error("Image upload failed:", err);
      }

      setPreviewImage(null);
    }

    if (messageToSend) {
      setMessages((prev) => [...prev, { sender: "user", text: messageToSend, isImage: false }]);
    }

    setUserMessageCount((count) => count + 1);
    setInput("");

    try {
      const res = await fetch("https://dental-chatbot-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, imageUrl: finalImageUrl }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);

      if (userMessageCount + 1 === 3 && !appointmentPrompted) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { text: "Would you like to set an appointment with us?", sender: "bot" }
          ]);
          setAppointmentPrompted(true);
        }, 800);
      }
    } catch (err) {
      console.error("Error contacting AI server:", err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage({ file, url: imageUrl });
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {!isOpen && <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>💬</button>}
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
                <div key={i} className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} fade-in`}>
                  {msg.sender === "bot" && <img src={botProfile} alt="Bot Avatar" className="message-avatar" />}
                  <div className={`chat-message ${msg.sender}`} style={{ whiteSpace: "pre-line" }}>
                    {msg.isImage ? (
                      <img
                        src={msg.text}
                        alt="Uploaded"
                        style={{ maxWidth: "200px", borderRadius: "8px" }}
                        onError={(e) => e.target.remove()}
                      />
                    ) : msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {previewImage && (
              <div className="image-preview">
                <img src={previewImage.url} alt="Preview" style={{ maxWidth: "100px", borderRadius: "8px" }} />
                <div>
                  <span>Preview</span>
                  <button onClick={() => setPreviewImage(null)} className="remove-btn">❌</button>
                </div>
              </div>
            )}

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
                accept=".jpg,.jpeg,.png,.gif,.heic"
                id="fileUpload"
                style={{ display: "none" }}
                onChange={handleImageUpload}
                ref={fileInputRef}
              />
              <label htmlFor="fileUpload" className="upload-btn" title="Upload file">📎</label>
              <button className="send-btn" onClick={() => handleSend()}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}