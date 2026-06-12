import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import {
  Camera, ImagePlus, X, Search,
  Leaf, AlertTriangle, ShieldAlert, CheckCircle,
  History, Loader2, ArrowRight, Zap,
  LogOut, LayoutDashboard, Store, Package, MapPin, Truck, UserCircle,
  ScanLine, MessageCircle, Bot, Send // এই আইকনগুলো মিসিং ছিল, এখন যোগ করা হয়েছে
} from "lucide-react";
import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const OR_KEY        = import.meta.env.VITE_OPENROUTER_API_KEY;

// ✅ Best model আগে — fastest & most accurate
const FREE_VISION_MODELS = [
  "qwen/qwen2.5-vl-72b-instruct",
  "meta-llama/llama-4-maverick",
  "meta-llama/llama-3.2-11b-vision-instruct",
];

const severityConfig = {
  "সুস্থ": {
    bg: "bg-green-50/80", border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    icon: <CheckCircle className="w-8 h-8 text-green-500" />,
    bar: "from-green-400 to-emerald-500",
  },
  "মাঝারি": {
    bg: "bg-orange-50/80", border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    icon: <AlertTriangle className="w-8 h-8 text-orange-500" />,
    bar: "from-orange-400 to-amber-500",
  },
  "গুরুতর": {
    bg: "bg-red-50/80", border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
    bar: "from-red-400 to-rose-500",
  },
};

/* ── Logo ── */
function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-lg text-xl font-black shadow-sm -rotate-3 inline-block">Agro</span>
      <span className="text-xl font-black text-gray-800 tracking-tight">Doc.</span>
    </div>
  );
}

/* ── Desktop Sidebar ── */
function Sidebar({ user, displayName, navigate }) {
  const navItems = [
    { label:"ড্যাশবোর্ড",   icon:<LayoutDashboard size={16}/>, path:"/"          },
    { label:"স্ক্যান করুন",  icon:<ScanLine size={16}/>,        path:"/scanner"  },
    { label:"ইতিহাস",       icon:<History size={16}/>,         path:"/history"  },
    { label:"দোকান",        icon:<Store size={16}/>,           path:"/shop"     },
    { label:"আমার অর্ডার",  icon:<Package size={16}/>,         path:"/orders"   },
    { label:"কৃষি এজেন্সি", icon:<Truck size={16}/>,           path:"/agro-agency"   },
    { label:"ঠিকানা বই",    icon:<MapPin size={16}/>,          path:"/address-book" },
    { label:"প্রোফাইল",     icon:<UserCircle size={16}/>,      path:"/profile"  },
  ];
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm z-40 py-5 px-3 overflow-y-auto scrollbar-none">
      <div className="px-3 mb-7"><Logo/></div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = window.location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                active
                  ? "bg-green-50 text-green-700 border-l-4 border-green-500 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-4 border-transparent"
              }`}>
              <span className={active ? "text-green-600" : "text-gray-400"}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 pt-3 mt-4">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            {user?.photoURL ? <img src={user.photoURL} className="w-full h-full rounded-lg object-cover" alt="av"/> : <UserCircle size={16} className="text-white"/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{displayName}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.phoneNumber || user?.email || ""}</p>
          </div>
          <button onClick={() => signOut(auth)} className="w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors flex-shrink-0">
            <LogOut size={13} className="text-red-500"/>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── AgroBot Chatbot Component ── */
function AgroBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "আস-সালামু আলাইকুম! আমি AgroBot। আপনার কৃষি বা ফসল সম্পর্কিত যেকোনো প্রশ্ন করুন — আমি সবসময় বাংলায় উত্তর দেব। 🌿" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const SYSTEM_PROMPT = `তুমি AgroBot — বাংলাদেশের কৃষকদের জন্য একটি বিশেষজ্ঞ AI সহকারী।
  গুরুত্বপূর্ণ নিয়ম:
  - সবসময় বাংলায় উত্তর দাও। কোনো অবস্থাতেই ইংরেজিতে উত্তর দেবে না।
  - সহজ, সংক্ষিপ্ত ও বাস্তব উত্তর দাও যা সাধারণ কৃষকরা বুঝতে পারবেন।
  - ফসলের রোগ-বালাই, সার, কীটনাশক, সেচ, বীজ, মাটি, আবহাওয়া এবং কৃষি পরামর্শ দাও।
  - উত্তর ৩-৬ বাক্যের মধ্যে রাখো।
  - কখনো ইংরেজিতে উত্তর দেবে না, এমনকি প্রশ্ন ইংরেজিতে হলেও বাংলায় উত্তর দাও।`;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    const apiMessages = updatedMessages.slice(1).map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "AgroDoc AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...apiMessages
          ],
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        setMessages(prev => [...prev, { role: "assistant", content: data.choices[0].message?.content || "দুঃখিত, উত্তর পাওয়া যায়নি।" }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "নেটওয়ার্ক সমস্যা হয়েছে! একটু পর আবার চেষ্টা করুন। 🙏" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[60] flex items-center justify-center w-[54px] h-[54px] bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-500/40 text-white transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'} bottom-24 right-5 lg:bottom-8 lg:right-8`}>
        <MessageCircle size={26} />
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] lg:hidden transition-opacity" onClick={() => setIsOpen(false)} />}

      <div className={`fixed z-[70] flex flex-col bg-[#f8f9fa] overflow-hidden transition-all duration-500 shadow-2xl shadow-gray-900/20
          inset-x-0 bottom-0 w-full h-[82vh] rounded-t-[32px] origin-bottom
          lg:inset-x-auto lg:bottom-8 lg:right-8 lg:w-[380px] lg:h-[600px] lg:max-h-[85vh] lg:rounded-3xl lg:origin-bottom-right lg:border lg:border-gray-200
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-full lg:translate-y-10 pointer-events-none'}`}>
        
        <div className="bg-white rounded-t-[32px] lg:rounded-t-3xl border-b border-gray-100 shrink-0">
          <div className="p-4 pt-4 lg:pt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <Bot size={20} className="text-green-500" />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-sm">AgroBot AI</h3>
                <p className="text-green-600 text-[10px] font-semibold">আপনার সেবায় প্রস্তুত</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-green-600 text-white rounded-br-sm" : "bg-white text-gray-700 border border-gray-100 rounded-bl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs text-gray-400 bg-white inline-block p-2 rounded-lg border">টাইপ করছে...</div>}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="p-3 bg-white border-t border-gray-100 lg:p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#f4f5f7] p-1.5 rounded-full focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-sm transition-all border border-transparent">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="আপনার প্রশ্ন..." className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm text-gray-700 w-full" />
            <button type="submit" disabled={!input.trim() || isTyping} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${input.trim() && !isTyping ? 'bg-green-600 text-white hover:scale-105' : 'bg-gray-200 text-gray-400'}`}>
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

async function compressImage(file, maxWidth = 512, quality = 0.75) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = url;
  });
}

async function fetchWithTimeout(url, options, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

async function saveInBackground({ file, preview, user, aiData, confidencePercentage }) {
  try {
    let imageUrl = preview;
    if (CLOUD_NAME && UPLOAD_PRESET) {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
      const data = await res.json();
      imageUrl = data.secure_url || preview;
    }

    if (user?.uid) {
      await addDoc(collection(db, "scans"), {
        userId:      user.uid,
        imageUrl,
        classIndex:  aiData.classIndex || 99,
        diseaseName: aiData.diseaseName,
        cropName:    aiData.cropName || "অজানা",
        severity:    aiData.severity,
        isHealthy:   aiData.severity === "সুস্থ",
        diseaseData: aiData,
        confidence:  confidencePercentage,
        createdAt:   serverTimestamp(),
      });
      console.log("Full scan result saved to History successfully!");
    }
  } catch (e) {
    console.warn("Background save failed:", e);
  }
}

export default function Scanner() {
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [result, setResult]       = useState(null);
  const [rawData, setRawData]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [mounted, setMounted]     = useState(false);
  const [confWidth, setConfWidth] = useState(0);

  const fileRef   = useRef();
  const cameraRef = useRef();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (result) {
      setTimeout(() => setConfWidth(result.confidence), 100);
    }
  }, [result]);

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      setError("শুধু ছবি ফাইল বেছে নিন");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setRawData(null);
    setError("");
    setConfWidth(0);
  }

  async function analyze() {
    if (!image) return;
    if (!OR_KEY) {
      setError("OpenRouter API Key পাওয়া যায়নি!");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setRawData(null);
    setConfWidth(0);

    try {
      const compressedDataUrl = await compressImage(image, 512, 0.75);
      console.log("Compressed:", Math.round(compressedDataUrl.length / 1024), "KB");

      const prompt = `You are a Master Plant Pathologist in Bangladesh. You MUST follow these instructions with 100% strictness. 

STEP 1: PLANT VERIFICATION
- Is the image actually a plant, leaf, flower, or crop? If not, strictly set "isPlant" to false and stop.
- Identify the exact plant (e.g., Rose, Tomato, Potato) and part (Leaf, Tuber). Do not confuse a rose leaf with a tomato leaf.

STEP 2: DIAGNOSIS (CRITICAL THINKING)
Look at the symptoms. Consider all possibilities:
1. Fungal/Bacterial/Viral Disease (e.g., Blight, Rot, Mosaic).
2. Pest Attack (e.g., Mites, Aphids, Leaf Miners).
3. Nutrient Deficiency (e.g., Lack of Potassium, Nitrogen - often causes yellowing/reddening of edges without fungal spots).
4. Healthy.
If unsure, diagnose the most visually accurate issue.

STEP 3: TREATMENT SAFETY (STRICT GUARDRAILS)
- DO NOT invent chemical names. If you don't know a specific chemical, write "যেকোনো অনুমোদিত ছত্রাকনাশক/কীটনাশক".
- DOSAGE MUST STRICTLY be between 1.0 to 3.0 gram/ml per Liter of water. NO EXCEPTIONS. If you suggest 50g/L, you will kill the crop.

STEP 4: OUTPUT FORMAT
Reply ONLY with valid JSON. No markdown tags (like \`\`\`json), no extra text.

{
  "isPlant": true,
  "plantPart": "গাছের নাম ও অংশ (যেমন: গোলাপ পাতা, আলুর কন্দ, টমেটো পাতা)",
  "visualAnalysis": "ছবিতে যা দেখছেন তার নিখুঁত বর্ণনা (যেমন: পাতার কিনারা লাল হয়ে গেছে যা পুষ্টির অভাব নির্দেশ করে)",
  "classIndex": 1,
  "diseaseName": "রোগ/সমস্যার নাম বাংলায় (English Name)",
  "cropName": "ফসলের সঠিক নাম",
  "severity": "সুস্থ অথবা মাঝারি অথবা গুরুতর",
  "confidence": 0.95,
  "symptoms": ["লক্ষণ ১", "লক্ষণ ২"],
  "organicTreatment": ["জৈব বা প্রাকৃতিক সমাধান (গরম পানি দেওয়া নিষেধ)"],
  "chemicalTreatment": ["ওষুধের নাম: প্রতি লিটার পানিতে ১-২ গ্রাম/মিলি (সর্বোচ্চ ৩)"]
}
`;

      let responseText = null;

      for (const model of FREE_VISION_MODELS) {
        try {
          const shortName = model.split("/")[1]?.split(":")[0] || model;
          console.log(`Trying: ${shortName}`);

          const res = await fetchWithTimeout(
            "https://openrouter.ai/api/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${OR_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "AgroDoc",
              },
              body: JSON.stringify({
                model,
                messages: [{
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: compressedDataUrl } }
                  ]
                }],
                max_tokens: 800,
                temperature: 0.0,
              })
            },
            15000
          );

          const json = await res.json();

          if (res.ok) {
            const txt = json.choices?.[0]?.message?.content?.trim();
            if (txt) {
              responseText = txt;
              console.log(`✅ ${model} সফল`);
              break;
            }
          } else {
            console.warn(`❌ ${model} ${res.status}:`, json?.error?.message || "");
          }
        } catch (e) {
          console.warn(`❌ ${model}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 300));
      }

      if (!responseText) throw new Error("সব model fail করেছে। ইন্টারনেট চেক করুন।");

      let cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const startIndex = cleanJson.indexOf("{");
      const endIndex   = cleanJson.lastIndexOf("}");
      if (startIndex !== -1 && endIndex !== -1) {
        cleanJson = cleanJson.substring(startIndex, endIndex + 1);
      }

      const aiData = JSON.parse(cleanJson);

      if (aiData.isPlant === false) {
        setError("এটি কোনো গাছ বা ফসলের ছবি বলে মনে হচ্ছে না। অনুগ্রহ করে সঠিক ছবি দিন।");
        setLoading(false);
        return;
      }

      if (aiData.chemicalTreatment && Array.isArray(aiData.chemicalTreatment)) {
        aiData.chemicalTreatment = aiData.chemicalTreatment.map(item => {
          return item.replace(/(\d{2,})\s*(গ্রাম|gram|g|ml|মিলি)/gi, "২ গ্রাম/মিলি");
        });
      }

      const confidencePercentage = Math.round((aiData.confidence || 0.90) * 100);

      setResult({
        name:       aiData.diseaseName,
        severity:   aiData.severity,
        confidence: confidencePercentage,
      });
      setRawData({
        classIndex:  aiData.classIndex || 99,
        confidence:  aiData.confidence || 0.90,
        imageUrl:    preview,
        diseaseData: aiData,
      });

      saveInBackground({ file: image, preview, user, aiData, confidencePercentage });

    } catch (err) {
      console.error("Analysis Error:", err);
      setError("ছবিটি বিশ্লেষণ করা যায়নি। আরও স্পষ্ট আলোতে শুধু আক্রান্ত অংশের ছবি তুলুন।");
    } finally {
      setLoading(false);
    }
  }

  function goToResult() {
    if (!rawData) return;
    navigate("/result", {
      state: {
        classIndex:  rawData.classIndex,
        confidence:  rawData.confidence,
        imageUrl:    rawData.imageUrl,
        diseaseData: rawData.diseaseData,
      }
    });
  }

  function reset() {
    setPreview(null);
    setImage(null);
    setResult(null);
    setRawData(null);
    setError("");
    setConfWidth(0);
  }

  /* ── Core Scanner UI (Used in both Mobile & Desktop) ── */
  const ScannerCard = (
    <div
      className={`w-full max-w-[500px] px-4 py-8 space-y-6 transition-all duration-700 ease-out transform ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
    >
      {/* ── No image selected ── */}
      {!preview ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <Leaf className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">গাছের পাতা স্ক্যান করুন</h2>
            <p className="text-gray-500 text-sm">স্পষ্ট আলোতে, আক্রান্ত পাতার কাছ থেকে ছবি তুলুন</p>
          </div>

          {/* Speed badge */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full mx-auto w-fit">
            <Zap className="w-3.5 h-3.5" />
            সাধারণত ১০–১৫ সেকেন্ডে ফলাফল
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => cameraRef.current.click()}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 active:scale-[0.98] transition-all"
            >
              <Camera className="w-5 h-5" /> ক্যামেরা
            </button>
            <button
              onClick={() => fileRef.current.click()}
              className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
            >
              <ImagePlus className="w-5 h-5" /> গ্যালারি
            </button>
          </div>
          
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <input ref={fileRef}   type="file" accept="image/*" className="hidden"                        onChange={(e) => handleFile(e.target.files[0])} />
        </div>

      ) : (

        /* ── Image selected ── */
        <div className="space-y-5">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden">
            <div className="relative">
              <img src={preview} alt="preview" className="w-full h-64 object-cover" />

              {/* Ready state */}
              {!loading && !result && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white font-medium text-sm">ছবিটি বিশ্লেষণ করার জন্য প্রস্তুত</p>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 px-6">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                      <Leaf className="w-8 h-8 text-green-300 animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-white font-bold text-base">AI বিশ্লেষণ করছে...</p>
                  </div>

                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Done checkmark */}
              {result && !loading && (
                <div className="absolute top-3 right-3">
                  <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="p-4 flex gap-3 bg-white">
              <button
                onClick={reset}
                disabled={loading}
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <X className="w-4 h-4" /> বাতিল
              </button>
              <button
                onClick={analyze}
                disabled={loading || !!result}
                className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-green-500/25 transition-all disabled:opacity-60 active:scale-95"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> বিশ্লেষণ হচ্ছে...</>
                  : result
                  ? <><CheckCircle className="w-4 h-4" /> সম্পন্ন</>
                  : <><Search className="w-4 h-4" /> বিশ্লেষণ করুন</>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Result card */}
          {result && (() => {
            const cfg = severityConfig[result.severity] || severityConfig["মাঝারি"];
            return (
              <div className={`rounded-[2rem] shadow-lg border ${cfg.border} ${cfg.bg} p-6 space-y-5 backdrop-blur-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">শনাক্তকৃত রোগ</p>
                    <h2 className="text-xl font-extrabold text-gray-800 leading-tight">{result.name}</h2>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm flex-shrink-0">{cfg.icon}</div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-3.5 py-1.5 rounded-xl ${cfg.badge}`}>
                    অবস্থা: {result.severity}
                  </span>
                  <span className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                    AI আত্মবিশ্বাস: {result.confidence}%
                  </span>
                </div>

                {/* Animated confidence bar */}
                <div className="w-full bg-black/5 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`bg-gradient-to-r ${cfg.bar} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${confWidth}%` }}
                  />
                </div>

                <button
                  onClick={goToResult}
                  className="w-full bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Leaf className="w-4 h-4 text-green-500" />
                  বিস্তারিত চিকিৎসা ও ডোজ দেখুন
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigate("/history")}
                  className="w-full bg-white/60 border border-gray-100 text-gray-600 hover:bg-white py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <History className="w-4 h-4" /> স্ক্যান ইতিহাস দেখুন
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
      
      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-gray-50 to-white flex flex-col pb-20">
        <div className="w-full sticky top-0 z-50">
          <TopNav isDesktop={false} />
        </div>
        <div className="flex-1 flex flex-col items-center w-full">
          {ScannerCard}
        </div>
        <BottomNav />
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
        <Sidebar user={user} displayName={displayName} navigate={navigate} />
        <main className="flex-1 ml-60 min-h-screen flex flex-col">
          <TopNav isDesktop={true} />
          <div className="flex-1 w-full flex flex-col items-center justify-center py-10 px-8 relative">
            <div className={`text-center mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AgroDoc AI স্ক্যানার</h1>
              <p className="text-gray-500 mt-2">আপনার ফসলের সঠিক রোগ নির্ণয় এবং তাৎক্ষণিক চিকিৎসা পান।</p>
            </div>
            {ScannerCard}
          </div>
        </main>
      </div>

      <AgroBot />
    </>
  );
}
