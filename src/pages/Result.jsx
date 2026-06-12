import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  ArrowLeft, ShieldAlert, CheckCircle2, FlaskConical,
  Leaf, ChevronDown, ChevronUp, Calculator,
  RotateCcw, AlertCircle, ShoppingBag, Sprout,
  Droplets, Zap, Info, LogOut, LayoutDashboard,
  Store, Package, MapPin, Truck, UserCircle, ScanLine, History
} from "lucide-react";
import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";

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

export default function Result() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  
  const [mounted, setMounted]   = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [land, setLand]         = useState("");
  const [unit, setUnit]         = useState("বিঘা");
  const [dose, setDose]         = useState(null);

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  // Scanner পেজ থেকে আসা ডাটা রিসিভ করা
  const { confidence, imageUrl, diseaseData } = location.state || {};

  const d = {
    name:     diseaseData?.diseaseName || "অজানা রোগ",
    plant:    diseaseData?.cropName || "অজানা",
    healthy:  diseaseData?.severity === "সুস্থ",
    medicine: diseaseData?.chemicalTreatment?.[0] || "প্রয়োজন নেই",
    organic:  diseaseData?.organicTreatment?.join(" ") || "ছবিটি স্পষ্ট করে আবার স্ক্যান করুন।",
    chemical: diseaseData?.chemicalTreatment?.join(" ") || "নির্ধারণ করা যায়নি",
    symptoms: diseaseData?.symptoms || [],
  };

  const pct = confidence ? Math.round(confidence * 100) : 95;

  useEffect(() => { 
    setMounted(true); 
    if (!diseaseData) {
      navigate("/scanner"); // সরাসরি আসলে স্ক্যানারে পাঠিয়ে দাও
    }
  }, [diseaseData, navigate]);

  // Dose calculator (ডোজ হিসাব)
  function calcDose() {
    const val = parseFloat(land);
    if (!val || val <= 0) return;
    let sqft = unit === "বিঘা" ? val * 14400 : unit === "শতাংশ" ? val * 435.6 : val * 43560;
    const liters = Math.round(sqft / 100);
    setDose({ liters, gram: liters * 2 });
  }

  // Theme (রোগের অবস্থার ওপর ভিত্তি করে কালার)
  const theme = d.healthy
    ? { grad:"from-emerald-500 to-green-600", light:"bg-green-50", text:"text-green-700", border:"border-green-200", badge:"bg-green-100 text-green-700", ring:"ring-green-400/30" }
    : { grad:"from-orange-500 to-red-500",    light:"bg-red-50",   text:"text-red-700",   border:"border-red-200",   badge:"bg-red-100 text-red-700",   ring:"ring-red-400/30"   };

  /* ── UI Blocks (Reusable in Mobile & Desktop) ── */
  const BlockImageStatus = (
    <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-64 md:h-72 w-full flex-shrink-0 group">
      {imageUrl
        ? <img src={imageUrl} alt="স্ক্যান করা পাতা" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
        : <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <Leaf size={48} className="text-gray-300"/>
          </div>}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r ${theme.grad} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5">
          {d.healthy
            ? <CheckCircle2 size={20} className="text-white"/>
            : <ShieldAlert size={20} className="text-white"/>}
          <span className="text-white font-black text-sm uppercase tracking-wider">{d.healthy ? "গাছটি সুস্থ" : "রোগাক্রান্ত"}</span>
        </div>
        <div className="flex items-center gap-3 w-1/3 max-w-[120px]">
          <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: mounted ? `${pct}%` : "0%" }}/>
          </div>
          <span className="text-white text-xs font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  );

  const BlockDiseaseName = (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
      <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${theme.badge} uppercase tracking-wider`}>{d.plant}</span>
      <h2 className="text-2xl md:text-3xl font-black text-gray-800 mt-3 mb-4 leading-tight tracking-tight">{d.name}</h2>
      <div className={`flex items-start md:items-center gap-3 ${theme.light} ${theme.border} border rounded-2xl px-5 py-4`}>
        <Info size={18} className={`${theme.text} flex-shrink-0 mt-0.5 md:mt-0`}/>
        <p className={`text-sm font-semibold ${theme.text} leading-relaxed`}>
          {d.healthy ? "গাছটি সম্পূর্ণ সুস্থ আছে। নিয়মিত পরিচর্যা চালিয়ে যান।" : "AI বিশ্লেষণে রোগ সনাক্ত হয়েছে। নিচের পরামর্শ অনুসরণ করুন।"}
        </p>
      </div>
    </div>
  );

  const BlockSymptoms = d.symptoms?.length > 0 && (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5 border-b border-gray-50 pb-3">
        <div className="w-8 h-8 bg-amber-50 rounded-[10px] flex items-center justify-center">
          <AlertCircle size={16} className="text-amber-500"/>
        </div>
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">রোগের লক্ষণ</h3>
      </div>
      <div className="space-y-3">
        {d.symptoms.map((s, i) => (
          <div key={i} className="flex items-start gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
            <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"/>
            <p className="text-[14px] text-gray-700 leading-relaxed font-medium">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const BlockTreatment = (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow h-full flex flex-col">
      <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-3 mb-5 flex items-center gap-2">
        <Sprout size={18} className="text-gray-400"/> প্রতিকার ও চিকিৎসা
      </h3>
      
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center">
              <Sprout size={13} className="text-green-600"/>
            </div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">জৈব প্রতিকার</h4>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed bg-green-50/30 p-3.5 rounded-xl border border-green-50/50">{d.organic}</p>
        </div>

        {!d.healthy && (
          <div className="pt-5 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center">
                <FlaskConical size={13} className="text-blue-600"/>
              </div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">রাসায়নিক প্রেসক্রিপশন</h4>
            </div>
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl px-5 py-4 shadow-inner">
              <p className="text-sm font-bold text-blue-800 leading-relaxed">{d.chemical}</p>
            </div>
            <div className="flex items-center gap-2.5 mt-4 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
              <Zap size={16} className="text-orange-500 flex-shrink-0"/>
              <p className="text-[13px] font-bold text-gray-700">প্রস্তাবিত ওষুধ: <span className="text-orange-600 bg-white px-2 py-0.5 rounded shadow-sm ml-1">{d.medicine}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const BlockCalculator = !d.healthy && (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <button onClick={() => setShowCalc(p => !p)} className="w-full p-6 flex items-center justify-between group bg-gray-50/30 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-105 transition-transform">
            <Calculator size={20} className="text-white"/>
          </div>
          <div className="text-left">
            <p className="font-extrabold text-gray-800 text-[15px]">ডোজ ক্যালকুলেটর</p>
            <p className="text-gray-400 text-xs font-medium mt-0.5">জমির পরিমাণ দিয়ে সঠিক ওষুধের মাত্রা হিসাব করুন</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-green-300 transition-colors">
          {showCalc ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
        </div>
      </button>

      {showCalc && (
        <div className="p-6 border-t border-gray-100 space-y-4 bg-white animate-[fadeInUp_0.3s_ease-out_both]">
          <div className="flex gap-3">
            <input type="number" placeholder="জমির পরিমাণ দিন"
              value={land} onChange={e => setLand(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-gray-50 transition-all"/>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-gray-50 appearance-none min-w-[100px] text-center cursor-pointer">
              <option>বিঘা</option>
              <option>শতাংশ</option>
              <option>একর</option>
            </select>
          </div>

          <button onClick={calcDose}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all">
            হিসাব বের করুন
          </button>

          {dose && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 space-y-3 mt-2">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-green-50">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500"/>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">পানির পরিমাণ</span>
                </div>
                <span className="font-black text-green-700 text-lg">{dose.liters} লিটার</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-green-50">
                <div className="flex items-center gap-2">
                  <FlaskConical size={16} className="text-orange-500"/>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">ওষুধের পরিমাণ</span>
                </div>
                <span className="font-black text-orange-600 text-lg">{dose.gram} গ্রাম/মিলি</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const BlockActions = (
    <div className="flex flex-col sm:flex-row gap-4 mt-2">
      {!d.healthy && (
        <button onClick={() => navigate("/shop")}
          className="flex-1 bg-gradient-to-r from-orange-400 to-amber-500 text-white font-bold p-4 rounded-[1.25rem] flex items-center justify-center gap-3 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all text-sm">
          <ShoppingBag size={18}/>
          প্রয়োজনীয় ওষুধ কিনুন
        </button>
      )}
      <button onClick={() => navigate("/scanner")}
        className="flex-1 bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 font-bold p-4 rounded-[1.25rem] flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:bg-green-50 active:scale-95 transition-all text-sm">
        <RotateCcw size={18}/>
        নতুন স্ক্যান করুন
      </button>
    </div>
  );

  /* ── MOBILE LAYOUT ── */
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen bg-[#FDFDFD] pb-24 flex flex-col w-full relative">
      <div className="w-full sticky top-0 z-50">
        <TopNav isDesktop={false} />
      </div>
      
      <div className={`flex-1 px-4 pt-5 space-y-4 transition-all duration-700 w-full max-w-md mx-auto ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 w-fit px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-100 active:scale-95 transition-all mb-2">
          <ArrowLeft size={14} /> ফিরে যান
        </button>
        {BlockImageStatus}
        {BlockDiseaseName}
        {BlockSymptoms}
        {BlockTreatment}
        {BlockCalculator}
        {BlockActions}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav />
      </div>
    </div>
  );

  /* ── DESKTOP LAYOUT (2 Column Grid) ── */
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate} />

      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <TopNav isDesktop={true} />

        <div className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-8 flex flex-col">
          
          {/* Top Bar with Back button and Title */}
          <div className={`flex items-center justify-between mb-6 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 w-fit px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all mb-3">
                <ArrowLeft size={14} /> ফিরে যান
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <ScanLine className="w-7 h-7 text-green-600" /> 
                এআই স্ক্যান রিপোর্ট
              </h1>
              <p className="text-sm text-gray-500 mt-1">আপনার স্ক্যান করা পাতার বিস্তারিত এআই বিশ্লেষণ।</p>
            </div>
          </div>

          {/* TWO COLUMN GRID FOR DESKTOP */}
          <div className={`grid grid-cols-1 xl:grid-cols-12 gap-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            
            {/* Left Column (Image, Status, Name, Symptoms) */}
            <div className="xl:col-span-5 flex flex-col gap-6">
              {BlockImageStatus}
              {BlockDiseaseName}
              {BlockSymptoms}
            </div>

            {/* Right Column (Treatment, Calculator, Actions) */}
            <div className="xl:col-span-7 flex flex-col gap-6">
              <div className="flex-1">
                {BlockTreatment}
              </div>
              {BlockCalculator}
              {BlockActions}
            </div>

          </div>
        </div>
      </main>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}