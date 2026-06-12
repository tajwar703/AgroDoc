import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  ArrowLeft, Users, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Info,
  CloudRain, Wind, Sun, Loader2, MapPin, Truck, LayoutDashboard, ScanLine, History,
  Store, Package, UserCircle, LogOut
} from "lucide-react";

import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import Loading from "../components/Loding";

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
    { label:"কৃষি এজেন্সি", icon:<Truck size={16}/>,           path:"/agency"   },
    { label:"ঠিকানা বই",    icon:<MapPin size={16}/>,          path:"/address-book" },
    { label:"প্রোফাইল",     icon:<UserCircle size={16}/>,      path:"/profile"  },
  ];
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-100 shadow-sm z-40 py-5 px-3 overflow-y-auto scrollbar-none">
      <div className="px-3 mb-7"><Logo/></div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = window.location.pathname === item.path || (item.path === '/agency' && window.location.pathname === '/agro-agency');
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

/* ── Fetch Disaster Warning from Open-Meteo API ── */
async function fetchDisasterWarning(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,wind_gusts_10m_max&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    const data = await res.json();
    
    const maxRain = Math.max(...data.daily.precipitation_sum);
    const maxWind = Math.max(...data.daily.wind_gusts_10m_max);

    if (maxRain > 60) {
      return { 
        type: 'flood', 
        title: "বন্যার আগাম সতর্কতা!", 
        desc: `আগামী ৫ দিনে ভারী বৃষ্টির পূর্বাভাস (${maxRain} মি.মি.)। ফসল ডুবে যাওয়ার আশঙ্কা থাকলে দ্রুত কাটার ব্যবস্থা নিন।`, 
        color: "from-blue-600 to-cyan-600", 
        icon: CloudRain 
      };
    }
    if (maxWind > 65) {
      return { 
        type: 'storm', 
        title: "কালবৈশাখী বা ঝড়ের পূর্বাভাস!", 
        desc: `আগামী ৫ দিনে তীব্র ঝোড়ো বাতাস (${maxWind} কি.মি./ঘণ্টা) হতে পারে। খেতের ফসল রক্ষায় দ্রুত শ্রমিক বুক করুন।`, 
        color: "from-amber-600 to-red-600", 
        icon: Wind 
      };
    }
    
    return { 
      type: 'clear', 
      title: "আবহাওয়া বর্তমানে অনুকূল", 
      desc: "আগামী ৫ দিনে বড় কোনো প্রাকৃতিক দুর্যোগের পূর্বাভাস নেই। স্বাভাবিক কৃষি কাজ চালিয়ে যান।", 
      color: "from-emerald-500 to-teal-600", 
      icon: Sun 
    };
  } catch (error) {
    console.error("Weather API Error:", error);
    return { 
      type: 'error', 
      title: "কৃষি রেসপন্স টিম প্রস্তুত", 
      desc: "যেকোনো আপদকালীন সময়ে ফসল কাটতে বা রোপণ করতে আমাদের টিম ২৪/৭ প্রস্তুত।", 
      color: "from-green-600 to-emerald-600", 
      icon: ShieldCheck 
    };
  }
}

export default function AgroAgency() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState("idle"); 
  const [disasterAlert, setDisasterAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    farmerName: displayName,
    farmerPhone: user?.phoneNumber?.replace("+88", "") || "",
    location: "",
    workerNeeded: "10-20",
    urgencyDate: "",
    cropType: "",
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const warning = await fetchDisasterWarning(latitude, longitude);
          setDisasterAlert(warning);
          setLoading(false);
        },
        async () => {
          const fallback = await fetchDisasterWarning(23.8103, 90.4125);
          setDisasterAlert(fallback);
          setLoading(false);
        }
      );
    } else {
      fetchDisasterWarning(23.8103, 90.4125).then(warning => {
        setDisasterAlert(warning);
        setLoading(false);
      });
    }
  }, []);

  async function handleAgencyBooking(e) {
    e.preventDefault();
    if (!formData.farmerName || !formData.farmerPhone || !formData.location) {
      alert("অনুগ্রহ করে নাম, মোবাইল নম্বর এবং স্থান সঠিকভাবে দিন।");
      return;
    }

    setBookingStep("submitting");
    try {
      await addDoc(collection(db, "agency_bookings"), {
        userId: user?.uid || "guest",
        ...formData,
        status: "requested",
        createdAt: serverTimestamp(),
      });
      setBookingStep("success");
    } catch (error) {
      console.error("Booking error: ", error);
      alert("বুকিং রিকোয়েস্ট পাঠানো যায়নি। আবার চেষ্টা করুন।");
      setBookingStep("idle");
    }
  }

  /* ── UI Variables ── */
  const bannerContent = disasterAlert && (
    <div className="opacity-0 animate-slideUpFade w-full" style={{ animationDelay: '100ms' }}>
      <div className={`bg-gradient-to-br ${disasterAlert.color} rounded-[2rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <disasterAlert.icon size={160} />
        </div>
        <div className="flex items-start gap-4 md:gap-5 relative z-10">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1rem] flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
            <disasterAlert.icon size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">{disasterAlert.title}</h2>
            <p className="text-[13px] md:text-sm text-white/90 leading-relaxed mt-1.5 md:max-w-[85%] font-medium">
              {disasterAlert.desc}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/20 relative z-10 text-center md:max-w-md md:mx-auto lg:mx-0">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">প্রস্তুত শ্রমিক</p>
            <p className="text-2xl font-black">১৮০+ জন</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5">ডেলিভারি রেট</p>
            <p className="text-2xl font-black">স্বল্প মূল্য</p>
          </div>
        </div>
      </div>
    </div>
  );

  const bookingFormContent = (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 opacity-0 animate-slideUpFade" style={{ animationDelay: '200ms' }}>
      {bookingStep === "success" ? (
        <div className="text-center py-10 space-y-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">আবেদন সফল হয়েছে!</h3>
          <p className="text-sm text-gray-500 leading-relaxed px-4 max-w-sm mx-auto">
            আপনার শ্রমিক বুকিংয়ের অনুরোধটি আমাদের কন্ট্রোল রুমে পৌঁছেছে। আগামী ১০-১৫ মিনিটের মধ্যে আমাদের প্রতিনিধি আপনার নম্বরে কল করবেন।
          </p>
          <button onClick={() => setBookingStep("idle")} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-3 rounded-2xl text-sm transition-all mt-4 active:scale-95">
            নতুন বুকিং করুন
          </button>
        </div>
      ) : (
        <form onSubmit={handleAgencyBooking} className="space-y-5">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-3 flex items-center gap-2 mb-2">
            <Users size={16} className="text-green-600" />
            জরুরি আপদকালীন শ্রমিক রিকোয়েস্ট ফর্ম
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">কৃষকের নাম <span className="text-red-500">*</span></label>
              <input required type="text" value={formData.farmerName} onChange={e => setFormData({...formData, farmerName: e.target.value})} placeholder="আপনার নাম লিখুন" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">মোবাইল নম্বর <span className="text-red-500">*</span></label>
              <input required type="tel" value={formData.farmerPhone} onChange={e => setFormData({...formData, farmerPhone: e.target.value})} placeholder="01XXXXXXXXX" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">বিস্তারিত এলাকা / স্থান <span className="text-red-500">*</span></label>
            <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="গ্রাম, ইউনিয়ন, উপজেলা, জেলা" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">ফসলের ধরন</label>
              <input type="text" value={formData.cropType} onChange={e => setFormData({...formData, cropType: e.target.value})} placeholder="যেমন: ধান, আলু, গম" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">কতজন শ্রমিক প্রয়োজন?</label>
              <select value={formData.workerNeeded} onChange={e => setFormData({...formData, workerNeeded: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all appearance-none cursor-pointer">
                <option value="5-10">৫ - ১০ জন</option>
                <option value="10-20">১০ - ২০ জন</option>
                <option value="20-50">২০ - ৫০ জন</option>
                <option value="50+">৫০ জনের বেশি</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">কবে থেকে কাজ শুরু করতে হবে? <span className="text-red-500">*</span></label>
            <input required type="date" value={formData.urgencyDate} onChange={e => setFormData({...formData, urgencyDate: e.target.value})} 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-gray-700"/>
          </div>

          <div className="bg-blue-50/50 text-blue-700 p-4 rounded-xl flex items-start gap-3 border border-blue-100 text-xs font-medium leading-relaxed mt-2">
            <Info size={18} className="mt-0.5 flex-shrink-0 text-blue-600" />
            <span>আমাদের রেট বাজারের সাধারণ মূল্যের চেয়ে কম রাখা হবে এবং বুকিং সম্পূর্ণ ফ্রি। কাজ শেষ হওয়ার পর সরাসরি শ্রমিক লিডারকে টাকা বুঝিয়ে দেবেন।</span>
          </div>

          <button 
            type="submit" 
            disabled={bookingStep === "submitting"} 
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-[14px] shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] text-sm mt-4"
          >
            {bookingStep === "submitting" ? <Loader2 size={18} className="animate-spin" /> : null}
            {bookingStep === "submitting" ? "রিকোয়েস্ট পাঠানো হচ্ছে..." : "জরুরি শ্রমিক বুকিং করুন"}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2 justify-center text-[10px] text-gray-400 font-bold uppercase tracking-wider pt-6 opacity-0 animate-slideUpFade" style={{ animationDelay: '300ms' }}>
        <ShieldCheck size={14} className="text-green-600" />
        <span>AgroDoc ভেরিফাইড আপদকালীন রেসপন্স সিস্টেম</span>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(30px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slideUpFade {
            animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>
      
      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden min-h-screen bg-[#f8fafc] pb-24 flex flex-col w-full relative">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc]">
            <Loading />
          </div>
        )}

        <div className="w-full sticky top-0 z-40">
          <TopNav isDesktop={false} />
        </div>
        
        <div className="px-4 py-4 flex items-center gap-3 opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white border border-gray-200 rounded-[14px] shadow-sm flex items-center justify-center active:scale-95 transition-all">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-black text-gray-800 tracking-tight">অ্যাগ্রো এজেন্সি</h1>
        </div>

        {!loading && (
          <div className="px-4 space-y-5">
            {bannerContent}
            {bookingFormContent}
          </div>
        )}

        <div className="fixed bottom-0 left-0 w-full z-50">
          <BottomNav />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
        <Sidebar user={user} displayName={displayName} navigate={navigate} />

        {loading && (
          <div className="fixed inset-0 ml-60 z-30 flex items-center justify-center bg-[#f8fafc]">
            <Loading />
          </div>
        )}

        <main className="flex-1 ml-60 min-h-screen flex flex-col">
          <TopNav isDesktop={true} />

          {!loading && (
            <div className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-8 flex flex-col gap-6">
              <div className="flex items-center justify-between opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <Truck className="w-7 h-7 text-green-600" /> 
                    অ্যাগ্রো ইমার্জেন্সি এজেন্সি
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">প্রাকৃতিক দুর্যোগে ফসল দ্রুত কাটতে আমাদের রেসপন্স টিম বুক করুন।</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-5 flex flex-col">
                  {bannerContent}
                </div>
                <div className="xl:col-span-7 flex flex-col">
                  {bookingFormContent}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </>
  );
}