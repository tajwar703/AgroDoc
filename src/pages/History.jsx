import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import {
  History, Leaf, Trash2, ChevronRight,
  CheckCircle2, ShieldAlert, AlertTriangle, SearchX, Loader2, Sprout,
  LogOut, LayoutDashboard, Store, Package, MapPin, Truck, UserCircle, ScanLine
} from "lucide-react";

import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import Loading from "../components/Loding";

const severityConfig = {
  "সুস্থ": {
    badge: "bg-green-100 text-green-700",
    border: "border-green-100",
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    dot: "bg-green-400",
  },
  "মাঝারি": {
    badge: "bg-orange-100 text-orange-700",
    border: "border-orange-100",
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    dot: "bg-orange-400",
  },
  "গুরুতর": {
    badge: "bg-red-100 text-red-700",
    border: "border-red-100",
    icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
    dot: "bg-red-400",
  },
};

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("bn-BD", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

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

export default function HistoryPage() {
  const [scans, setScans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [mounted, setMounted]   = useState(false);
  const { user }                = useAuth();
  const navigate                = useNavigate();

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => {
    setMounted(true);
    fetchScans();
  }, []);

  async function fetchScans() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "scans"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "scans", id));
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
    setDeleting(null);
  }

  function goToResult(scan) {
    navigate("/result", {
      state: {
        classIndex:  scan.classIndex,
        confidence:  scan.diseaseData?.confidence || (scan.confidence / 100),
        imageUrl:    scan.imageUrl || "",
        diseaseData: scan.diseaseData,
      },
    });
  }

  const renderScanCards = () => {
    return scans.map((scan, i) => {
      const cfg = severityConfig[scan.severity] || severityConfig["মাঝারি"];
      const cropNameDisplay = scan.cropName || scan.diseaseData?.cropName || scan.diseaseData?.plantPart || "অজানা ফসল";

      return (
        <div
          key={scan.id}
          onClick={() => goToResult(scan)}
          className={`group cursor-pointer bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm border ${cfg.border} overflow-hidden hover:shadow-lg transition-transform duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col opacity-0 animate-slideUpFade`}
          style={{ animationDelay: `${i * 100}ms` }} // Staggered delay based on index
        >
          <div className="flex items-center gap-0 h-full p-2">
            <div className="flex-shrink-0 w-24 h-24 relative overflow-hidden rounded-[1.5rem]">
              {scan.imageUrl ? (
                <img
                  src={scan.imageUrl}
                  alt={scan.diseaseName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Leaf className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <span className={`absolute top-2 left-2 w-3 h-3 rounded-full ${cfg.dot} ring-2 ring-white shadow-sm`} />
            </div>

            <div className="flex-1 px-4 py-2 min-w-0 flex flex-col justify-center">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl w-fit ${cfg.badge}`}>
                {cropNameDisplay}
              </span>
              <p className="font-bold text-gray-800 text-[15px] mt-1.5 leading-tight truncate group-hover:text-green-600 transition-colors">
                {scan.diseaseName}
              </p>
              <p className="text-gray-400 text-[11px] mt-1 font-medium">{formatDate(scan.createdAt)}</p>
              <p className="text-blue-500 text-[11px] font-bold mt-0.5">নিশ্চয়তা: {scan.confidence}%</p>
            </div>

            <div className="pr-2 flex items-center justify-center z-10">
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(scan.id); }}
                disabled={deleting === scan.id}
                className="w-10 h-10 bg-red-50/80 hover:bg-red-100 rounded-[14px] flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-50"
                title="মুছে ফেলুন"
              >
                {deleting === scan.id
                  ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  : <Trash2 className="w-4 h-4 text-red-500" />
                }
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  /* ── MOBILE LAYOUT ── */
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100 via-gray-50 to-white pb-24 flex flex-col items-center w-full relative">

      {/* Full-screen centered loader — mobile */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc]">
          <Loading />
        </div>
      )}

      <div className="w-full sticky top-0 z-50">
        <TopNav isDesktop={false} />
      </div>

      <div className={`w-full max-w-md px-4 py-6 space-y-4 transition-all duration-300 ease-out transform ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}>

        {!loading && (
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-800">স্ক্যান ইতিহাস</h1>
              <p className="text-gray-500 text-xs mt-0.5">{scans.length} টি রিপোর্ট পাওয়া গেছে</p>
            </div>
          </div>
        )}

        {!loading && scans.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white p-10 flex flex-col items-center gap-4 text-center opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <SearchX className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-gray-700 text-lg">কোনো স্ক্যান নেই</p>
              <p className="text-gray-500 text-sm mt-1">এখনো কোনো গাছ স্ক্যান করেননি</p>
            </div>
            <button
              onClick={() => navigate("/scanner")}
              className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-green-500/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Leaf className="w-4 h-4" /> প্রথম স্ক্যান করুন
            </button>
          </div>
        )}

        {!loading && scans.length > 0 && (
          <div className="space-y-4">
            {renderScanCards()}
          </div>
        )}

        {!loading && scans.length > 0 && (
          <button
            onClick={() => navigate("/scanner")}
            className="w-full group bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-green-500/10 border border-white/80 p-5 flex items-center gap-5 text-left transition-all duration-200 hover:-translate-y-1 active:scale-[0.98] mt-4 opacity-0 animate-slideUpFade"
            style={{ animationDelay: `${(scans.length * 100) + 100}ms` }}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-sm">নতুন স্ক্যান করুন</p>
              <p className="text-gray-500 text-xs">আরেকটি গাছের পাতা পরীক্ষা করুন</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
          </button>
        )}
      </div>
      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav />
      </div>
    </div>
  );

  /* ── DESKTOP LAYOUT ── */
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate} />

      {/* Full-screen centered loader — desktop */}
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
                  <History className="w-7 h-7 text-green-600" /> 
                  আপনার স্ক্যান ইতিহাস
                </h1>
                <p className="text-sm text-gray-500 mt-1">পূর্বে স্ক্যান করা সকল ফসলের রিপোর্ট এখানে সেভ করা আছে।</p>
              </div>
              
              {scans.length > 0 && (
                <button
                  onClick={() => navigate("/scanner")}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                >
                  <Leaf className="w-4 h-4" /> নতুন স্ক্যান
                </button>
              )}
            </div>

            {scans.length === 0 && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-5 text-center mt-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                  <SearchX className="w-12 h-12 text-gray-300" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-xl">স্ক্যান হিস্ট্রি ফাঁকা!</p>
                  <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">আপনি এখনো কোনো গাছের ছবি স্ক্যান করেননি। আপনার ফসলের রোগ নির্ণয় করতে এখনই স্ক্যানার ব্যবহার করুন।</p>
                </div>
                <button
                  onClick={() => navigate("/scanner")}
                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-green-500/25 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Leaf className="w-5 h-5" /> প্রথম স্ক্যান করুন
                </button>
              </div>
            )}

            {scans.length > 0 && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-5 mt-4">
                {renderScanCards()}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );

  return (
    <>
      {/* ── CUSTOM ANIMATIONS ── */}
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
      
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}