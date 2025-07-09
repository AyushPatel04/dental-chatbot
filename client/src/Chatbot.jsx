import { useState, useRef, useEffect } from "react";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";
import { procedureCosts } from "./procedureCosts.js";

// --- Helper Components ---

const TypingIndicator = () => (
  <div className="message-row align-left">
    <img src={botProfile} alt="Bot Avatar" className="message-avatar" />
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

const MedicareMedicaidSelector = ({ onSelect }) => (
  <div className="flex justify-center gap-3 p-3">
    <button onClick={() => onSelect('Medicare')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold">Medicare</button>
    <button onClick={() => onSelect('Medicaid')} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold">Medicaid</button>
  </div>
);

const QuickMedicareEstimate = ({ onEstimate }) => {
  const [procedure, setProcedure] = useState("");
  return (
    <div className="p-4 space-y-3 bg-gray-100 rounded-lg">
      <select value={procedure} onChange={e => setProcedure(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
        <option value="">-- Select a Procedure --</option>
        {Object.keys(procedureCosts).map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <div className="flex justify-center gap-3">
        <button onClick={() => procedure && onEstimate(procedure, 'Medicare')} disabled={!procedure} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold disabled:bg-gray-400">Estimate with Medicare</button>
        <button onClick={() => procedure && onEstimate(procedure, 'Medicaid')} disabled={!procedure} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold disabled:bg-gray-400">Estimate with Medicaid</button>
      </div>
    </div>
  );
};

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
    <div className="p-4 space-y-3 bg-gray-100 rounded-lg">
      <select onChange={handleSelectChange} value={selection} className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-indigo-500">
        <option value="">-- Select Your Provider --</option>
        {providers.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      {selection === "Other" && (
        <div className="space-y-3">
          <input type="text" placeholder="Please type your provider name" value={otherValue} onChange={(e) => setOtherValue(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
          <button onClick={handleContinue} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200">Continue</button>
        </div>
      )}
    </div>
  );
};

const ProcedureSelector = ({ selected, onToggle, onCalculate }) => {
  const procedureGroups = [
    ['Routine Cleaning', 'Deep Cleaning'],
    ['Dental Exam', 'X-Ray (Bitewing)'],
    ['Fluoride Treatment', 'Oral Cancer Screening'],
    ['Filling (1 Surface)', 'Filling (2 Surfaces)'],
    ['Tooth Extraction (Simple)', 'Tooth Extraction (Surgical)'],
    ['Crown (Porcelain)', 'Crown (Metal)'],
    ['Root Canal (Front Tooth)', 'Root Canal (Molar)'],
    ['Dental Bridge', 'Implant (Single Tooth)'],
    ['Teeth Whitening (In-Office)', 'Sealant (Per Tooth)'],
    ['Mouth Guard (Night)'],
    ['Denture (Full Upper or Lower)'],
  ];

  return (
    <div className="procedure-overlay">
      <div className="procedure-modal">
        <p className="procedure-modal-title">Select Procedures</p>
        <div className="procedure-list">
          {procedureGroups.map((group, index) => (
            <div key={index} className="procedure-group">
              {group.map((proc) => {
                const isSelected = selected.includes(proc);
                return (
                  <button
                    key={proc}
                    onClick={() => onToggle(proc)}
                    className={`procedure-button ${isSelected ? 'selected' : ''}`}
                  >
                    {proc}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="calculate-button-container">
          <button onClick={onCalculate} className="calculate-button">
            Calculate Full Estimate
          </button>
        </div>
      </div>
    </div>
  );
};


const QuickEstimateSelector = ({ onEstimate }) => {
  const [procedure, setProcedure] = useState("");
  const [insurance, setInsurance] = useState("");
  const handleGetEstimate = () => {
    if (procedure && insurance) onEstimate(procedure, insurance);
    else alert("Please select both a procedure and an insurance provider.");
  };
  return (
    <div className="p-4 space-y-3 bg-gray-100 rounded-lg">
      <select value={procedure} onChange={e => setProcedure(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-indigo-500">
        <option value="">Select Procedure</option>
        {Object.keys(procedureCosts).map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={insurance} onChange={e => setInsurance(e.target.value)} disabled={!procedure} className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-indigo-500">
        <option value="">Select Insurance</option>
        {procedure && Object.keys(procedureCosts[procedure]).map(ins => <option key={ins} value={ins}>{ins}</option>)}
      </select>
      <button className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200" onClick={handleGetEstimate}>Get Quick Estimate</button>
    </div>
  );
};
const ConfirmationButtons = ({ onConfirm, onDeny }) => (
  <div className="flex justify-center gap-3 p-3">
    <button onClick={onConfirm} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200">👍 Yes, Correct</button>
    <button onClick={onDeny} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200">👎 No, Incorrect</button>
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
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [insuranceData, setInsuranceData] = useState({ provider: "", memberId: "", isOther: false });
  const [selectedProcedures, setSelectedProcedures] = useState([]);
  const [stagedFile, setStagedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadContext, setUploadContext] = useState('general');
  const [insuranceType, setInsuranceType] = useState(null);
  
  const [appointmentData, setAppointmentData] = useState({
    fullName: "", email: "", bookingDay: "", timeSlot: "",
    reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", notes: ""
  });

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
  
  const submitAppointment = async (finalData) => {
    setIsBotTyping(true);
    addMessage("bot", "Thank you! Submitting your appointment request...");
    addMessage("bot", "Your appointment request has been received! We will contact you shortly to confirm the details.");
    try {
        const res = await fetch("http://localhost:5050/book-appointment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalData),
        });
        if (!res.ok) throw new Error("Submission failed on the server.");
        
        addMessage("bot", "Your appointment request has been received! We will contact you shortly to confirm the details.");
    } catch (err) {
        console.error("Appointment submission failed:", err);
    } finally {
        setIsBotTyping(false);
        setChatFlowStage("start");
        setAppointmentData({
            fullName: "", email: "", bookingDay: "", timeSlot: "",
            reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", notes: ""
        });
        setInsuranceType(null);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsBotTyping(true);

    if (uploadContext === 'insurance') {
        addMessage("user", `Uploading insurance card: ${file.name}...`);
        const extractFormData = new FormData();
        extractFormData.append("image", file);
        try {
            const extractRes = await fetch("http://localhost:5050/extract-info", { method: "POST", body: extractFormData });
            const extractedData = await extractRes.json();
            if (!extractRes.ok) throw new Error(extractedData.error || "Extraction failed");
            
            const knownProviders = ["BrightSmile Basic", "ToothCare Plus", "HappyMouth Gold"];
            let foundProvider = knownProviders.find(p => extractedData.provider?.includes(p)) || extractedData.provider;
            
            setInsuranceData({ ...extractedData, provider: foundProvider, isOther: false });
            
            const confirmationText = `Please confirm the details from your card:\n- **Provider:** ${foundProvider}\n- **Member Name:** ${extractedData.memberName || "N/A"}\n- **Member ID:** ${extractedData.memberId || "N/A"}\n\nIs this information correct?`;
            addMessage("bot", confirmationText);
            setChatFlowStage("confirming_photo_details");

        } catch (err) {
            console.error("Upload process failed:", err);
            addMessage("bot", `Sorry, there was an error processing the image.`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = null;
            setUploadContext('general');
            setIsBotTyping(false);
        }
    } else {
        setStagedFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
        setIsBotTyping(false); 
    }
  };

  const handleFullEstimate = () => {
    if (selectedProcedures.length === 0) {
        addMessage("bot", "Please select at least one procedure.");
        return;
    }
    const { provider } = insuranceData;
    
    // Use provider name to determine if it's Medicare/Medicaid, not insuranceType state
    if (provider !== 'Medicare' && provider !== 'Medicaid') {
        let upfrontCost = 0;
        let afterCoverageCost = 0;

        selectedProcedures.forEach(proc => {
            const noInsuranceStr = procedureCosts[proc]["No Insurance"];
            const withInsuranceStr = procedureCosts[proc]?.[provider] || noInsuranceStr;
            
            upfrontCost += parseFloat(noInsuranceStr.replace(/[^0-9.-]+/g, ""));
            afterCoverageCost += parseFloat(withInsuranceStr.replace(/[^0-9.-]+/g, ""));
        });
        
        const finalMessage = `For non-Medicaid/Medicare plans, the full upfront cost is due at the time of service. After your insurance provider processes the claim, you will receive a check in the mail for the covered amount.\n\n` +
            `**Total Upfront Cost: $${upfrontCost.toFixed(2)}**\n` +
            `\nBased on your **${provider}** plan, your estimated cost after reimbursement would be:\n` +
            `**Total Estimated Cost (After Coverage): $${afterCoverageCost.toFixed(2)}**`;
        
        addMessage("bot", finalMessage);

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
    setInsuranceType(null);
  };
  
  const handleQuickEstimate = (procedure, insurance) => {
    addMessage("user", `Estimate for ${procedure} with ${insurance}`);
    setIsBotTyping(true);
    const cost = procedureCosts[procedure][insurance];

    // Use insurance name to determine if it's Medicare/Medicaid, not insuranceType state
    if (insurance !== 'Medicare' && insurance !== 'Medicaid') {
        const upfrontCost = procedureCosts[procedure]["No Insurance"];
        const privateMessage = `The full upfront cost for a ${procedure} is **${upfrontCost}**. ` +
            `After your insurance coverage is applied and processed, your final estimated cost will be **${cost}**. ` +
            `You will receive the difference as a reimbursement check in the mail.`;
        addMessage("bot", privateMessage);
    } else {
        addMessage("bot", `The estimated cost for a ${procedure} with ${insurance} is **${cost}**.`);
    }
    
    setIsBotTyping(false);
    setChatFlowStage("start");
    setInsuranceType(null);
  };

  const handleSend = async (overrideText) => {
    const userMessage = overrideText ?? input.trim();
    if (!userMessage && !stagedFile) return;

    if (stagedFile) {
        if (userMessage) {
            addMessage("user", userMessage);
        }
        addMessage("user", imagePreviewUrl, true);

        setInput("");
        setImagePreviewUrl('');
        const fileToUpload = stagedFile;
        setStagedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;

        setIsBotTyping(true);

        const formData = new FormData();
        formData.append("image", fileToUpload);

        try {
            const uploadRes = await fetch("http://localhost:5050/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.error || 'File upload failed');
            }
            const { url: imageUrl } = await uploadRes.json();
            if (!imageUrl) throw new Error("File URL not received.");

            const prompt = userMessage || "Please analyze this image from a dental perspective.";
            const chatRes = await fetch("http://localhost:5050/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: prompt, imageUrl }),
            });
            const { reply, error } = await chatRes.json();
            if(error) throw new Error(error);
            addMessage("bot", reply);
        } catch (err) {
            console.error("Image chat process failed:", err);
            addMessage("bot", `Sorry, there was an error: ${err.message}`);
        } finally {
            setIsBotTyping(false);
        }
        return;
    }

    if (!userMessage) return;
    addMessage("user", userMessage);
    setInput("");
    setIsBotTyping(true);
    const lowered = userMessage.toLowerCase();
    const affirmativeResponses = ["yes", "yup", "yeah", "correct", "sure", "ok", "yep", "indeed", "right", "confirm"];
    
    if (chatFlowStage === "start" && (lowered.includes("appointment") || lowered.includes("book"))) {
        addMessage("bot", "Have you visited us before and already completed our pre-registration forms? (yes/no)");
        setChatFlowStage("awaiting_returning_patient_status");
        setIsBotTyping(false);
        return;
    }

    if (chatFlowStage === "awaiting_returning_patient_status") {
        if (affirmativeResponses.includes(lowered)) {
            addMessage("bot", "Welcome back! Let's get you booked. First, what is your full name?");
            setChatFlowStage("booking_start");
        } else {
            addMessage("bot", "To save time during your visit, would you like to fill out our pre-registration forms now? (yes/no)");
            setChatFlowStage("awaiting_prereg_decision");
        }
        setIsBotTyping(false);
        return;
    }
    
    if (chatFlowStage === "awaiting_medicare_decision") {
        if (affirmativeResponses.includes(lowered)) {
            setInsuranceType('medicare_medicaid');
        } else {
            setInsuranceType('private');
        }
        addMessage("bot", "Got it! Would you like to get a 'full' insurance estimate for multiple procedures, or a 'quick' one for a single item? (Type 'full' or 'estimate')");
        setChatFlowStage("choose_insurance_path");
        setIsBotTyping(false);
        return;
    }

    if (chatFlowStage === "awaiting_prereg_decision") {
        const bookingMessage = `To book your appointment, you can use our secure online portal here: <a href="https://forms.gle/k1kHBp6HDrHpre1aA" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Book Online</a>. \n\nIf you'd prefer, I can assist you with booking right here. Just say "assist me".`;

        if (affirmativeResponses.includes(lowered)) {
            addMessage("bot", `Great! You can complete your pre-registration forms here to save time: <a href="/fake-prereg-form" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Pre-Registration Form</a>.`);
            addMessage("bot", `Once that's done, let's get you booked. ${bookingMessage}`);
        } else {
            addMessage("bot", `No problem. ${bookingMessage}`);
        }
        setChatFlowStage("awaiting_booking_method");
        setIsBotTyping(false);
        return;
    }

    if (chatFlowStage === "awaiting_booking_method") {
        if (lowered.includes("assist") || lowered.includes("help")) {
            addMessage("bot", "Of course. I can help you book an appointment. First, what is your full name?");
            setChatFlowStage("booking_start");
        } else {
             addMessage("bot", "No problem, you can use the link when you're ready or let me know if you need anything else!");
             setChatFlowStage("start");
        }
        setIsBotTyping(false);
        return;
    }

    if (chatFlowStage.startsWith('booking_')) {
      switch (chatFlowStage) {
        case 'booking_start':
            setAppointmentData(prev => ({ ...prev, fullName: userMessage }));
            addMessage("bot", "Thanks! What is your email address?");
            setChatFlowStage('booking_ask_email');
            break;
        case 'booking_ask_email':
            if (!/^\S+@\S+\.\S+$/.test(userMessage)) {
                addMessage("bot", "That doesn't look like a valid email. Could you please enter a valid email address?");
                break;
            }
            setAppointmentData(prev => ({ ...prev, email: userMessage }));
            addMessage("bot", "Great. What day would you like to book? (e.g., MM/DD/YYYY or 'next Tuesday')");
            setChatFlowStage('booking_ask_day');
            break;
        case 'booking_ask_day':
            setAppointmentData(prev => ({ ...prev, bookingDay: userMessage }));
            addMessage("bot", "And what time would be preferred? (e.g., 'morning', 'afternoon', or a specific time)");
            setChatFlowStage('booking_ask_time');
            break;
        case 'booking_ask_time':
            setAppointmentData(prev => ({ ...prev, timeSlot: userMessage }));
            addMessage("bot", "Is this visit for an Urgent matter or a General check-up?");
            setChatFlowStage('booking_ask_reason_category');
            break;
        case 'booking_ask_reason_category':
            setAppointmentData(prev => ({ ...prev, reasonCategory: userMessage }));
            addMessage("bot", `Understood. Please briefly describe the reason for your ${userMessage} visit.`);
            setChatFlowStage('booking_ask_reason');
            break;
        case 'booking_ask_reason':
            setAppointmentData(prev => ({ ...prev, reason: userMessage }));
            addMessage("bot", "Do you have dental insurance? (yes/no)");
            setChatFlowStage('booking_ask_has_insurance');
            break;
        case 'booking_ask_has_insurance':
            if (affirmativeResponses.includes(lowered)) {
                setAppointmentData(prev => ({ ...prev, hasInsurance: true }));
                addMessage("bot", "Okay. Who is your insurance provider?");
                setChatFlowStage('booking_ask_insurance_provider');
            } else {
                setAppointmentData(prev => ({ ...prev, hasInsurance: false, insuranceProvider: "N/A" }));
                addMessage("bot", "Understood. Is there anything else you'd like us to know? (Type 'skip' if not)");
                setChatFlowStage('booking_ask_notes');
            }
            break;
        case 'booking_ask_insurance_provider':
            setAppointmentData(prev => ({ ...prev, insuranceProvider: userMessage }));
            addMessage("bot", "Got it. Lastly, is there anything else you'd like us to know? (Type 'skip' if not)");
            setChatFlowStage('booking_ask_notes');
            break;
        case 'booking_ask_notes':
            const finalData = { ...appointmentData, notes: userMessage.toLowerCase() === 'skip' ? 'N/A' : userMessage };
            setAppointmentData(finalData);
            
            const summary = `Please confirm your details:\n` +
                `- **Name:** ${finalData.fullName}\n` +
                `- **Email:** ${finalData.email}\n` +
                `- **Date:** ${finalData.bookingDay}\n` +
                `- **Time:** ${finalData.timeSlot}\n` +
                `- **Visit Type:** ${finalData.reasonCategory}\n` +
                `- **Reason:** ${finalData.reason}\n` +
                `- **Insurance:** ${finalData.hasInsurance ? `Yes (${finalData.insuranceProvider})` : 'No'}\n` +
                `- **Notes:** ${finalData.notes}\n\n` +
                `Is this all correct? (yes/no)`;
            addMessage("bot", summary);
            setChatFlowStage('booking_confirm');
            break;
        case 'booking_confirm':
            if (affirmativeResponses.includes(lowered)) {
                submitAppointment(appointmentData);
            } else {
                addMessage("bot", "I'm sorry about that. Let's start over to make sure we get it right. What is your full name?");
                setAppointmentData({ fullName: "", email: "", bookingDay: "", timeSlot: "", reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", notes: "" });
                setChatFlowStage('booking_start');
                setInsuranceType(null); // Reset
            }
            break;
        default:
            setChatFlowStage("start");
            break;
      }
      setIsBotTyping(false);
      return; 
    }

    if (chatFlowStage === "choose_insurance_path") {
      if (lowered === 'full') {
          if (insuranceType === 'medicare_medicaid') {
              addMessage("bot", "Understood. Please select whether you have Medicare or Medicaid below.");
              setChatFlowStage('selecting_medicaid_type_full');
          } else {
              addMessage("bot", "Great. Would you like to upload a photo of your insurance card or enter the details manually?");
              setChatFlowStage("awaiting_upload_or_manual");
          }
      } else if (lowered === 'estimate') {
          if (insuranceType === 'medicare_medicaid') {
              addMessage("bot", "No problem! Please select a procedure below to get a quick estimate.");
              setChatFlowStage('medicaid_quick_estimate');
          } else {
              addMessage("bot", "No problem! Please select a procedure and your insurance from the dropdowns below to get a quick cost estimate.");
              setChatFlowStage("estimate_only");
          }
      }
      setIsBotTyping(false);
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
      setIsBotTyping(false);
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
      setIsBotTyping(false);
      return;
    }
    if (chatFlowStage === "awaiting_manual_member_id") {
      setInsuranceData(prev => ({ ...prev, memberId: userMessage }));
      addMessage("bot", "Thanks! Your insurance info is complete. Now, please select the procedure(s) you're interested in.");
      setChatFlowStage("selecting_multiple_procedures");
      setIsBotTyping(false);
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
    } finally {
        setIsBotTyping(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);
  
  const renderChatStageUI = () => {
    if (chatFlowStage === 'selecting_multiple_procedures') {
        return (
            <ProcedureSelector 
                selected={selectedProcedures} 
                onToggle={(proc) => setSelectedProcedures(prev => 
                    prev.includes(proc) 
                        ? prev.filter(p => p !== proc) 
                        : [...prev, proc]
                )} 
                onCalculate={handleFullEstimate}
            />
        );
    }
    
    const showOnlyTextInput = chatFlowStage.startsWith('booking_') || 
                              ['awaiting_prereg_decision', 'awaiting_booking_method', 'awaiting_medicare_decision', 'choose_insurance_path', 'awaiting_manual_member_id', 'awaiting_returning_patient_status'].includes(chatFlowStage);
    
    if (showOnlyTextInput && chatFlowStage !== 'booking_ask_reason_category') {
        return (
            <div className="chat-input-row">
                <input className="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your answer..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                <button className="send-btn" onClick={() => handleSend()}>Send</button>
            </div>
        );
    }

    switch(chatFlowStage) {
      case 'booking_ask_reason_category':
        return (
            <div className="flex justify-center gap-2 p-2">
                <button onClick={() => handleSend('Urgent')} className="flex-1 bg-red-500 text-white p-2 rounded-lg font-bold">🚨 Urgent</button>
                <button onClick={() => handleSend('General')} className="flex-1 bg-blue-500 text-white p-2 rounded-lg font-bold">🗓️ General</button>
            </div>
        );
      case 'selecting_medicaid_type_full':
        return <MedicareMedicaidSelector onSelect={(type) => {
          addMessage("user", type);
          setInsuranceData({ provider: type, memberId: "", isOther: false });
          addMessage("bot", `Great, you've selected ${type}. Now please choose the procedures you're interested in.`);
          setChatFlowStage("selecting_multiple_procedures");
        }} />;
      case 'medicaid_quick_estimate':
        return <QuickMedicareEstimate onEstimate={handleQuickEstimate} />;
      case 'awaiting_upload_or_manual':
        return (
          <div className="flex justify-center gap-2 p-2">
            <button onClick={() => { setUploadContext('insurance'); fileInputRef.current.click(); }} className="flex-1 bg-blue-500 text-white p-2 rounded-lg font-bold">📷 Upload Photo</button>
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
                <div key={i} className={`message-row ${msg.sender === "user" ? "align-right" : "align-left"} ${msg.sender === 'user' ? 'user-fade-in' : 'fade-in'}`}>
                  {msg.sender === "bot" && !msg.isImage && <img src={botProfile} alt="Bot Avatar" className="message-avatar" />}
                  {msg.isImage ? (
                    <img src={msg.text} alt="Uploaded content" className="chat-image-preview" style={{ maxWidth: '200px', borderRadius: '12px', marginTop: '5px' }} />
                  ) : (
                    <div className={`chat-message ${msg.sender}`} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
                  )}
                </div>
              ))}
              {isBotTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
            <input type="file" accept="image/*" id="fileUpload" style={{ display: "none" }} onChange={handleFileSelect} ref={fileInputRef} />
            {imagePreviewUrl && (
                <div className="preview-image-wrapper">
                    <div className="preview-image-box">
                        <img src={imagePreviewUrl} alt="Preview" className="preview-img-small" />
                        <button
                            className="preview-remove-btn"
                            onClick={() => {
                                setImagePreviewUrl('');
                                setStagedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = null;
                            }}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
            { chatFlowStage === 'start' && (
              <div className="insurance-button-wrapper">
                <button className="insurance-start-btn" onClick={() => {
                  addMessage("bot", "Before we proceed, could you please confirm if you are covered by Medicare or Medicaid? (yes/no)");
                  setChatFlowStage("awaiting_medicare_decision");
                }}>🩺 Get Insurance Estimate</button>
              </div>
            )}
            {renderChatStageUI()}
          </div>
        </div>
      )}
    </>
  );
}