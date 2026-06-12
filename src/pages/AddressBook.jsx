import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  ArrowLeft, MapPin, Plus, Trash2, Edit2, Home, Phone, Map, ChevronRight,
  LogOut, LayoutDashboard, Store, Package, Truck, UserCircle, ScanLine, History, SearchX, Loader2
} from "lucide-react";

import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import Loading from "../components/Loding";

const DIVISIONS = [
  "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"
];

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

/* ════════════ MAIN COMPONENT ════════════ */
export default function AddressBook() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    division: "ঢাকা",
    district: "",
    upazila: "",
    details: ""
  });

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const q = query(collection(db, "addresses"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAddresses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.district || !formData.upazila || !formData.details) {
      alert("অনুগ্রহ করে সব তথ্য দিন");
      return;
    }

    setSaving(true);

    const addressData = {
      ...formData,
      userId: user.uid,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "addresses", editingId), addressData);
      } else {
        addressData.createdAt = serverTimestamp();
        await addDoc(collection(db, "addresses"), addressData);
      }
      await fetchAddresses();
      closeForm();
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে ঠিকানাটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "addresses", id));
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const editAddress = (address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      division: address.division || "ঢাকা",
      district: address.district,
      upazila: address.upazila,
      details: address.details
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", division: "ঢাকা", district: "", upazila: "", details: "" });
  };

  /* ── UI Content ── */
  const addressFormContent = (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-50 pb-4">
        <MapPin className="text-green-600" size={20} />
        {editingId ? "ঠিকানা আপডেট করুন" : "নতুন ঠিকানা যোগ করুন"}
      </h3>
      
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">নাম</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="আপনার নাম"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">মোবাইল নাম্বার</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="01XXXXXXXXX"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">বিভাগ</label>
            <select name="division" value={formData.division} onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm appearance-none font-medium text-gray-700">
              {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">জেলা</label>
            <input type="text" name="district" value={formData.district} onChange={handleInputChange} placeholder="জেলা"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm" required />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">উপজেলা / থানা</label>
            <input type="text" name="upazila" value={formData.upazila} onChange={handleInputChange} placeholder="উপজেলা"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm" required />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">বিস্তারিত ঠিকানা</label>
          <textarea name="details" value={formData.details} onChange={handleInputChange} placeholder="গ্রাম, রাস্তা, বাড়ি নং" rows="2"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-sm resize-none" required></textarea>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-50">
          <button type="button" onClick={closeForm} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors">
            বাতিল
          </button>
          <button type="submit" disabled={saving} className="flex-[2] py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-green-500/25 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Home size={16} />}
            {saving ? "সেভ হচ্ছে..." : "ঠিকানা সেভ করুন"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderAddressCard = (address, index) => (
    <div key={address.id} style={{ animationDelay: `${(index * 100) + 100}ms` }}
      className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100 transition-all duration-300 p-5 opacity-0 animate-slideUpFade flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-[15px]">{address.name}</h4>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={10}/> {address.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => editAddress(address)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
            <Edit2 size={14} />
          </button>
          <button type="button" onClick={() => handleDelete(address.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-3.5 flex-1">
        <p className="text-[13px] text-gray-600 leading-relaxed">
          {address.details}, <br/>
          {address.upazila}, {address.district} <br/>
          <span className="font-bold text-gray-800">{address.division} বিভাগ</span>
        </p>
      </div>
    </div>
  );

  const mobileLayoutContent = (
    <div className="lg:hidden min-h-screen bg-[#FDFDFD] pb-24 flex flex-col w-full relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFDFD]">
          <Loading />
        </div>
      )}

      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-colors border border-gray-200">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-black text-gray-800">ঠিকানা বই</h1>
        </div>
        {!showForm && !loading && (
          <button onClick={() => setShowForm(true)} className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center transition-colors opacity-0 animate-slideUpFade" style={{ animationDelay: '50ms' }}>
            <Plus size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 px-4 pt-6">
        {!loading && (
          showForm ? addressFormContent : addresses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"><Map size={32} className="text-gray-300" /></div>
              <p className="font-bold text-gray-700 text-lg">কোনো ঠিকানা নেই!</p>
              <p className="text-gray-400 text-xs mt-1 mb-6">দ্রুত ডেলিভারি পেতে আপনার ঠিকানা যোগ করুন।</p>
              <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20 inline-flex items-center gap-2">
                <Plus size={16} /> নতুন ঠিকানা যোগ করুন
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address, idx) => renderAddressCard(address, idx))}
            </div>
          )
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav />
      </div>
    </div>
  );

  const desktopLayoutContent = (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate} />

      {loading && (
        <div className="fixed inset-0 ml-60 z-30 flex items-center justify-center bg-[#f8fafc]">
          <Loading />
        </div>
      )}

      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <TopNav isDesktop={true} />

        <div className="flex-1 w-full max-w-[1000px] mx-auto py-8 px-8 flex flex-col gap-6">
          
          <div className="flex items-center justify-between opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <MapPin className="w-7 h-7 text-green-600" /> 
                ঠিকানা বই
              </h1>
              <p className="text-sm text-gray-500 mt-1">আপনার সেভ করা ডেলিভারি ঠিকানাসমূহ পরিচালনা করুন।</p>
            </div>
            {!loading && !showForm && (
              <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2">
                <Plus size={16} /> নতুন ঠিকানা
              </button>
            )}
          </div>

          <div>
            {!loading && (
              showForm ? (
                <div className="max-w-2xl mt-4">{addressFormContent}</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-5 mt-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto"><Map size={40} className="text-gray-300" /></div>
                  <div>
                    <p className="font-bold text-gray-800 text-xl">কোনো ঠিকানা সেভ করা নেই!</p>
                    <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">অর্ডার করার সময় দ্রুত চেকআউট করার জন্য আপনার সঠিক ঠিকানাগুলো সেভ করে রাখুন।</p>
                  </div>
                  <button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20 inline-flex items-center gap-2">
                    <Plus size={18} /> নতুন ঠিকানা যোগ করুন
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                  {addresses.map((address, idx) => renderAddressCard(address, idx))}
                </div>
              )
            )}
          </div>

        </div>
      </main>
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
      {mobileLayoutContent}
      {desktopLayoutContent}
    </>
  );
}