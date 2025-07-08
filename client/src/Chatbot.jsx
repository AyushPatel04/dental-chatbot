import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";
import { procedureCosts } from "./procedureCosts";

// --- Helper Components ---
const InsuranceProviderSelector = ({ onSelectProvider }) => {
  const [selection, setSelection] = useState("");
  const [otherValue, setOtherValue] = useState("");
  const providers = ["No Insurance", "BrightSmile Basic", "ToothCare Plus", "HappyMouth Gold", "Other"];
  const handleSelectChange = (e) => {
    const value = e.target.value;
    setSelection(value);
    if (value !== "Other") onSelectProvider(value, false);
  };
  const handleContinue = () => {
    if (otherValue.trim()) onSelectProvider(otherValue.trim(), true);
  };
  return (
    <div className="p-2 space-y-2 bg-gray-100 rounded-lg">
      <select onChange={handleSelectChange} value={selection} className="w-full p-2 border rounded-md">
        <option value="">-- Select Your Provider --</option>
        {providers.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {selection === "Other" && (
        <div className="space-y-2">
          <input type="text" placeholder="Please type your provider name" value={otherValue} onChange={(e) => setOtherValue(e.target.value)} className="w-full p-2 border rounded-md" />
          <button onClick={handleContinue} className="w-full bg-blue-500 text-white p-2 rounded-lg font-bold">Continue</button>
        </div>
      )}
    </div>
  );
};
const ProcedureSelector = ({ selected, onToggle }) => (
  <div className="p-3 bg-gray-100 rounded-lg max-h-48 overflow-y-auto">
    <p className="font-bold mb-2">Select procedures:</p>
    <div className="space-y-2">
      {Object.keys(procedureCosts).map((proc) => (
        <label key={proc} className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" checked={selected.includes(proc)} onChange={() => onToggle(proc)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span>{proc}</span>
        </label>
      ))}
    </div>
  </div>
);
const QuickEstimateSelector = ({ onEstimate }) => {
  const [procedure, setProcedure] = useState("");
  const [insurance, setInsurance] = useState("");
  const handleGetEstimate = () => {
    if (procedure && insurance) onEstimate(procedure, insurance);
    else alert("Please select both a procedure and an insurance provider.");
  };
  return (
    <div className="p-2 space-y-2 bg-gray-100">
      <select value={procedure} onChange={e => setProcedure(e.target.value)} className="w-full p-2 border rounded-md">
        <option value="">Select Procedure</option>
        {Object.keys(procedureCosts).map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={insurance} onChange={e => setInsurance(e.target.value)} disabled={!procedure} className="w-full p-2 border rounded-md">
        <option value="">Select Insurance</option>
        {procedure && Object.keys(procedureCosts[procedure]).map(ins => <option key={ins} value={ins}>{ins}</option>)}
      </select>
      <button className="w-full bg-green-600 text-white p-2 rounded-lg font-bold" onClick={handleGetEstimate}>Get Quick Estimate</button>
    </div>
  );
};
const ConfirmationButtons = ({ onConfirm, onDeny }) => (
  <div className="flex justify-center gap-2 p-2">
    <button onClick={onConfirm} className="flex-1 bg-green-500 text-white p-2 rounded-lg font-bold">👍 Yes, Correct</button>
    <button onClick={onDeny} className="flex-1 bg-red-500 text-white p-2 rounded-lg font-bold">👎 No, Incorrect</button>
  </div>
);

// --- Main Chatbot Component ---
export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! My name is Kaysee, Kansas City University's personal AI assistant. How can I assist you today? If you would like to book an appointment, say \"book\"." },
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [chatFlowStage, setChatFlowStage] = useState("start");
  const [insuranceData, setInsuranceData] = useState({ provider: "", memberId: "", isOther: false });
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [appointmentPrompted, setAppointmentPrompted] = useState(false);
  const [uploadContext, setUploadContext] = useState('general');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const logConversation = async (userMsg, botMsg) => {
    try {
      await fetch("http://localhost:5050/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ sender: "user", text: userMsg }, { sender: "bot", text: botMsg }] }),
      });
    } catch (err) { console.error("Logging failed:", err); }
  };

  const addMessage = (sender, text, isImage = false) => {
    const newMessage = { sender, text, isImage };
    setMessages((prev) => [...prev, newMessage]);
    if (sender === 'bot' && messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.sender === 'user' && !m.isImage).pop();
      if(lastUserMessage) logConversation(lastUserMessage.text, text);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addMessage("user", `Uploading ${file.name}...`, true);
    const formData = new FormData();
    formData.append("image", file);
    
    try {
      // Step 1: Always upload the file first to get a URL
      const uploadRes = await fetch("http://localhost:5050/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error('File upload failed');
      const { url: imageUrl } = await uploadRes.json();
      if (!imageUrl) throw new Error("File URL not received.");
      
      setMessages(prev => prev.map(m => m.text.startsWith("Uploading") ? { ...m, text: imageUrl, isImage: true } : m));

      // Step 2: Decide what to do with the image based on context
      if (uploadContext === 'insurance') {
        // We need to re-send the file data for extraction, not just the URL
        const extractFormData = new FormData();
        extractFormData.append("image", file);
        const extractRes = await fetch("http://localhost:5050/extract-info", { method: "POST", body: extractFormData });
        const extractedData = await extractRes.json();
        if (!extractRes.ok) throw new Error(extractedData.error || "Extraction failed");
        
        const knownProviders = ["BrightSmile Basic", "ToothCare Plus", "HappyMouth Gold"];
        let foundProvider = knownProviders.find(p => extractedData.provider.includes(p)) || extractedData.provider;
        
        setInsuranceData({ ...extractedData, provider: foundProvider, isOther: false });
        
        const confirmationText = `Please confirm the details from your card:\n- **Provider:** ${foundProvider}\n- **Member Name:** ${extractedData.memberName || "N/A"}\n- **Member ID:** ${extractedData.memberId || "N/A"}\n\nIs this information correct?`;
        addMessage("bot", confirmationText);
        setChatFlowStage("confirming_photo_details");

      } else {
        const chatRes = await fetch("http://localhost:5050/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input, imageUrl }),
        });
        const { reply } = await chatRes.json();
        addMessage("bot", reply);
        setInput("");
      }
    } catch (err) {
      console.error("Upload process failed:", err);
      addMessage("bot", `Sorry, there was an error processing the image.`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = null;
      setUploadContext('general');
    }
  };

  const handleFullEstimate = () => {
    if (selectedProcedures.length === 0) {
      addMessage("bot", "Please select at least one procedure.");
      return;
    }
    const { provider, isOther } = insuranceData;
    if (isOther) {
      let noInsuranceCost = 0, ballparkCost = 0;
      const comparisonPlan = "BrightSmile Basic";
      selectedProcedures.forEach(proc => {
        noInsuranceCost += parseFloat(procedureCosts[proc]["No Insurance"].replace(/[^0-9.-]+/g, ""));
        ballparkCost += parseFloat(procedureCosts[proc][comparisonPlan].replace(/[^0-9.-]+/g, ""));
      });
      const otherInsuranceMessage = `I am not sure if **${provider}** is supported by us as it is not on our general list. However, I highly recommend you book an appointment to see if it is. \n\nYour price without any insurance coverage would be **$${noInsuranceCost.toFixed(2)}**.\n\nFor comparison, if your plan is similar to our other partners, your cost could be around **$${ballparkCost.toFixed(2)}**. If **${provider}** is covered, it will be a much better price.`;
      addMessage("bot", otherInsuranceMessage);
    } else {
      let totalCost = 0;
      const costDetails = selectedProcedures.map(proc => {
        const costStr = procedureCosts[proc]?.[provider] || procedureCosts[proc]?.["No Insurance"];
        const costNum = parseFloat(costStr.replace(/[^0-9.-]+/g, ""));
        totalCost += costNum;
        return `\n- ${proc}: **${costStr}**`;
      }).join('');
      const finalMessage = `Based on your **${provider}** plan, here is your itemized estimate:\n${costDetails}\n\n**Total Estimated Cost: $${totalCost.toFixed(2)}**`;
      addMessage("bot", finalMessage);
    }
    setChatFlowStage("start");
    setSelectedProcedures([]);
    setInsuranceData({ provider: "", memberId: "", isOther: false });
  };

  const handleQuickEstimate = (procedure, insurance) => {
    const cost = procedureCosts[procedure][insurance];
    addMessage("user", `Estimate for ${procedure} with ${insurance}`);
    addMessage("bot", `The estimated cost for ${procedure} with ${insurance} is **${cost}**.`);
    setChatFlowStage("start");
  };

  const handleSend = async (overrideText) => {
    const userMessage = overrideText ?? input.trim();
    if (!userMessage) return;
    addMessage("user", userMessage);
    setInput("");
    const lowered = userMessage.toLowerCase();
    const affirmativeResponses = ["yes", "yup", "yeah", "correct", "sure", "ok", "yep", "indeed", "right"];
    if (chatFlowStage === "start" && (lowered.includes("appointment") || lowered.includes("book"))) {
      addMessage("bot", "Sure! Would you like to set an appointment with us?");
      setAppointmentPrompted(true);
      setChatFlowStage("awaiting_appointment_confirmation");
      return;
    }
    if (chatFlowStage === "awaiting_appointment_confirmation" && affirmativeResponses.includes(lowered)) {
      const appointmentMessage = `Great! You can book your appointment here: <a href="https://forms.gle/k1kHBp6HDrHpre1aA" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Book Now</a>`;
      addMessage("bot", appointmentMessage);
      setChatFlowStage("start");
      setAppointmentPrompted(false);
      return;
    }
    if (chatFlowStage === "choose_insurance_path") {
      if (lowered === 'full') {
        addMessage("bot", "Great. Would you like to upload a photo of your insurance card or enter the details manually?");
        setChatFlowStage("awaiting_upload_or_manual");
      } else if (lowered === 'estimate') {
        addMessage("bot", "No problem! Please select a procedure and your insurance from the dropdowns below to get a quick cost estimate.");
        setChatFlowStage("estimate_only");
      }
      return;
    }
    if (chatFlowStage === "awaiting_upload_or_manual") {
      if (lowered.includes('upload')) {
        setUploadContext('insurance');
        fileInputRef.current.click();
      } else if (lowered.includes('manual')) {
        addMessage("bot", "Please select your insurance provider from the list below.");
        setChatFlowStage("awaiting_manual_provider");
      }
      return;
    }
    if (chatFlowStage === "confirming_photo_details") {
      if (affirmativeResponses.includes(lowered)) {
        addMessage("bot", "Excellent! Now, please select the procedure(s) you're interested in.");
        setChatFlowStage("selecting_multiple_procedures");
      } else {
        addMessage("bot", "No problem. Let's enter the details manually. Please select your provider from the list.");
        setInsuranceData({ provider: "", memberId: "", isOther: false });
        setChatFlowStage("awaiting_manual_provider");
      }
      return;
    }
    if (chatFlowStage === "awaiting_manual_member_id") {
      setInsuranceData(prev => ({ ...prev, memberId: userMessage }));
      addMessage("bot", "Thanks! Your insurance info is complete. Now, please select the procedure(s) you're interested in.");
      setChatFlowStage("selecting_multiple_procedures");
      return;
    }
    try {
      const res = await fetch("http://localhost:5050/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      addMessage("bot", data.reply);
    } catch (err) {
      addMessage("bot", "Sorry, I'm having trouble connecting right now.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const renderChatStageUI = () => {
    switch(chatFlowStage) {
      case 'awaiting_upload_or_manual':
        return (
          <div className="flex justify-center gap-2 p-2">
            <button onClick={() => handleSend('Upload Photo')} className="flex-1 bg-blue-500 text-white p-2 rounded-lg font-bold">📷 Upload Photo</button>
            <button onClick={() => handleSend('Enter Manually')} className="flex-1 bg-gray-500 text-white p-2 rounded-lg font-bold">⌨️ Enter Manually</button>
          </div>
        );
      case 'awaiting_manual_provider':
        return <InsuranceProviderSelector onSelectProvider={(provider, isOther) => {
          addMessage("user", provider);
          setInsuranceData({ provider, memberId: "", isOther });
          addMessage("bot", `Got it: ${provider}. Now, what is your Member ID? (You can also skip this)`);
          setChatFlowStage("awaiting_manual_member_id");
        }} />;
      case 'selecting_multiple_procedures':
        return (
          <div className="p-2 space-y-2">
            <ProcedureSelector selected={selectedProcedures} onToggle={(proc) => setSelectedProcedures(prev => prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc])} />
            <button onClick={handleFullEstimate} className="w-full bg-green-600 text-white p-2 rounded-lg font-bold">Calculate Full Estimate</button>
          </div>
        );
      case 'estimate_only':
        return <QuickEstimateSelector onEstimate={handleQuickEstimate} />;
      case 'confirming_photo_details':
        return <ConfirmationButtons onConfirm={() => handleSend('yes')} onDeny={() => handleSend('no')} />;
      default:
        return (
          <div className="chat-input-row">
            <input className="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Reply to Kaysee..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
            <label htmlFor="fileUpload" className="upload-btn" title="Upload file" onClick={() => setUploadContext('general')}>📎</label>
            <button className="send-btn" onClick={() => handleSend()}>Send</button>
          </div>
        );
    }
  }

  return (
    <>
      {!isOpen && <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>💬</button>}
      {isOpen && (
        <div className={`chatbot-container${isMaximized ? " maximized" : ""}`}>
          <div className="chatbot-ui">
            <div className="chatbot-top-header">
              <div className="header-left"><button className="expand-btn" onClick={() => setIsMaximized((m) => !m)}><img src={expandIcon} alt="Toggle size" width={20} height={20} /></button></div>
              <div className="header-center"><img src={botProfile} alt="Bot Avatar" className="bot-avatar" /><div className="bot-details"><div className="bot-name">Kaysee</div><div className="bot-status">🟢 Online Now</div></div></div>
              <div className="header-right"><button className="minimize-btn" onClick={() => setIsOpen(false)}>✕</button></div>
            </div>
            <div className="messages-container">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} fade-in`}>
                  {msg.sender === "bot" && !msg.isImage && <img src={botProfile} alt="Bot Avatar" className="message-avatar" />}
                  {msg.isImage ? (
                    <img src={msg.text} alt="Uploaded content" className="chat-image-preview" style={{ maxWidth: '200px', borderRadius: '12px', marginTop: '5px' }} />
                  ) : (
                    <div className={`chat-message ${msg.sender}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <input type="file" accept="image/*" id="fileUpload" style={{ display: "none" }} onChange={handleFileSelect} ref={fileInputRef} />
            <div className="insurance-button-wrapper">
              <button className="insurance-start-btn" onClick={() => {
                addMessage("bot", "Got it! Would you like to:\n1. Enter full insurance info\n2. Get a quick estimate\n\nType 'full' or 'estimate'.");
                setChatFlowStage("choose_insurance_path");
              }}>🩺 Get Insurance Estimate</button>
            </div>
            {renderChatStageUI()}
          </div>
        </div>
      )}
    </>
  );
}
