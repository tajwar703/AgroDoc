import { useState, useEffect } from "react";
import {
  Cloud, CloudRain, CloudSnow, CloudLightning, Sun, Wind,
  Droplets, Eye, CloudDrizzle, Gauge,
  ChevronDown, ChevronUp,
  MapPin, RefreshCw, Navigation, AlertTriangle,
} from "lucide-react";

function getWeatherInfo(code) {
  if (code === 0)   return { label:"পরিষ্কার আকাশ",   icon:Sun,            color:"from-blue-500 to-sky-400"       };
  if (code <= 2)    return { label:"আংশিক মেঘলা",    icon:Cloud,          color:"from-blue-400 to-slate-400"     };
  if (code === 3)   return { label:"সম্পূর্ণ মেঘলা",  icon:Cloud,          color:"from-slate-500 to-gray-500"     };
  if (code <= 48)   return { label:"কুয়াশাচ্ছন্ন",    icon:Cloud,          color:"from-gray-400 to-slate-400"     };
  if (code <= 57)   return { label:"গুঁড়ি গুঁড়ি বৃষ্টি", icon:CloudDrizzle, color:"from-indigo-400 to-blue-500"   };
  if (code <= 65)   return { label:"বৃষ্টি",          icon:CloudRain,      color:"from-blue-600 to-indigo-600"    };
  if (code <= 77)   return { label:"তুষারপাত",        icon:CloudSnow,      color:"from-sky-300 to-blue-300"       };
  if (code <= 82)   return { label:"ঝরঝরে বৃষ্টি",    icon:CloudRain,      color:"from-indigo-600 to-purple-600"  };
  if (code <= 94)   return { label:"শিলাবৃষ্টি",      icon:CloudLightning, color:"from-slate-600 to-purple-700"   };
  return                   { label:"বজ্রঝড়",          icon:CloudLightning, color:"from-gray-700 to-slate-800"     };
}

function HourBar({ hour, temp, rain, code }) {
  const info = getWeatherInfo(code);
  const Icon = info.icon;
  const isNow = hour === "এখন";
  return (
    <div className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-2 rounded-xl min-w-[50px] ${isNow ? "bg-blue-500 text-white shadow-md" : "bg-gray-50 text-gray-600"}`}>
      <span className="text-[10px] font-bold">{hour}</span>
      <Icon size={16} className={isNow ? "text-white" : "text-gray-500"}/>
      <span className="text-xs font-black">{temp}°</span>
      {rain > 0 && (
        <div className="flex items-center gap-0.5">
          <Droplets size={8} className={isNow ? "text-blue-100" : "text-blue-500"}/>
          <span className="text-[9px] font-semibold">{rain}%</span>
        </div>
      )}
    </div>
  );
}

function LocationModal({ onAllow, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl overflow-hidden animate-[slideUp_0.2s_ease-out]">
        <div className="p-5 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
            <Navigation size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1.5">লোকেশন অ্যাক্সেস প্রয়োজন</h3>
          <p className="text-xs text-gray-500 mb-5 leading-relaxed">
            আপনার এলাকার সঠিক আবহাওয়া এবং ফসলের সতর্কতা পেতে লোকেশন পারমিশন দিন।
          </p>
          <div className="space-y-2">
            <button onClick={onAllow} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-md">
              অ্যাক্সেস দিন
            </button>
            <button onClick={onDismiss} className="w-full bg-gray-100 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm">
              এখন না
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function WeatherAlert({ compact = false }) {
  const [weather, setWeather]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [expanded, setExpanded]         = useState(false);
  const [locationName, setLocationName] = useState("আপনার এলাকা");
  const [showModal, setShowModal]       = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!navigator.geolocation) { setError("failed"); setLoading(false); return; }
      if (navigator.permissions) {
        navigator.permissions.query({ name: "geolocation" }).then((result) => {
          if (result.state === "granted") loadWeather();
          else if (result.state === "denied") { setError("denied"); setLoading(false); }
          else { setShowModal(true); setLoading(false); }
        }).catch(() => { setShowModal(true); setLoading(false); });
      } else {
        setShowModal(true);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  function handleAllowLocation() { setShowModal(false); loadWeather(); }
  function handleDismiss()       { setShowModal(false); setError("dismissed"); }

  async function loadWeather() {
    setLoading(true);
    setError(null);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          timeout: 10000,
          maximumAge: 900000,
          enableHighAccuracy: false,
        })
      );
      const { latitude: lat, longitude: lon } = pos.coords;

      try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bn`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          setLocationName(geoData.locality || geoData.city || geoData.principalSubdivision || "আপনার এলাকা");
        }
      } catch {}

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
        const ampm = targetHour >= 12 ? "pm" : "am";
        const dh   = targetHour % 12 || 12;
        slots.push({
          hour: i === 0 ? "এখন" : `${dh}${ampm}`,
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
    } catch (err) {
      setError(err.code === 1 ? "denied" : "failed");
    } finally {
      setLoading(false);
    }
  }

  if (showModal) return <LocationModal onAllow={handleAllowLocation} onDismiss={handleDismiss}/>;

  if (loading) return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0"/>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/2"/>
        <div className="h-2 bg-gray-50 rounded w-3/4"/>
      </div>
    </div>
  );

  if (error === "dismissed" || error === "denied" || error === "failed") return (
    <button
      onClick={error === "denied" ? loadWeather : () => setShowModal(true)}
      className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
        {error === "failed"
          ? <AlertTriangle size={18} className="text-red-500"/>
          : <MapPin size={18} className="text-blue-500"/>}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-gray-800">{error === "failed" ? "লোড করা যায়নি" : "লোকেশন প্রয়োজন"}</p>
        <p className="text-xs text-gray-500 mt-0.5">{error === "denied" ? "পারমিশন ব্লক করা আছে" : "লোকেশন চালু করতে ট্যাপ করুন"}</p>
      </div>
      <RefreshCw size={16} className="text-gray-400"/>
    </button>
  );

  if (!weather) return null;

  const info  = getWeatherInfo(weather.code);
  const WIcon = info.icon;

  /* ── Compact (sidebar) ── */
  if (compact) return (
    <div className={`w-full bg-gradient-to-r ${info.color} rounded-2xl p-3 flex items-center justify-between text-white shadow-sm animate-[popIn_0.5s_ease-out_both]`}>
      <div className="flex items-center gap-3">
        <WIcon size={24} className="text-white/90"/>
        <div>
          <div className="text-lg font-bold leading-none">{weather.temp}°C</div>
          <div className="text-[10px] font-medium opacity-90 truncate max-w-[120px]">{locationName}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold">{info.label}</div>
      </div>
    </div>
  );

  /* ── Full card ── */
  return (
    <>
      <style>{`
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.92) translateY(12px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

      <div className="w-full space-y-2 animate-[popIn_0.5s_ease-out_both]">
        {/* Main weather card */}
        <div className={`relative bg-gradient-to-br ${info.color} rounded-2xl p-4 text-white shadow-md`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5 opacity-90">
              <MapPin size={12}/>
              <span className="text-xs font-semibold truncate max-w-[200px]">{locationName}</span>
            </div>
            <button onClick={loadWeather} className="opacity-70 hover:opacity-100 transition-opacity">
              <RefreshCw size={12}/>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WIcon size={44} className="drop-shadow-sm opacity-90" strokeWidth={1.5}/>
              <div>
                <div className="text-4xl font-extrabold tracking-tight leading-none">{weather.temp}°</div>
                <p className="text-sm font-medium mt-1 opacity-90">{info.label}</p>
              </div>
            </div>
            <div className="text-right text-xs opacity-80 space-y-1">
              <p>অনুভূতি {weather.feelsLike}°</p>
              <div className="flex items-center gap-2 justify-end">
                <span className="flex items-center gap-1"><Droplets size={10}/> {weather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="flex items-center gap-1"><Wind size={10}/> {weather.wind} km/h</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/20">
            {[
              { icon:Droplets, value:`${weather.humidity}%`                                    },
              { icon:Wind,     value:`${weather.wind}km`                                       },
              { icon:Gauge,    value:`${weather.pressure}`                                     },
              { icon:Eye,      value: weather.visibility ? `${weather.visibility}km` : "—"    },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <s.icon size={12} className="opacity-70 mb-1"/>
                <span className="text-[10px] font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly forecast */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center justify-between px-4 py-3">
            <span className="text-xs font-bold text-gray-600">আজকের পূর্বাভাস</span>
            {expanded ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
          </button>
          {expanded && (
            <div className="px-3 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {weather.hourly.map((s, i) => <HourBar key={i} {...s}/>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}