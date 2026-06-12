import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  UserCircle, Edit3, Check, X,
  LogOut, Phone, MapPin, Sprout, ShieldCheck,
  LayoutDashboard, Store, Package, Truck, ScanLine, History
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
    { label:"কৃষি এজেন্সি", icon:<Truck size={16}/>,           path:"/agency"   },
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
        </div>
      </div>
    </aside>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({ name:"", location:"", farmSize:"", cropType:"" });
  const [editData, setEditData] = useState({ ...profileData });

  const displayName = profileData.name || user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setProfileData(d);
        setEditData(d);
      }
    } catch (_) {}
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { ...editData, updatedAt: serverTimestamp() }, { merge: true });
      if (editData.name) await updateProfile(user, { displayName: editData.name });
      setProfileData(editData);
      setEditing(false);
    } catch (_) {}
    setSaving(false);
  }

  const infoRows = [
    { label:"মোবাইল নম্বর", value: user?.phoneNumber || "—", icon:<Phone size={16} className="text-green-500"/> },
    { label:"এলাকা / গ্রাম",   value: profileData.location || "—",  icon:<MapPin size={16} className="text-blue-500"/> },
    { label:"জমির পরিমাণ",   value: profileData.farmSize || "—",   icon:<Sprout size={16} className="text-emerald-500"/> },
    { label:"প্রধান ফসল",     value: profileData.cropType || "—",   icon:<Sprout size={16} className="text-orange-500"/> },
  ];

  /* ── Core Render Functions (Fixes the typing focus issue) ── */
  
  const renderProfileCard = () => (
    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-xl shadow-green-500/10 overflow-hidden">
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full"/>
      <div className="absolute right-8 -bottom-12 w-32 h-32 bg-white/10 rounded-full"/>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-3 md:gap-6 md:items-center">
        <div className="flex items-start justify-between w-full md:w-auto">
          <div className="w-14 h-14 md:w-28 md:h-28 rounded-[14px] md:rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center flex-shrink-0 shadow-sm relative">
            {user?.photoURL
              ? <img src={user.photoURL} className="w-full h-full rounded-[14px] md:rounded-3xl object-cover" alt="avatar"/>
              : <UserCircle size={28} className="text-white/90 md:w-12 md:h-12"/>}
            <div className="absolute -bottom-1.5 -right-1.5 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
               <ShieldCheck size={12} className="text-white md:w-4 md:h-4" />
            </div>
          </div>
          
          {!editing && (
            <button onClick={() => { setEditData(profileData); setEditing(true); }}
              className="md:hidden w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-white/20 text-white">
              <Edit3 size={14} />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col md:justify-center mt-1 md:mt-0">
          <h2 className="text-white font-extrabold text-xl md:text-3xl tracking-tight leading-tight truncate">{displayName}</h2>
          <p className="text-green-50 text-[11px] md:text-sm font-medium mt-0.5 md:mt-1 truncate">{user?.phoneNumber || user?.email || "কৃষক প্রোফাইল"}</p>
          {profileData.location && (
            <div className="flex items-center gap-1.5 mt-2 md:mt-3 bg-white/20 w-fit px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/20">
              <MapPin size={12} className="text-white"/>
              <span className="text-white text-[10px] md:text-xs font-bold tracking-wider">{profileData.location}</span>
            </div>
          )}
        </div>

        {!editing && (
          <button onClick={() => { setEditData(profileData); setEditing(true); }}
            className="hidden md:flex w-auto h-10 bg-white/20 hover:bg-white/30 rounded-xl items-center justify-center gap-2 px-4 transition-colors shadow-sm border border-white/20 text-white font-bold text-sm">
            <Edit3 size={16} /> <span>সম্পাদনা</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderEditForm = () => (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm p-5 md:p-8 space-y-5 animate-[fadeInUp_0.4s_ease-out_both]">
      <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-3 flex items-center gap-2">
        <Edit3 size={16} className="text-gray-400" /> প্রোফাইল সম্পাদনা
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { key:"name",     label:"আপনার নাম",      placeholder:"নাম লিখুন" },
          { key:"location", label:"এলাকা / গ্রাম",   placeholder:"যেমন: ঢাকা, মিরপুর" },
          { key:"farmSize", label:"জমির পরিমাণ",    placeholder:"যেমন: ২ বিঘা" },
          { key:"cropType", label:"প্রধান ফসল",     placeholder:"যেমন: ধান, টমেটো" },
        ].map((f) => (
          <div key={f.key}>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">{f.label}</label>
            <input value={editData[f.key] || ""} onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-gray-50 transition-all"/>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2 md:pt-4 border-t border-gray-50">
        <button onClick={() => setEditing(false)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-bold py-3 md:py-3.5 rounded-xl transition-colors border border-gray-200">
          <X size={16}/> বাতিল
        </button>
        <button onClick={saveProfile} disabled={saving}
          className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold py-3 md:py-3.5 rounded-xl shadow-md shadow-green-500/25 transition-all active:scale-[0.98] disabled:opacity-50">
          <Check size={16}/> {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
        </button>
      </div>
    </div>
  );

  const renderInfoCard = () => (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-5 md:px-8 py-4 md:py-5 border-b border-gray-50 flex items-center gap-2">
        <UserCircle size={18} className="text-gray-400" />
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">ব্যক্তিগত তথ্যাবলি</h3>
      </div>
      <div className="p-2 md:p-4 flex-1">
        {infoRows.map((row, i) => (
          <div key={row.label} className={`flex items-center gap-3.5 md:gap-4 px-4 py-3 md:py-3.5 rounded-xl hover:bg-gray-50 transition-colors ${i !== infoRows.length-1 ? "mb-1" : ""}`}>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white border border-gray-100 shadow-sm rounded-xl md:rounded-[14px] flex items-center justify-center flex-shrink-0">{row.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] md:text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{row.label}</p>
              <p className="text-[13px] md:text-[14px] font-black text-gray-800 truncate">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAccountMeta = () => (
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm p-5 md:p-8 h-full flex flex-col">
      <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 md:mb-5 flex items-center gap-2">
         <ShieldCheck size={18} className="text-gray-400" /> অ্যাকাউন্টের তথ্য
      </h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
        {[
          { label:"ইউজার আইডি", value: user?.uid?.slice(0,8)+"..." },
          { label:"লগইন মাধ্যম", value: user?.phoneNumber ? "ফোন নম্বর" : "ইমেইল" },
          { label:"তৈরির তারিখ", value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("bn-BD") : "—" },
          { label:"শেষ লগইন", value: user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString("bn-BD") : "—" },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50/80 border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col justify-center hover:bg-gray-100 transition-colors">
            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-[12px] md:text-sm font-black text-gray-800 truncate">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden min-h-screen bg-[#FDFDFD] pb-24 relative flex flex-col w-full">
        <div className="w-full sticky top-0 z-50">
          <TopNav isDesktop={false} />
        </div>
        
        <div className="flex-1 px-4 pt-5 space-y-4 w-full max-w-md mx-auto">
          <div className={`transition-all duration-700 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            {renderProfileCard()}
          </div>
          <div className={`transition-all duration-700 delay-100 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            {editing ? renderEditForm() : renderInfoCard()}
          </div>
          <div className={`transition-all duration-700 delay-200 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            {renderAccountMeta()}
          </div>
          
          <div className={`transition-all duration-700 delay-300 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <button onClick={() => signOut(auth)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-[13px] font-bold py-3.5 rounded-2xl border border-red-100 transition-colors active:scale-95 shadow-sm mt-2">
              <LogOut size={16}/>
              লগআউট করুন
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full z-50">
          <BottomNav />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (2 Column Grid) ── */}
      <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
        <Sidebar user={user} displayName={displayName} navigate={navigate} />

        <main className="flex-1 ml-60 min-h-screen flex flex-col">
          <TopNav isDesktop={true} />

          <div className="flex-1 w-full max-w-[1200px] mx-auto py-8 px-8 flex flex-col gap-6">
            
            <div className={`flex items-center justify-between transition-all duration-700 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                  <UserCircle className="w-7 h-7 text-green-600" /> 
                  আমার প্রোফাইল
                </h1>
                <p className="text-sm text-gray-500 mt-1">আপনার ব্যক্তিগত তথ্য, ফার্মের ডিটেইলস এবং অ্যাকাউন্ট সেটিংস।</p>
              </div>
              
              <button onClick={() => signOut(auth)}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-5 py-2.5 rounded-xl border border-red-100 transition-all active:scale-95 shadow-sm">
                <LogOut size={16}/>
                লগআউট করুন
              </button>
            </div>

            {/* Top Row (Profile Card) */}
            <div className={`transition-all duration-700 delay-100 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              {renderProfileCard()}
            </div>

            {/* Bottom Row (2 Columns) */}
            <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all duration-700 delay-200 ease-out transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
              <div>
                {editing ? renderEditForm() : renderInfoCard()}
              </div>
              <div>
                {renderAccountMeta()}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}