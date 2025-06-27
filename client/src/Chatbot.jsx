import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";
import { procedureCosts } from "./procedureCosts";

export default function Chatbot() {
const [messages, setMessages] = useState([
  {
    sender: "bot",
    text: 'Hello! How can I assist you today? If you would like to book an appointment, say "book".'
  }]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [appointmentPrompted, setAppointmentPrompted] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [selectedInsuranceProvider, setSelectedInsuranceProvider] = useState("");
  const [chatFlowStage, setChatFlowStage] = useState("start");
  const [insuranceData, setInsuranceData] = useState({ provider: "", memberId: "", image: null });

const logConversation = async (userMsg, botMsg) => {
  try {
    await fetch("http://localhost:5050/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { sender: "user", text: userMsg },
          { sender: "bot", text: botMsg }
        ],
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error("Logging failed:", err);
  }
};

const handleSend = async (overrideText) => {
  const messageToSend = overrideText ?? input.trim();
  if (!messageToSend && !previewImage) return;

  const lowered = messageToSend.toLowerCase();

  const yesResponses = [
    "yes", "yeah", "yep", "yup", "yea", "ye", "y", "sure", "of course", "absolutely", "definitely", "ok", "okay"
  ];

  if (chatFlowStage === "awaiting_appointment_confirmation" && yesResponses.includes(lowered)) {
    const appointmentMessage = {
      sender: "bot",
      isComponent: true,
      component: (
        <span>
          Great! You can book your appointment here:{" "}
          <a
            href="https://forms.gle/k1kHBp6HDrHpre1aA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Book Now
          </a>
        </span>
      )
    };
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: messageToSend },
      appointmentMessage
    ]);
    await logConversation(messageToSend, "Great! You can book your appointment here: [link]");
    setChatFlowStage("start");
    setInput("");
    return;
  }

  if (
    chatFlowStage === "start" &&
    !appointmentPrompted &&
    (lowered.includes("appointment") || lowered.includes("book"))
  ) {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: messageToSend },
      { sender: "bot", text: "Sure! Would you like to set an appointment with us?" }
    ]);
    await logConversation(messageToSend, "Sure! Would you like to set an appointment with us?");
    setAppointmentPrompted(true);
    setChatFlowStage("awaiting_appointment_confirmation");
    setUserMessageCount((count) => count + 1);
    setInput("");
    return;
  }

  if (chatFlowStage === "choose_insurance_path") {
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    if (lowered === "full") {
      setMessages((prev) => [...prev, { sender: "bot", text: "Great! Who is your insurance provider?" }]);
      await logConversation(messageToSend, "Great! Who is your insurance provider?");
      setChatFlowStage("awaiting_provider");
    } else if (lowered === "estimate") {
      setMessages((prev) => [...prev, {
        sender: "bot",
        text: "No problem! Please select a procedure and your insurance from the dropdowns below to get a cost estimate."
      }]);
      await logConversation(messageToSend, "No problem! Please select a procedure and your insurance from the dropdowns below to get a cost estimate.");
      setChatFlowStage("estimate_only");
    } else {
      setMessages((prev) => [...prev, { sender: "bot", text: "Please type 'full' or 'estimate'." }]);
    }
    setInput("");
    return;
  }

  if (chatFlowStage === "offer_estimate" && lowered === "estimate") {
    setMessages((prev) => [...prev, {
      sender: "bot",
      text: "No problem! Please select a procedure and your insurance from the dropdowns below to get a cost estimate."
    }]);
    await logConversation(messageToSend, "No problem! Please select a procedure and your insurance from the dropdowns below to get a cost estimate.");
    setChatFlowStage("estimate_only");
    setInput("");
    return;
  }

  if (chatFlowStage === "awaiting_provider") {
    setInsuranceData((prev) => ({ ...prev, provider: messageToSend }));
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: messageToSend },
      { sender: "bot", text: "Got it! What's your member ID? (You can also skip this)" },
    ]);
    await logConversation(messageToSend, "Got it! What's your member ID? (You can also skip this)");
    setChatFlowStage("awaiting_member_id");
    setInput("");
    return;
  }

  if (chatFlowStage === "awaiting_member_id") {
    setInsuranceData((prev) => ({ ...prev, memberId: messageToSend }));
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: messageToSend },
      { sender: "bot", text: "Would you like to upload a photo of your insurance card for faster verification?\n(Upload it below or type 'skip')" },
    ]);
    await logConversation(messageToSend, "Would you like to upload a photo of your insurance card for faster verification? (Upload it below or type 'skip')");
    setChatFlowStage("awaiting_card_upload");
    setInput("");
    return;
  }

  if (chatFlowStage === "awaiting_card_upload" && lowered === "skip") {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: messageToSend },
      { sender: "bot", text: "No problem! Your insurance info has been noted." },
    ]);
    await logConversation(messageToSend, "No problem! Your insurance info has been noted.");
    setChatFlowStage("offer_estimate");
    setInput("");
    return;
  }

  let finalImageUrl = null;
  if (previewImage) {
    const tempId = Date.now();
    setMessages((prev) => [...prev, { id: tempId, sender: "user", isImage: true, text: previewImage.url }]);
    const formData = new FormData();
    formData.append("image", previewImage.file);

    try {
      const res = await fetch("http://localhost:5050/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      finalImageUrl = data.url;
      setMessages((prev) =>
        prev.map((msg) => msg.id === tempId ? { ...msg, text: finalImageUrl, isImage: true } : msg)
      );
      if (chatFlowStage === "awaiting_card_upload") {
        setInsuranceData((prev) => ({ ...prev, image: finalImageUrl }));
        setMessages((prev) => [...prev, { sender: "bot", text: "Thanks! Your insurance info is complete. Would you like a cost estimate now?" }]);
        await logConversation("[image uploaded]", "Thanks! Your insurance info is complete. Would you like a cost estimate now?");
        setChatFlowStage("offer_estimate");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    }
    setPreviewImage(null);
  }

  if (messageToSend) {
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
  }
  setUserMessageCount((count) => count + 1);
  setInput("");

  try {
    const res = await fetch("http://localhost:5050/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageToSend, imageUrl: finalImageUrl })
    });
    const data = await res.json();
    setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    await logConversation(messageToSend, data.reply);
  } catch (err) {
    console.error("Error contacting AI server:", err);
  }
};

  const handleEstimate = () => {
    if (!selectedProcedure || !selectedInsuranceProvider) {
      setErrorMessage("Please select both a procedure and an insurance provider.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    const cost = procedureCosts[selectedProcedure][selectedInsuranceProvider];
    setMessages(prev => [
      ...prev,
      { sender: "user", text: `${selectedProcedure} with ${selectedInsuranceProvider}` },
      { sender: "bot", text: `The cost for ${selectedProcedure} with ${selectedInsuranceProvider} is ${cost}.` }
    ]);
    setSelectedProcedure("");
    setSelectedInsuranceProvider("");
    setChatFlowStage("start");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage("Image must be 2MB or less.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
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
            {errorMessage && <div className="toast-error">{errorMessage}</div>}

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
                <div
                  className={`chat-message ${msg.sender}`}
                  style={{
                    whiteSpace: "pre-line",
                    maxWidth: "75%", // consistent with your CSS
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.isImage ? (
                    <img
                      src={msg.text}
                      alt="Uploaded"
                      style={{ maxWidth: "200px", borderRadius: "8px" }}
                      onError={(e) => e.target.remove()}
                    />
                  ) : msg.component ? (
                    <div style={{ display: "inline-block", maxWidth: "100%", overflowWrap: "anywhere" }}>
                      {msg.component}
                    </div>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.text}</p>
                  )}
                </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {previewImage && (
              <div className="preview-image-wrapper">
                <div className="preview-image-box">
                  <img src={previewImage.url} alt="Preview" className="preview-img-small" onClick={() => setPreviewImage(null)} title="Click to remove" />
                  <button className="preview-remove-btn" onClick={() => setPreviewImage(null)}>✕</button>
                </div>
              </div>
            )}

            {chatFlowStage !== "estimate_only" && (
              <div className="insurance-button-wrapper">
                <button className="insurance-start-btn" onClick={() => {
                  setMessages((prev) => [...prev, {
                    sender: "bot",
                    text: "Got it! Would you like to:\n1. Enter full insurance info\n2. Get a quick estimate\n\nType 'full' or 'estimate'."
                  }]);
                  setChatFlowStage("choose_insurance_path");
                }}>🩺 Upload Insurance Info</button>
              </div>
            )}

            {chatFlowStage === "estimate_only" ? (
              <div className="estimate-ui">
                <select value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}>
                  <option value="">Select Procedure</option>
                  {Object.keys(procedureCosts).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={selectedInsuranceProvider} onChange={e => setSelectedInsuranceProvider(e.target.value)} disabled={!selectedProcedure}>
                  <option value="">Select Insurance</option>
                  {selectedProcedure && Object.keys(procedureCosts[selectedProcedure]).map(ins => <option key={ins} value={ins}>{ins}</option>)}
                </select>
                <button className="estimate-btn" onClick={handleEstimate}>Get Estimate</button>
              </div>
            ) : (
              <div className="chat-input-row">
                <input className="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Reply to DentalBot..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                <input type="file" accept=".jpg,.jpeg,.png,.gif,.heic" id="fileUpload" style={{ display: "none" }} onChange={handleImageUpload} ref={fileInputRef} />
                <label htmlFor="fileUpload" className="upload-btn" title="Upload file">📎</label>
                <button className="send-btn" onClick={() => handleSend()}>Send</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
