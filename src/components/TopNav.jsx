import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell, UserCircle, Store, ShoppingCart,
  CloudRain, Sun, Cloud, CloudLightning, CloudSnow, CloudDrizzle,
  Loader2, X, Sprout, AlertTriangle, CheckCircle, Info,
} from "lucide-react";

/* ── Logo ── */
function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-lg text-xl font-black shadow-sm -rotate-3 inline-block">Agro</span>
      <span className="text-xl font-black text-gray-800 tracking-tight">Doc.</span>
    </div>
  );
}

/* ── Weather code → meta ── */
function getWeatherMeta(code) {
  if (code === 0)  return { Icon: Sun,            label: "পরিষ্কার আকাশ",      color: "text-yellow-500" };
  if (code <= 2)   return { Icon: Cloud,          label: "আংশিক মেঘলা",        color: "text-slate-400"  };
  if (code === 3)  return { Icon: Cloud,          label: "সম্পূর্ণ মেঘলা",      color: "text-gray-500"   };
  if (code <= 48)  return { Icon: Cloud,          label: "কুয়াশা",              color: "text-gray-400"   };
  if (code <= 57)  return { Icon: CloudDrizzle,   label: "গুঁড়ি গুঁড়ি বৃষ্টি", color: "text-blue-400"   };
  if (code <= 65)  return { Icon: CloudRain,      label: "বৃষ্টি",               color: "text-blue-600"   };
  if (code <= 77)  return { Icon: CloudSnow,      label: "তুষারপাত",            color: "text-sky-400"    };
  if (code <= 82)  return { Icon: CloudRain,      label: "ভারী বৃষ্টি",         color: "text-indigo-600" };
  if (code <= 94)  return { Icon: CloudLightning, label: "শিলাবৃষ্টি",          color: "text-purple-600" };
  return           { Icon: CloudLightning,        label: "বজ্রঝড়",              color: "text-red-600"    };
}

/* ── severity → style ── */
function getSeverityStyle(severity) {
  if (severity === "danger") return { Icon: AlertTriangle, iconCls: "text-red-500",   bg: "bg-red-50",   border: "border-red-100",   text: "text-red-800"   };
  if (severity === "warn")   return { Icon: AlertTriangle, iconCls: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-800" };
  if (severity === "info")   return { Icon: Info,          iconCls: "text-blue-500",  bg: "bg-blue-50",  border: "border-blue-100",  text: "text-blue-800"  };
  return                     { Icon: CheckCircle,   iconCls: "text-green-500", bg: "bg-green-50", border: "border-green-100", text: "text-green-800" };
}

/* ── Fetch weather from open-meteo ── */
async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
    `&timezone=auto`;
  const res  = await fetch(url);
  const data = await res.json();
  const c    = data.current;
  return {
    temp:     Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m,
    wind:     Math.round(c.wind_speed_10m),
    rain:     c.precipitation,
    code:     c.weather_code,
  };
}

/* ── OpenRouter → short notification list ── */
async function fetchNotifications(weather) {
  const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  const meta = getWeatherMeta(weather.code);

  const prompt = `তুমি একজন বাংলাদেশি কৃষি বিশেষজ্ঞ। নিচের আবহাওয়া দেখে কৃষকদের জন্য সর্বোচ্চ ৩টি সংক্ষিপ্ত notification তৈরি করো।

আবহাওয়া: ${meta.label}
তাপমাত্রা: ${weather.temp}°C
আর্দ্রতা: ${weather.humidity}%
বাতাস: ${weather.wind} km/h
বৃষ্টিপাত: ${weather.rain} mm

নিয়ম:
- প্রতিটি notification ঠিক এই format এ লিখবে: [severity]|[notification text]
- severity হবে: good, info, warn, অথবা danger
- notification text বাংলায়, সর্বোচ্চ ১০ শব্দ, সরাসরি কার্যকর পরামর্শ
- উদাহরণ format:
  warn|মেঘলা আবহাওয়া — ছত্রাক রোগের ঝুঁকি বেশি
  info|হালকা বৃষ্টি — সেচ দেওয়ার প্রয়োজন নেই
  danger|বজ্রঝড় — মাঠে কাজ বন্ধ রাখুন
- শুধু notifications লিখবে, অন্য কিছু নয়
- অবশ্যই বাংলায় লিখবে`;

  const models = [
    "openrouter/free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-4-scout:free",
    "qwen/qwen3-8b:free",
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer":  window.location.origin,
          "X-Title":       "AgroDoc",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn(`Model ${model} failed:`, res.status, errData);
        lastError = errData;
        continue; 
      }

      const data = await res.json();
      const raw  = data.choices?.[0]?.message?.content || "";

      if (!raw.trim()) continue;

      const parsed = raw
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.includes("|"))
        .map(l => {
          const [sev, ...rest] = l.split("|");
          const severity = sev.trim().toLowerCase().replace(/[^a-z]/g, "");
          return {
            severity: ["good","info","warn","danger"].includes(severity) ? severity : "info",
            text: rest.join("|").trim(),
          };
        })
        .filter(n => n.text.length > 2)
        .slice(0, 3);

      if (parsed.length > 0) return parsed;

    } catch (err) {
      console.warn(`Model ${model} error:`, err);
      lastError = err;
      continue;
    }
  }

  console.error("All models failed:", lastError);
  return getDefaultNotifications(weather);
}

/* ── Default notifications ── */
function getDefaultNotifications(weather) {
  const notifications = [];
  
  if (weather.temp > 35) {
    notifications.push({ severity: "danger", text: "অতিরিক্ত গরম — ফসলে সেচ দিন" });
  } else if (weather.temp > 30) {
    notifications.push({ severity: "warn", text: "গরম আবহাওয়া — সকালে সেচ দিন" });
  } else {
    notifications.push({ severity: "good", text: "আবহাওয়া অনুকূল — চাষাবাদ করুন" });
  }

  if (weather.humidity > 85) {
    notifications.push({ severity: "warn", text: "আর্দ্রতা বেশি — ছত্রাক রোগের ঝুঁকি" });
  } else if (weather.humidity < 40) {
    notifications.push({ severity: "info", text: "আর্দ্রতা কম — সেচ প্রয়োজন হতে পারে" });
  }

  if (weather.rain > 5) {
    notifications.push({ severity: "info", text: "বৃষ্টি হচ্ছে — সেচের প্রয়োজন নেই" });
  }

  if (weather.wind > 30) {
    notifications.push({ severity: "warn", text: "ঝড়ো বাতাস — ফসল রক্ষার ব্যবস্থা নিন" });
  }

  return notifications.slice(0, 3);
}

/* ══════════════════════════════════════
   Notification Dropdown
══════════════════════════════════════ */
function NotificationDropdown({ onClose }) {
  const [phase,   setPhase]   = useState("idle");
  const [weather, setWeather] = useState(null);
  const [notifs,  setNotifs]  = useState([]);
  const [errMsg,  setErrMsg]  = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  useEffect(() => { load(); }, []);

  async function load() {
    setPhase("locating");
    setErrMsg("");
    setNotifs([]);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          timeout: 10000, maximumAge: 900000, enableHighAccuracy: false,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setPhase("loading");
      const w = await fetchWeather(lat, lon);
      setWeather(w);
      const n = await fetchNotifications(w);
      setNotifs(n);
      setPhase("done");
    } catch (err) {
      console.error("Load error:", err);
      setErrMsg(err.code === 1 ? "লোকেশন পারমিশন দিন" : "লোড করা যায়নি");
      setPhase("error");
    }
  }

  const meta = weather ? getWeatherMeta(weather.code) : null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-14 w-80 bg-white/95 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-gray-100 z-[200] overflow-hidden"
      style={{ animation: "dropIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-12px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/50 bg-white/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
            <Sprout size={16} className="text-green-600"/>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-gray-800 leading-tight">কৃষি বিজ্ঞপ্তি</h3>
            <p className="text-[10px] text-gray-500 font-medium">AI আবহাওয়া আপডেট</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200"
        >
          <X size={14} className="text-gray-500"/>
        </button>
      </div>

      <div className="p-4 space-y-3">

        {/* Loading */}
        {(phase === "locating" || phase === "loading") && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 size={28} className="text-green-500 animate-spin"/>
            <p className="text-xs text-gray-500 font-semibold">
              {phase === "locating" ? "লোকেশন চেক করা হচ্ছে…" : "AI বিশ্লেষণ করছে…"}
            </p>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-3 py-10 bg-red-50/50 rounded-2xl border border-red-100/50">
            <AlertTriangle size={24} className="text-red-400"/>
            <p className="text-sm text-red-600 font-semibold text-center px-4">{errMsg}</p>
            <button
              onClick={load}
              className="text-[11px] bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition-colors shadow-sm active:scale-95"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Done */}
        {phase === "done" && (
          <>
            {/* Weather pill */}
            {meta && (
              <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-[1.25rem] px-4 py-3 shadow-sm">
                <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100`}>
                   <meta.Icon size={18} className={meta.color}/>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">বর্তমান আবহাওয়া</p>
                   <p className="text-[13px] font-bold text-gray-800">{meta.label}</p>
                </div>
                <div className="text-right">
                   <span className="text-2xl font-black text-gray-900 tracking-tighter">{weather.temp}°</span>
                </div>
              </div>
            )}

            {/* Notification cards */}
            <div className="space-y-2 pt-1">
              {notifs.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 font-medium">কোনো বিশেষ বিজ্ঞপ্তি নেই</div>
              ) : (
                notifs.map((n, i) => {
                  const s = getSeverityStyle(n.severity);
                  return (
                    <div
                      key={i}
                      style={{ animation: `fadeUp 0.4s ease-out ${i * 100}ms both` }}
                      className={`flex items-start gap-3 ${s.bg} border ${s.border} rounded-2xl px-4 py-3 shadow-sm`}
                    >
                      <s.Icon size={16} className={`${s.iconCls} flex-shrink-0 mt-0.5`}/>
                      <p className={`text-[13px] font-bold ${s.text} leading-snug`}>{n.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Refresh */}
            <div className="pt-2">
              <button
                onClick={load}
                className="w-full bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 hover:bg-green-50 text-xs font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                রিফ্রেশ করুন ↻
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TopNav
══════════════════════════════════════ */
export default function TopNav({ isDesktop = false }) {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();
  const { cartItems } = useCart();

  const [showNotif, setShowNotif] = useState(false);
  const toggleNotif = useCallback(() => setShowNotif(p => !p), []);
  const closeNotif  = useCallback(() => setShowNotif(false), []);

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";
  const isShopPage  = location.pathname.includes("/shop");
  const cartCount   = cartItems?.length || 0;

  const getPageTitle = () => {
    if (location.pathname === "/") return "ড্যাশবোর্ড";
    if (location.pathname === "/shop") return "দোকান";
    if (location.pathname === "/scanner") return "AI স্ক্যানার";
    if (location.pathname === "/history") return "ইতিহাস";
    if (location.pathname === "/orders") return "আমার অর্ডার";
    if (location.pathname === "/profile") return "প্রোফাইল";
    return "AgroDoc";
  };

  const BellBtn = ({ iconSize = 16, className = "" }) => (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleNotif}
        className={`relative w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm
          ${showNotif
            ? "bg-green-100 border border-green-200"
            : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
      >
        <Bell size={iconSize} className={showNotif ? "text-green-600" : "text-gray-600"} strokeWidth={2.5}/>
        {!showNotif && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white shadow-sm"/>
        )}
      </button>
      {showNotif && <NotificationDropdown onClose={closeNotif}/>}
    </div>
  );

  /* ── DESKTOP (SaaS / Premium Style) ── */
  if (isDesktop) {
    return (
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-8 py-4 flex items-center justify-between">
        
        {/* Left Side: Page Context (Optional/Subtle) */}
        <div>
           <h2 className="text-[16px] font-extrabold text-gray-800 tracking-tight">
             {getPageTitle()}
           </h2>
           <p className="text-[11px] font-semibold text-gray-400 mt-0.5 uppercase tracking-widest">
             Overview
           </p>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Shop Button */}
          {!isShopPage && (
            <button
              onClick={() => navigate("/shop")}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-bold rounded-[14px] px-4 py-2 text-[13px] shadow-sm shadow-orange-500/20 transition-all active:scale-95"
            >
              <Store size={15} strokeWidth={2.5}/> দোকান
            </button>
          )}

          {/* Cart Button */}
          {isShopPage && (
            <button
              onClick={() => navigate("/cart")}
              className="relative w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-[14px] flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <ShoppingCart size={17} className="text-gray-700" strokeWidth={2.5}/>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications */}
          <BellBtn iconSize={17} />

          {/* Profile Dropdown / Pill */}
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-[16px] p-1.5 pr-4 transition-all active:scale-95 shadow-sm ml-1"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center overflow-hidden border border-green-200/50 shadow-sm">
              {user?.photoURL
                ? <img src={user.photoURL} className="w-full h-full object-cover" alt="avatar"/>
                : <UserCircle size={18} className="text-white" strokeWidth={2}/>}
            </div>
            <div className="flex flex-col items-start justify-center">
              <span className="text-[13px] font-bold text-gray-800 leading-none">{displayName}</span>
              <span className="text-[10px] font-semibold text-gray-400 mt-0.5">কৃষক প্রোফাইল</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ── MOBILE ── */
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <Logo/>
      
      <div className="flex items-center gap-2.5">
        {isShopPage && (
          <button
            onClick={() => navigate("/cart")}
            className="relative w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-[14px] flex items-center justify-center transition-all shadow-sm"
          >
            <ShoppingCart size={18} className="text-gray-700" strokeWidth={2.5}/>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        )}
        
        <BellBtn iconSize={18}/>
        
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[14px] flex items-center justify-center shadow-md shadow-green-500/20 active:scale-95 transition-transform overflow-hidden border border-green-200/50"
        >
          {user?.photoURL
            ? <img src={user.photoURL} className="w-full h-full object-cover" alt="avatar"/>
            : <UserCircle size={20} className="text-white" strokeWidth={2}/>}
        </button>
      </div>
    </div>
  );
}