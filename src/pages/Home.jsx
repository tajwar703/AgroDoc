import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import WeatherAlert from "../components/WeatherAlert";
import BottomNav from "../components/BottomNav";
import TopNav from "../components/TopNav";
import {
  ScanLine, History, UserCircle, Leaf, TrendingUp,
  ChevronRight, Sprout, ShieldCheck, Clock,
  LogOut, LayoutDashboard, Settings, ShoppingBag,
  Activity, Store, MessageCircle, X, Send, Bot,
  Package, MapPin, Truck, AlertCircle
} from "lucide-react";

const HEALTHY_INDICES = [3,4,6,10,14,17,19,22,23,24,27,37];

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
    { label:"আমার অর্ডার",  icon:<Package size={16}/>,         path:"/order"   },
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
  - কখনো ইংরেজিতে উত্তর দেবে পরিচয় গোপন রাখবে না, এমনকি প্রশ্ন ইংরেজিতে হলেও বাংলায় উত্তর দাও।`;

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
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-[messagePop_0.3s_ease-out_both]`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-green-600 text-white rounded-br-sm" : "bg-white text-gray-700 border border-gray-100 rounded-bl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-[messagePop_0.3s_ease-out_both]">
              <div className="flex items-center gap-1.5 p-3.5 bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm w-fit">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[typingDot_1.4s_infinite_ease-in-out_both]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[typingDot_1.4s_infinite_ease-in-out_both] [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-[typingDot_1.4s_infinite_ease-in-out_both] [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
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

/* ══════════════ MAIN ══════════════ */
export default function Home() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [mounted, setMounted]           = useState(false);
  const [stats, setStats]               = useState({ total:0, healthy:0, diseased:0 });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Notice State
  const [showProfileNotice, setShowProfileNotice] = useState(false);

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => { 
    setMounted(true); 
    if (!user) return;

    // Show Profile Notice Logic (Once per session)
    const hasSeenNotice = sessionStorage.getItem("profileNoticeShown");
    if (!hasSeenNotice) {
      // You can add more logic here, e.g., if (!user.displayName)
      const timer = setTimeout(() => {
        setShowProfileNotice(true);
      }, 1500); // Show after 1.5 seconds for a smooth entry
      return () => clearTimeout(timer);
    }

    const q = query(collection(db, "scans"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const allScans = snap.docs.map(d => d.data());
      const total = allScans.length;
      const healthy = allScans.filter(s => HEALTHY_INDICES.includes(s.classIndex)).length;
      setStats({ total, healthy, diseased: total - healthy });
      setLoadingStats(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCloseNotice = () => {
    setShowProfileNotice(false);
    sessionStorage.setItem("profileNoticeShown", "true");
  };

  const handleUpdateProfile = () => {
    handleCloseNotice();
    navigate("/profile");
  };

  const quickActions = [
    { label:"স্ক্যান করুন", sub:"AI স্ক্যানার", path:"/scanner", from:"from-green-500", to:"to-emerald-600", icon:<ScanLine size={24} className="text-white"/> },
    { label:"ইতিহাস", sub:"স্ক্যান রিপোর্ট", path:"/history", from:"from-blue-500", to:"to-cyan-500", icon:<History size={24} className="text-white"/> },
    { label:"কৃষি দোকান", sub:"সার ও বীজ", path:"/shop", from:"from-orange-400", to:"to-amber-500", icon:<ShoppingBag size={24} className="text-white"/> },
    { label:"আমার অর্ডার", sub:"অর্ডার স্ট্যাটাস", path:"/order", from:"from-purple-500", to:"to-indigo-500", icon:<Package size={24} className="text-white"/> },
    { label:"ঠিকানা বই", sub:"ঠিকানা ম্যানেজ", path:"/address-book", from:"from-teal-400", to:"to-emerald-500", icon:<MapPin size={24} className="text-white"/> },
    { label:"কৃষি এজেন্সি", sub:"জরুরি সহায়তা", path:"/agro-agency", from:"from-red-500", to:"to-rose-600", icon:<Truck size={24} className="text-white"/> },
  ];

  /* ── MOBILE ── */
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50 via-gray-50 to-white flex flex-col">
      <TopNav isDesktop={false} />

      <div className={`flex-1 px-4 pt-5 pb-28 space-y-5 max-w-md mx-auto w-full transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        {/* Greeting */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-5 overflow-hidden shadow-lg shadow-green-500/20">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full"/>
          <div className="absolute right-2 bottom-0 w-16 h-16 bg-white/10 rounded-full"/>
          <div className="relative z-10">
            <p className="text-green-100 text-xs font-semibold mb-0.5">আস-সালামু আলাইকুম</p>
            <h1 className="text-white text-2xl font-extrabold truncate">{displayName}</h1>
            <div className="flex items-center gap-1.5 mt-2">
              <Sprout size={13} className="text-green-200"/>
              <p className="text-green-100 text-xs">আজকে আপনার ফসল চেক করুন</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"মোট স্ক্যান",  value:stats.total,    icon:<Activity size={15} className="text-blue-500"/>,    bg:"bg-blue-50",   text:"text-blue-700"   },
            { label:"সুস্থ গাছ",    value:stats.healthy,  icon:<ShieldCheck size={15} className="text-green-500"/>, bg:"bg-green-50",  text:"text-green-700"  },
            { label:"রোগাক্রান্ত", value:stats.diseased, icon:<TrendingUp size={15} className="text-orange-500"/>,  bg:"bg-orange-50", text:"text-orange-700" },
          ].map((s) => (
            <div key={s.label} className="bg-white/90 backdrop-blur-sm rounded-2xl p-3.5 border border-white shadow-sm flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
              <span className={`text-xl font-black ${s.text}`}>{loadingStats ? "—" : s.value}</span>
              <span className="text-gray-400 text-[10px] font-semibold text-center leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        <WeatherAlert/>

        {/* Quick Actions */}
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">দ্রুত অ্যাকশন</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions
              .filter(item => item.label !== "স্ক্যান করুন" && item.label !== "ইতিহাস")
              .map((item, index) => (
              <button key={item.path} onClick={() => navigate(item.path)}
                style={{ animationDelay: `${index * 80}ms` }}
                className="w-full group bg-white/90 backdrop-blur-xl rounded-[20px] border border-gray-50 shadow-sm p-5 flex flex-col items-center justify-center gap-3 hover:shadow-md active:scale-[0.98] transition-all duration-300 animate-[popIn_0.5s_ease-out_both]">
                <div className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center shadow-md shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <div className="text-center w-full mt-1">
                  <p className="text-[14px] font-bold text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <BottomNav/>
    </div>
  );

  /* ── DESKTOP ── */
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate}/>

      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <TopNav isDesktop={true} />

        <div className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-8 flex flex-col gap-6">
          
          <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">স্বাগতম, {displayName}! 👋</h1>
            <p className="text-sm text-gray-500 mt-1">আজকের কৃষি আপডেট ও আপনার ফসলের অবস্থা একনজরে দেখে নিন।</p>
          </div>

          <div className={`grid grid-cols-3 gap-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="col-span-2 relative bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 overflow-hidden shadow-sm flex items-center justify-between">
              <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/5 rounded-full"/>
              <div className="absolute right-20 -bottom-10 w-40 h-40 bg-white/10 rounded-full"/>
              
              <div className="relative z-10 max-w-md">
                <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-md px-2.5 py-1 mb-4">
                  <Sprout size={12} className="text-white"/>
                  <span className="text-white text-[10px] font-bold uppercase tracking-widest">AgroDoc Scanner</span>
                </div>
                <h2 className="text-white text-3xl font-bold leading-tight mb-3">
                  আপনার ফসলকে সুস্থ রাখুন AI-এর সাহায্যে
                </h2>
                <p className="text-teal-50 text-sm mb-6 leading-relaxed">
                  গাছের পাতার ছবি তুলুন — সেকেন্ডের মধ্যে রোগ সনাক্ত করুন এবং সঠিক চিকিৎসা পান।
                </p>
                <button onClick={() => navigate("/scanner")}
                  className="inline-flex items-center gap-2 bg-white text-teal-800 font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm">
                  <ScanLine size={18}/> এখনই স্ক্যান করুন
                </button>
              </div>
            </div>

            <div className="col-span-1 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 h-full flex flex-col justify-center">
              <WeatherAlert />
            </div>
          </div>

          <div className={`grid grid-cols-3 gap-6 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            {[
              { label:"মোট স্ক্যান", value:stats.total, icon:<Activity size={24} className="text-blue-500"/>, bg:"bg-blue-50", text:"text-gray-900", border:"border-blue-100" },
              { label:"সুস্থ গাছ", value:stats.healthy, icon:<ShieldCheck size={24} className="text-green-500"/>, bg:"bg-green-50", text:"text-gray-900", border:"border-green-100" },
              { label:"রোগাক্রান্ত", value:stats.diseased, icon:<TrendingUp size={24} className="text-orange-500"/>, bg:"bg-orange-50", text:"text-gray-900", border:"border-orange-100" },
            ].map((s, idx) => (
              <div key={idx} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-6 flex items-center justify-between hover:shadow-md transition-shadow`}>
                <div>
                  <p className="text-[13px] font-semibold text-gray-500 mb-1">{s.label}</p>
                  <h3 className={`text-4xl font-extrabold ${s.text}`}>{loadingStats ? "—" : s.value}</h3>
                </div>
                <div className={`w-14 h-14 ${s.bg} rounded-xl flex items-center justify-center`}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-2 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h3 className="text-base font-bold text-gray-800 mb-4">প্রয়োজনীয় সার্ভিসেস</h3>
            <div className="grid grid-cols-5 gap-4">
              {quickActions
                .filter(item => item.label !== "স্ক্যান করুন")
                .map((item, index) => (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="group bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 flex flex-col items-center justify-center text-center hover:border-green-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-[fadeInUp_0.5s_ease-out_both]">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.from} ${item.to} flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {React.cloneElement(item.icon, { size: 20 })}
                  </div>
                  <p className="text-[14px] font-bold text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </main>
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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes messagePop {
            0% { opacity: 0; transform: translateY(10px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
            30% { transform: translateY(-4px); opacity: 1; }
          }
        `}
      </style>

      {/* --- Profile Update Notice Modal --- */}
      {showProfileNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl animate-[popIn_0.3s_ease-out_both]">
            <div className="flex items-center justify-center w-14 h-14 bg-orange-100 text-orange-500 rounded-full mb-5 mx-auto border-[4px] border-orange-50">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 text-center mb-2">কৃষক প্রোফাইল আপডেট!</h3>
            <p className="text-[13px] text-gray-500 text-center mb-6 leading-relaxed px-2">
              সঠিক কৃষি পরামর্শ এবং নিরবচ্ছিন্ন সেবা পেতে অনুগ্রহ করে আপনার প্রোফাইলের বিস্তারিত তথ্য আপডেট করুন।
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleCloseNotice} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors active:scale-95">
                পরে করব
              </button>
              <button 
                onClick={handleUpdateProfile} 
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95">
                এখনই করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileLayout/>
      <DesktopLayout/>
      <AgroBot />
    </>
  );
}