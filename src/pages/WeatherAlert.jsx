import { useState, useEffect } from "react";
import {
  Cloud, CloudRain, CloudSnow, CloudLightning, Sun, Wind,
  Droplets, Thermometer, Eye, CloudDrizzle, Gauge,
  AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
  MapPin, RefreshCw, Loader2, Navigation, X,
} from "lucide-react";

function getWeatherInfo(code) {
  if (code === 0)   return { label:"পরিষ্কার আকাশ",      icon:Sun,           color:"from-amber-400 to-yellow-400",   bg:"bg-amber-50",  text:"text-amber-700",  alert:null };
  if (code <= 2)    return { label:"আংশিক মেঘলা",        icon:Cloud,         color:"from-sky-400 to-blue-400",       bg:"bg-sky-50",    text:"text-sky-700",    alert:null };
  if (code === 3)   return { label:"সম্পূর্ণ মেঘলা",     icon:Cloud,         color:"from-gray-400 to-slate-500",     bg:"bg-gray-50",   text:"text-gray-700",   alert:"মেঘলা আবহাওয়া — ছত্রাক রোগের ঝুঁকি বেশি" };
  if (code <= 48)   return { label:"কুয়াশাচ্ছন্ন",       icon:Cloud,         color:"from-gray-300 to-gray-400",      bg:"bg-gray-50",   text:"text-gray-600",   alert:"কুয়াশায় পাতায় ছত্রাক জন্মাতে পারে" };
  if (code <= 57)   return { label:"গুঁড়ি গুঁড়ি বৃষ্টি",icon:CloudDrizzle, color:"from-blue-400 to-cyan-500",      bg:"bg-blue-50",   text:"text-blue-700",   alert:"হালকা বৃষ্টি — সেচ দেওয়ার প্রয়োজন নেই" };
  if (code <= 65)   return { label:"বৃষ্টি",              icon:CloudRain,     color:"from-blue-500 to-indigo-500",    bg:"bg-blue-50",   text:"text-blue-700",   alert:"বৃষ্টির পানি জমলে শিকড় পচে যেতে পারে" };
  if (code <= 77)   return { label:"তুষারপাত",            icon:CloudSnow,     color:"from-sky-200 to-blue-300",       bg:"bg-sky-50",    text:"text-sky-700",    alert:"তুষারপাত — ফসল ঢেকে রাখুন" };
  if (code <= 82)   return { label:"ঝরঝরে বৃষ্টি",       icon:CloudRain,     color:"from-blue-500 to-indigo-600",    bg:"bg-blue-50",   text:"text-blue-700",   alert:"ভারী বৃষ্টি — জমিতে জলাবদ্ধতা এড়ান" };
  if (code <= 94)   return { label:"শিলাবৃষ্টি",         icon:CloudLightning,color:"from-purple-500 to-violet-600",  bg:"bg-purple-50", text:"text-purple-700", alert:"⚠️ শিলাবৃষ্টি — ফসল ক্ষতিগ্রস্ত হতে পারে!" };
  return                   { label:"বজ্রঝড়",             icon:CloudLightning,color:"from-red-500 to-rose-600",       bg:"bg-red-50",    text:"text-red-700",    alert:"⛈️ বজ্রঝড় — মাঠে কাজ বন্ধ রাখুন!" };
}

function getAlertSeverity(code) {
  if (code === 0 || code <= 2) return "good";
  if (code <= 57)               return "info";
  if (code <= 77)               return "warn";
  return                         "danger";
}

const SEV = {
  good:   { bg:"bg-green-50",  border:"border-green-200",  icon:CheckCircle,   iconColor:"text-green-500",  text:"text-green-800"  },
  info:   { bg:"bg-blue-50",   border:"border-blue-200",   icon:Info,          iconColor:"text-blue-500",   text:"text-blue-800"   },
  warn:   { bg:"bg-amber-50",  border:"border-amber-200",  icon:AlertTriangle, iconColor:"text-amber-500",  text:"text-amber-800"  },
  danger: { bg:"bg-red-50",    border:"border-red-200",    icon:AlertTriangle, iconColor:"text-red-500",    text:"text-red-800"    },
};

function HourBar({ hour, temp, rain, code }) {
  const info = getWeatherInfo(code);
  const Icon = info.icon;
  const isNow = hour === "এখন";
  return (
    <div className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl min-w-[58px] ${isNow ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-white/60"}`}>
      <span className={`text-[10px] font-bold ${isNow ? "text-green-100" : "text-gray-400"}`}>{hour}</span>
      <Icon size={18} className={isNow ? "text-white" : info.text}/>
      <span className={`text-sm font-black ${isNow ? "text-white" : "text-gray-700"}`}>{temp}°</span>
      {rain > 0 && (
        <div className="flex items-center gap-0.5">
          <Droplets size={9} className={isNow ? "text-green-200" : "text-blue-400"}/>
          <span className={`text-[9px] font-semibold ${isNow ? "text-green-100" : "text-blue-500"}`}>{rain}%</span>
        </div>
      )}
    </div>
  );
}

/* ── Location Permission Modal ── */
function LocationModal({ onAllow, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]">
        {/* Top gradient strip */}
        <div className="h-2 bg-gradient-to-r from-sky-400 to-blue-500"/>
        <div className="p-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Navigation size={28} className="text-white"/>
          </div>
          <h3 className="text-lg font-extrabold text-gray-800 text-center mb-1">লোকেশন অ্যাক্সেস</h3>
          <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
            আপনার এলাকার সঠিক আবহাওয়া ও কৃষি পরামর্শ পেতে লোকেশন অনুমতি দিন।
          </p>

          {/* Benefits */}
          <div className="space-y-2.5 mb-6">
            {[
              { emoji:"🌤️", text:"রিয়েল-টাইম আবহাওয়া তথ্য" },
              { emoji:"🌾", text:"ফসলের জন্য বিশেষ কৃষি পরামর্শ" },
              { emoji:"⛈️", text:"দুর্যোগের আগাম সতর্কতা" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2.5">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-semibold text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <button
            onClick={onAllow}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm mb-2.5"
          >
            লোকেশন চালু করুন
          </button>
          <button
            onClick={onDismiss}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold py-3 rounded-2xl transition-colors text-sm"
          >
            এখন না
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function WeatherAlert({ compact = false }) {
  const [weather, setWeather]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);   // null | "denied" | "failed" | "ask"
  const [expanded, setExpanded]       = useState(false);
  const [locationName, setLocationName] = useState("আপনার এলাকা");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal]     = useState(false);

  useEffect(() => {
    // Check permission status without triggering a prompt
    if (!navigator.geolocation) { setError("failed"); return; }
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          loadWeather();
        } else if (result.state === "denied") {
          setError("denied");
        } else {
          // "prompt" — show our beautiful modal first
          setShowModal(true);
        }
      }).catch(() => setShowModal(true));
    } else {
      // Fallback: just show modal
      setShowModal(true);
    }
  }, []);

  function handleAllowLocation() {
    setShowModal(false);
    loadWeather();
  }

  function handleDismiss() {
    setShowModal(false);
    setError("dismissed");
  }

  async function loadWeather() {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;

      // Reverse geocode
      try {
        const geoRes  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=bn`);
        const geoData = await geoRes.json();
        const addr    = geoData.address;
        setLocationName(addr.village || addr.suburb || addr.city_district || addr.city || addr.county || addr.state || "আপনার এলাকা");
      } catch (_) {}

      // Weather from Open-Meteo
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure,visibility` +
        `&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=1`;

      const res  = await fetch(url);
      const data = await res.json();
      const c    = data.current;
      const h    = data.hourly;

      const now     = new Date();
      const nowHour = now.getHours();
      const slots   = [];
      for (let i = 0; i < 24 && slots.length < 8; i++) {
        const targetHour = (nowHour + i) % 24;
        const idx = h.time.findIndex((t) => {
          const d = new Date(t);
          return d.getHours() === targetHour && d.getDate() >= now.getDate();
        });
        if (idx === -1) continue;
        slots.push({
          hour: i === 0 ? "এখন" : `${targetHour}টা`,
          temp: Math.round(h.temperature_2m[idx]),
          rain: h.precipitation_probability[idx] ?? 0,
          code: h.weather_code[idx],
        });
      }

      setWeather({
        temp:       Math.round(c.temperature_2m),
        feelsLike:  Math.round(c.apparent_temperature),
        humidity:   c.relative_humidity_2m,
        wind:       Math.round(c.wind_speed_10m),
        pressure:   Math.round(c.surface_pressure),
        visibility: c.visibility != null ? (c.visibility / 1000).toFixed(1) : null,
        code:       c.weather_code,
        rain:       c.precipitation,
        hourly:     slots,
      });
      setLastUpdated(new Date().toLocaleTimeString("bn-BD", { hour:"2-digit", minute:"2-digit" }));
    } catch (err) {
      if (err.code === 1) setError("denied");
      else                setError("failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Location modal
  if (showModal) return <LocationModal onAllow={handleAllowLocation} onDismiss={handleDismiss}/>;

  // ── Loading
  if (loading) return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-sm p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0">
        <Loader2 size={18} className="text-sky-500 animate-spin"/>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700">আবহাওয়া লোড হচ্ছে...</p>
        <p className="text-xs text-gray-400 mt-0.5">আপনার এলাকার তথ্য আনা হচ্ছে</p>
      </div>
    </div>
  );

  // ── Dismissed
  if (error === "dismissed") return (
    <button
      onClick={() => setShowModal(true)}
      className="w-full bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="w-9 h-9 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Cloud size={17} className="text-sky-500"/>
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-sky-800">আবহাওয়া দেখুন</p>
        <p className="text-xs text-sky-500 mt-0.5">লোকেশন চালু করতে ট্যাপ করুন</p>
      </div>
      <Navigation size={16} className="text-sky-400 flex-shrink-0"/>
    </button>
  );

  // ── Denied
  if (error === "denied") return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
        <MapPin size={18} className="text-amber-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-800">লোকেশন ব্লক করা আছে</p>
        <p className="text-xs text-amber-600 mt-0.5">ব্রাউজার সেটিংসে গিয়ে লোকেশন অনুমতি দিন</p>
      </div>
      <button onClick={loadWeather} className="w-8 h-8 bg-amber-100 hover:bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
        <RefreshCw size={14} className="text-amber-600"/>
      </button>
    </div>
  );

  // ── Failed
  if (error === "failed" || !weather) return (
    <div className="w-full bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
        <AlertTriangle size={18} className="text-red-500"/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-red-800">আবহাওয়া লোড হয়নি</p>
        <p className="text-xs text-red-600 mt-0.5">ইন্টারনেট চেক করে আবার চেষ্টা করুন</p>
      </div>
      <button onClick={loadWeather} className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
        <RefreshCw size={14} className="text-red-500"/>
      </button>
    </div>
  );

  const info    = getWeatherInfo(weather.code);
  const sev     = getAlertSeverity(weather.code);
  const sevSt   = SEV[sev];
  const WIcon   = info.icon;
  const AIcon   = sevSt.icon;

  // ── COMPACT mode
  if (compact) return (
    <button onClick={() => setExpanded(p => !p)}
      className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-3.5 flex items-center gap-3 text-left hover:shadow-md active:scale-[0.98] transition-all">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center flex-shrink-0`}>
        <WIcon size={17} className="text-white"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-gray-800">{weather.temp}°C</span>
          <span className="text-xs font-semibold text-gray-400">{info.label}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={9} className="text-gray-300"/>
          <span className="text-[10px] text-gray-400 truncate">{locationName}</span>
        </div>
      </div>
      <AIcon size={14} className={`${sevSt.iconColor} flex-shrink-0`}/>
    </button>
  );

  // ── FULL mode
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Cloud size={13} className="text-white"/>
          </div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">আবহাওয়া সতর্কতা</h2>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[10px] text-gray-300 font-medium">{lastUpdated}</span>}
          <button onClick={loadWeather} className="w-6 h-6 bg-gray-50 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors">
            <RefreshCw size={11} className="text-gray-400"/>
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className={`relative bg-gradient-to-br ${info.color} rounded-3xl overflow-hidden shadow-lg`}>
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/15 rounded-full pointer-events-none"/>
        <div className="absolute right-8 -bottom-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none"/>
        <div className="relative z-10 p-5">
          {/* Location + date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
              <MapPin size={11} className="text-white/90"/>
              <span className="text-white/90 text-[11px] font-semibold truncate max-w-[130px]">{locationName}</span>
            </div>
            <span className="text-white/70 text-[11px] font-medium">
              {new Date().toLocaleDateString("bn-BD", { weekday:"long", day:"numeric", month:"long" })}
            </span>
          </div>
          {/* Temp */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-white text-5xl font-black leading-none tracking-tight">
                {weather.temp}°<span className="text-2xl font-bold text-white/70 ml-1">C</span>
              </div>
              <p className="text-white/80 text-sm font-semibold mt-1.5">{info.label}</p>
              <p className="text-white/60 text-xs mt-0.5">অনুভূতি {weather.feelsLike}°C</p>
            </div>
            <WIcon size={64} className="text-white/25" strokeWidth={1.5}/>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon:Droplets,     label:"আর্দ্রতা",    value:`${weather.humidity}%`                                    },
              { icon:Wind,         label:"বাতাস",        value:`${weather.wind}কিমি`                                     },
              { icon:Gauge,        label:"চাপ",          value:`${weather.pressure}`                                     },
              { icon:Eye,          label:"দৃশ্যমানতা",  value: weather.visibility ? `${weather.visibility}কিমি` : "—" },
            ].map((s) => {
              const SI = s.icon;
              return (
                <div key={s.label} className="bg-white/20 rounded-2xl p-2.5 flex flex-col items-center gap-1 text-center">
                  <SI size={14} className="text-white/80"/>
                  <span className="text-white text-[11px] font-bold">{s.value}</span>
                  <span className="text-white/60 text-[9px] font-medium">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {info.alert ? (
        <div className={`${sevSt.bg} border ${sevSt.border} rounded-2xl px-4 py-3 flex items-start gap-3`}>
          <AIcon size={16} className={`${sevSt.iconColor} mt-0.5 flex-shrink-0`}/>
          <div>
            <p className={`text-xs font-bold ${sevSt.text}`}>কৃষি পরামর্শ</p>
            <p className={`text-xs ${sevSt.text} opacity-80 mt-0.5 leading-relaxed`}>{info.alert}</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={16} className="text-green-500 flex-shrink-0"/>
          <p className="text-xs font-semibold text-green-700">আবহাওয়া ভালো — ফসলের জন্য উপযুক্ত দিন ✅</p>
        </div>
      )}

      {/* Hourly forecast */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">আজকের পূর্বাভাস</span>
          {expanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
        </button>
        {expanded && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {weather.hourly.map((s, i) => <HourBar key={i} {...s}/>)}
            </div>
            {weather.hourly.some(s => s.rain > 0) && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">বৃষ্টির সম্ভাবনা</p>
                <div className="flex gap-1 items-end h-8">
                  {weather.hourly.map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="w-full rounded-t-lg bg-blue-400/70" style={{ height:`${Math.max(2,(s.rain/100)*28)}px` }}/>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  {weather.hourly.map((s, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[8px] text-gray-300 font-medium">{s.hour === "এখন" ? "এখন" : s.hour.replace("টা","")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}