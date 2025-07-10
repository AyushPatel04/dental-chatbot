import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import expandIcon from "./assets/expand.png";
import botProfile from "./assets/botProfile.png";
import { procedureCosts } from "./procedureCosts.js";

// --- Configuration ---
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

// --- Helper Functions & Components ---

// Standardize date to YYYY-MM-DD to avoid localization issues
const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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

const AppointmentScheduler = ({ onDateSelect }) => (
    <div className="p-4 bg-gray-100 rounded-lg">
        <DatePicker
            selected={null}
            onChange={(date) => onDateSelect(date)}
            inline
            minDate={new Date()}
            calendarClassName="appointment-calendar"
        />
    </div>
);

const TimeSlotSelector = ({ onTimeSelect, bookedSlots }) => {
    const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
    return (
        <div className="p-4 bg-gray-100 rounded-lg">
            <div className="time-slot-grid">
                {timeSlots.map(time => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                        <button
                            key={time}
                            onClick={() => !isBooked && onTimeSelect(time)}
                            className={`time-slot-btn ${isBooked ? 'booked' : ''}`}
                            disabled={isBooked}
                        >
                            {time}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ReasonCategorySelector = ({ onSelect }) => (
    <div className="flex justify-center gap-3 p-3">
        <button onClick={() => onSelect('Urgent')} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold">🚨 Urgent</button>
        <button onClick={() => onSelect('General')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-bold">🗓️ General</button>
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

    const privateInsuranceOptions = procedure ? Object.keys(procedureCosts[procedure]).filter(ins => ins !== "Medicare" && ins !== "Medicaid") : [];

    return (
        <div className="p-4 space-y-3 bg-gray-100 rounded-lg">
            <select value={procedure} onChange={e => setProcedure(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Procedure</option>
                {Object.keys(procedureCosts).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={insurance} onChange={e => setInsurance(e.target.value)} disabled={!procedure} className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Insurance</option>
                {privateInsuranceOptions.map(ins => <option key={ins} value={ins}>{ins}</option>)}
            </select>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200" onClick={handleGetEstimate}>Get Quick Estimate</button>
        </div>
    );
};

const ConfirmationButtons = ({ onConfirm, onDeny, yesText = "👍 Yes", noText = "👎 No" }) => (
    <div className="flex justify-center gap-3 p-3">
        <button onClick={onConfirm} className="flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200">{yesText}</button>
        <button onClick={onDeny} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold text-base transition-colors duration-200">{noText}</button>
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
    const [uploadContext, setUploadContext] = useState('general');
    const [insuranceType, setInsuranceType] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);

    const [appointmentData, setAppointmentData] = useState({
        fullName: "", email: "", bookingDay: "", timeSlot: "",
        reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", memberId: "", notes: ""
    });

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const logConversation = async (userMsg, botMsg) => {
        try {
            await fetch(`${API_URL}/log`, {
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
            if (lastUserMessage) logConversation(lastUserMessage.text, text);
        }
    };

    const submitAppointment = async (finalData) => {
        setIsBotTyping(true);
        addMessage("bot", "Thank you! Submitting your appointment request...");
        try {
            const res = await fetch(`${API_URL}/book-appointment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Submission failed on the server.");
            }
            addMessage("bot", "Your appointment request has been received! We will contact you shortly to confirm the details.");
        } catch (err) {
            console.error("Appointment submission failed:", err);
            addMessage("bot", `There was an error submitting your request: ${err.message}`);
        } finally {
            setIsBotTyping(false);
            setChatFlowStage("start");
            setAppointmentData({
                fullName: "", email: "", bookingDay: "", timeSlot: "",
                reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", memberId: "", notes: ""
            });
            setInsuranceType(null);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            addMessage("bot", "Sorry, the image must be 5MB or less.");
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
            const imageDataUrl = event.target.result;
            addMessage("user", imageDataUrl, true); // Show image preview in chat
            setIsBotTyping(true);

            try {
                if (uploadContext === 'insurance') {
                    const extractRes = await fetch(`${API_URL}/extract-info`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ imageDataUrl }),
                    });
                    const extractedData = await extractRes.json();
                    if (!extractRes.ok) throw new Error(extractedData.error || "Extraction failed");

                    const knownProviders = ["BrightSmile Basic", "ToothCare Plus", "HappyMouth Gold", "Medicare", "Medicaid"];
                    let foundProvider = knownProviders.find(p => extractedData.provider.toLowerCase().includes(p.toLowerCase())) || extractedData.provider;
                    setInsuranceData({ ...extractedData, provider: foundProvider, isOther: false });

                    const confirmationText = `Please confirm the details from your card:\n- **Provider:** ${foundProvider}\n- **Member Name:** ${extractedData.memberName || "N/A"}\n- **Member ID:** ${extractedData.memberId || "N/A"}\n\nIs this information correct?`;
                    addMessage("bot", confirmationText);
                    setChatFlowStage("confirming_photo_details");

                } else { // 'general' context
                    const chatRes = await fetch(`${API_URL}/chat`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: input, imageDataUrl }),
                    });
                    const { reply } = await chatRes.json();
                    addMessage("bot", reply);
                    setInput("");
                }
            } catch (err) {
                console.error("Image processing failed:", err);
                addMessage("bot", `Sorry, there was an error processing the image: ${err.message}`);
            } finally {
                setIsBotTyping(false);
                if (fileInputRef.current) fileInputRef.current.value = null;
                setUploadContext('general');
            }
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            addMessage("bot", "Sorry, there was an issue reading the selected file.");
        };
    };

    const handleFullEstimate = () => {
        if (selectedProcedures.length === 0) {
            addMessage("bot", "Please select at least one procedure.");
            return;
        }
        const { provider } = insuranceData;

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
        if (!userMessage) return;
        addMessage("user", userMessage);
        setInput("");
        setIsBotTyping(true);
        const lowered = userMessage.toLowerCase();
        const affirmativeResponses = ["yes", "yup", "yeah", "correct", "sure", "ok", "yep", "indeed", "right", "confirm"];
        
        const newPatientBookingLink = "https://mycw198.ecwcloud.com/portal24942/jsp/jspnew/preRegistration_new.jsp";
        const returningPatientBookingLink = "https://mycw198.ecwcloud.com/portal24942/jsp/100mp/login_otp.jsp";
        const preregFormLink = "https://kansascity.wufoo.com/forms/kcucdm-prospective-patient-inquiry-form/";

        const newPatientBookingMessage = `To book your appointment, you can use our secure online portal here: <a href="${newPatientBookingLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Book Online</a>. \n\nIf you'd prefer, I can assist you with booking right here. Just say "assist me".`;
        const returningPatientBookingMessage = `To book your appointment, you can use our secure online portal for returning patients here: <a href="${returningPatientBookingLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Book Online</a>. \n\nIf you'd prefer, I can assist you with booking right here. Just say "assist me".`;

        if (chatFlowStage === "start" && (lowered.includes("appointment") || lowered.includes("book"))) {
            addMessage("bot", "Have you visited us before and already completed our pre-registration forms? (yes/no)");
            setChatFlowStage("awaiting_returning_patient_status");
            setIsBotTyping(false);
            return;
        }

        if (chatFlowStage === "awaiting_returning_patient_status") {
            if (affirmativeResponses.includes(lowered)) {
                addMessage("bot", `Welcome back! Your forms should be on file. ${returningPatientBookingMessage}`);
                setChatFlowStage("awaiting_booking_method");
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
            if (affirmativeResponses.includes(lowered)) {
                addMessage("bot", `Great! You can complete your pre-registration forms here to save time: <a href="${preregFormLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">Pre-Registration Form</a>.`);
                addMessage("bot", `Once that's done, let's get you booked. ${newPatientBookingMessage}`);
            } else {
                addMessage("bot", `No problem. ${newPatientBookingMessage}`);
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
                    addMessage("bot", "Great. Please select a day for your appointment from the calendar below.");
                    setChatFlowStage('booking_ask_day');
                    break;
                case 'booking_ask_reason':
                    setAppointmentData(prev => ({ ...prev, reason: userMessage }));
                    addMessage("bot", "Do you have dental insurance? (yes/no)");
                    setChatFlowStage('booking_ask_has_insurance');
                    break;
                case 'booking_ask_has_insurance':
                    if (affirmativeResponses.includes(lowered)) {
                        setAppointmentData(prev => ({ ...prev, hasInsurance: true }));
                        addMessage("bot", "Are you covered by Medicare or Medicaid?");
                        setChatFlowStage('booking_ask_insurance_type');
                    } else {
                        setAppointmentData(prev => ({ ...prev, hasInsurance: false, insuranceProvider: "N/A", memberId: "N/A" }));
                        addMessage("bot", "Understood. Lastly, is there anything else you'd like us to know for your appointment booking? (e.g., specific concerns, accessibility needs). Type 'skip' if not.");
                        setChatFlowStage('booking_ask_notes');
                    }
                    break;
                case 'booking_ask_insurance_type':
                     if (affirmativeResponses.includes(lowered)) {
                        setChatFlowStage('booking_select_medicaid_type');
                    } else {
                        addMessage("bot", "Please select your insurance provider from the list below, or choose 'Other' to type it in.");
                        setChatFlowStage('booking_select_private_provider');
                    }
                    break;
                case 'booking_ask_member_id':
                    setAppointmentData(prev => ({...prev, memberId: userMessage}));
                    addMessage("bot", "Got it. Lastly, is there anything else you'd like us to know for your appointment booking? (e.g., specific concerns, accessibility needs). Type 'skip' if not.");
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
                        `- **Insurance:** ${finalData.hasInsurance ? `Yes (${finalData.insuranceProvider}, ID: ${finalData.memberId})` : 'No'}\n` +
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
                        setAppointmentData({ fullName: "", email: "", bookingDay: "", timeSlot: "", reasonCategory: "", reason: "", hasInsurance: null, insuranceProvider: "", memberId: "", notes: "" });
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
                addMessage("bot", "Great. Would you like to upload a photo of your insurance card or enter the details manually?");
                setChatFlowStage("awaiting_upload_or_manual");
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
                if(insuranceType === 'medicare_medicaid') {
                    setChatFlowStage("awaiting_manual_medicare_type");
                } else {
                    addMessage("bot", "Please select your insurance provider from the list below.");
                    setChatFlowStage("awaiting_manual_provider");
                }
            }
            setIsBotTyping(false);
            return;
        }

        if (chatFlowStage === "awaiting_manual_member_id_estimate") {
            setInsuranceData(prev => ({ ...prev, memberId: userMessage }));
            addMessage("bot", "Thanks! Your insurance info is complete. Now, please select the procedure(s) you're interested in.");
            setChatFlowStage("selecting_multiple_procedures");
            setIsBotTyping(false);
            return;
        }

        if (chatFlowStage === "confirming_photo_details") {
            if (affirmativeResponses.includes(lowered)) {
                addMessage("bot", "Excellent! Now, please select the procedure(s) you're interested in.");
                setChatFlowStage("selecting_multiple_procedures");
            } else {
                addMessage("bot", "No problem. Let's enter the details manually.");
                setInsuranceData({ provider: "", memberId: "", isOther: false });
                if(insuranceType === 'medicare_medicaid') {
                    setChatFlowStage("awaiting_manual_medicare_type");
                } else {
                    setChatFlowStage("awaiting_manual_provider");
                }
            }
            setIsBotTyping(false);
            return;
        }
        
        try {
            const res = await fetch(`${API_URL}/chat`, {
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

        if (chatFlowStage === 'booking_ask_day') {
            return <AppointmentScheduler onDateSelect={async (date) => {
                const formattedDate = date.toLocaleDateString('en-US'); // Display format
                const apiFormattedDate = formatDateForAPI(date); // API format YYYY-MM-DD
                addMessage("user", formattedDate);
                setIsBotTyping(true);
                try {
                    const res = await fetch(`${API_URL}/get-booked-slots?date=${encodeURIComponent(apiFormattedDate)}`);
                    const booked = await res.json();
                    if (!res.ok) throw new Error("Failed to get available slots.");
                    
                    setBookedSlots(booked);
                    setAppointmentData(prev => ({ ...prev, bookingDay: apiFormattedDate }));
                    addMessage("bot", "Perfect. Please select an available time.");
                    setChatFlowStage('booking_ask_time');
                } catch (error) {
                    addMessage("bot", "Sorry, I couldn't check for available times. Please try again.");
                } finally {
                    setIsBotTyping(false);
                }
            }} />;
        }

        if (chatFlowStage === 'booking_ask_time') {
            return <TimeSlotSelector
                bookedSlots={bookedSlots}
                onTimeSelect={(time) => {
                    addMessage("user", time);
                    setAppointmentData(prev => ({ ...prev, timeSlot: time }));
                    addMessage("bot", "Is this visit for an Urgent matter or a General check-up?");
                    setChatFlowStage('booking_ask_reason_category');
                }}
            />;
        }

        if (chatFlowStage === 'booking_ask_reason_category') {
            return <ReasonCategorySelector onSelect={(category) => {
                addMessage("user", category);
                setAppointmentData(prev => ({ ...prev, reasonCategory: category }));
                addMessage("bot", `Understood. Please briefly describe the reason for your ${category} visit. (ex: tooth pain, check-up, broken wire)`);
                setChatFlowStage('booking_ask_reason');
            }} />;
        }

        if (chatFlowStage === 'booking_ask_insurance_type') {
            return <ConfirmationButtons onConfirm={() => handleSend("yes")} onDeny={() => handleSend("no")} />;
        }

        if (chatFlowStage === 'booking_select_medicaid_type') {
            return <MedicareMedicaidSelector onSelect={(type) => {
                addMessage("user", type);
                setAppointmentData(prev => ({...prev, insuranceProvider: type}));
                addMessage("bot", `Got it: ${type}. Now, what is your Member ID?`);
                setChatFlowStage('booking_ask_member_id');
            }} />
        }

        if (chatFlowStage === 'booking_select_private_provider') {
            return <InsuranceProviderSelector onSelectProvider={(provider) => {
                addMessage("user", provider);
                setAppointmentData(prev => ({...prev, insuranceProvider: provider}));
                addMessage("bot", `Got it: ${provider}. Now, what is your Member ID?`);
                setChatFlowStage("booking_ask_member_id");
            }} />;
        }

        const showOnlyTextInput = chatFlowStage.startsWith('booking_') ||
            ['awaiting_returning_patient_status', 'awaiting_prereg_decision', 'awaiting_booking_method', 'awaiting_medicare_decision', 'choose_insurance_path', 'awaiting_manual_member_id_estimate'].includes(chatFlowStage);


        if (showOnlyTextInput) {
            return (
                <div className="chat-input-row">
                    <input className="chat-input" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your answer..." onKeyDown={(e) => e.key === "Enter" && handleSend()} />
                    <button className="send-btn" onClick={() => handleSend()}>Send</button>
                </div>
            );
        }

        switch (chatFlowStage) {
            case 'awaiting_manual_medicare_type':
                 return <MedicareMedicaidSelector onSelect={(type) => {
                    addMessage("user", type);
                    setInsuranceData({ provider: type, memberId: "", isOther: false });
                    addMessage("bot", `Great, you've selected ${type}. Now, what is your Member ID?`);
                    setChatFlowStage("awaiting_manual_member_id_estimate");
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
                    addMessage("bot", `Got it: ${provider}. Now, what is your Member ID?`);
                    setChatFlowStage("awaiting_manual_member_id_estimate");
                }} />;
            case 'estimate_only':
                return <QuickEstimateSelector onEstimate={handleQuickEstimate} />;
            case 'confirming_photo_details':
                return <ConfirmationButtons onConfirm={() => handleSend('yes')} onDeny={() => handleSend('no')} yesText="👍 Yes, Correct" noText="👎 No, Incorrect" />;
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
                        {chatFlowStage === 'start' && (
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