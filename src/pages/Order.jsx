import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChevronDown,
  ChevronUp,
  Calendar,
  ShoppingBag,
  LogOut, LayoutDashboard, Store, MapPin, UserCircle, ScanLine, History, SearchX
} from "lucide-react";

import TopNav from "../components/TopNav";
import BottomNav from "../components/BottomNav";
import Loading from "../components/Loding";

const STATUS_CONFIG = {
  pending: { label: "পেন্ডিং", color: "text-amber-600 bg-amber-50 border-amber-100", icon: Clock },
  processing: { label: "প্রসেসিং", color: "text-blue-600 bg-blue-50 border-blue-100", icon: Package },
  shipped: { label: "রাস্তায় আছে", color: "text-indigo-600 bg-indigo-50 border-indigo-100", icon: Truck },
  delivered: { label: "ডেলিভার্ড", color: "text-green-600 bg-green-50 border-green-100", icon: CheckCircle2 },
  cancelled: { label: "বাতিল", color: "text-red-600 bg-red-50 border-red-100", icon: XCircle },
};

function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-lg text-xl font-black shadow-sm -rotate-3 inline-block">Agro</span>
      <span className="text-xl font-black text-gray-800 tracking-tight">Doc.</span>
    </div>
  );
}

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

function OrderCard({ order, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  const orderDate = order.createdAt?.toDate 
    ? order.createdAt.toDate().toLocaleDateString("bn-BD", { year: 'numeric', month: 'long', day: 'numeric' })
    : "কিছুক্ষণ আগে";

  return (
    <div 
      style={{ animationDelay: `${(index * 100) + 100}ms` }}
      className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 opacity-0 animate-slideUpFade"
    >
      <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[15px] font-black text-gray-800 tracking-tight">অর্ডার #{order.id.slice(0, 8).toUpperCase()}</span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.color} flex items-center gap-1 shadow-sm`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <Calendar size={12} />
              <span>{orderDate}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
              <Package size={12} />
              <span>{order.items?.length || 0} টি পণ্য</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-50">
          <div className="text-left sm:text-right bg-green-50/50 px-4 py-2 rounded-xl border border-green-100/50">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">মোট মূল্য</span>
            <span className="text-lg font-black text-green-600 leading-none">৳{order.grandTotal?.toLocaleString("bn-BD")}</span>
          </div>
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${expanded ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200'}`}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out ${expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="border-t border-gray-100 bg-[#f8fafc] p-5 md:p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Package size={14}/> অর্ডারকৃত পণ্যসমূহ
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-[1rem] p-3 border border-gray-100 shadow-sm hover:border-green-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden border border-gray-100">
                      {item.image?.startsWith('http') || item.image?.startsWith('/') ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{item.image || "📦"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.unit} <span className="text-gray-300 mx-1">|</span> {item.qty} টি</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-black text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg">৳{(item.price * item.qty).toLocaleString("bn-BD")}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[1.25rem] p-5 border border-gray-100 shadow-sm">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-50 pb-2 mb-3 flex items-center gap-2">
              <MapPin size={14}/> ডেলিভারি ঠিকানা ও পেমেন্ট
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-gray-600 leading-relaxed">
              <div className="space-y-1.5">
                <p><span className="font-bold text-gray-800 inline-block w-16">নাম:</span> {order.address?.name}</p>
                <p><span className="font-bold text-gray-800 inline-block w-16">মোবাইল:</span> {order.address?.phone}</p>
                <p><span className="font-bold text-gray-800 inline-block w-16">ঠিকানা:</span> {order.address?.details}, {order.address?.upazila}, {order.address?.district}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3 h-fit">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-green-600">৳</div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">পেমেন্ট মেথড</p>
                  <p className="font-bold text-gray-800 capitalize mt-0.5">
                    {order.paymentMethod === "cod" ? "ক্যাশ অন ডেলিভারি" : "মোবাইল ব্যাংকিং"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const ordersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen bg-[#FDFDFD] pb-24 flex flex-col w-full relative">

      {/* ✅ Full-screen centered loader — mobile */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFDFD]">
          <Loading />
        </div>
      )}

      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate("/shop")}
          className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-colors border border-gray-200"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="text-lg font-black text-gray-800">আমার অর্ডারসমূহ</h1>
      </div>

      <div className="flex-1 px-4 pt-6">
        {!loading && (
          !user ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
              <p className="text-gray-400 font-bold mb-4">অর্ডার দেখতে লগইন করুন</p>
              <button onClick={() => navigate("/login")} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20">
                লগইন পেজে যান
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <SearchX className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <p className="font-bold text-gray-700 text-lg">কোনো অর্ডার নেই!</p>
                <p className="text-gray-400 text-xs mt-1">আপনি এখনো কোনো অর্ডার করেননি।</p>
              </div>
              <button onClick={() => navigate("/shop")} className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20 inline-flex items-center gap-2">
                <ShoppingBag size={16} /> কেনাকাটা করুন
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <OrderCard key={order.id} order={order} index={idx} />
              ))}
            </div>
          )
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav />
      </div>
    </div>
  );

  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate} />

      {/* ✅ Full-screen centered loader — desktop */}
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
                <Package className="w-7 h-7 text-green-600" /> 
                আমার অর্ডারসমূহ
              </h1>
              <p className="text-sm text-gray-500 mt-1">আপনার পূর্ববর্তী সকল অর্ডারের স্ট্যাটাস এবং বিস্তারিত তথ্য দেখুন।</p>
            </div>
            {!loading && orders.length > 0 && (
              <button onClick={() => navigate("/shop")} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2">
                <ShoppingBag size={16} /> নতুন অর্ডার করুন
              </button>
            )}
          </div>

          <div>
            {!loading && (
              !user ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 mt-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
                  <p className="text-gray-400 font-bold mb-4">অর্ডার দেখতে লগইন করুন</p>
                  <button onClick={() => navigate("/login")} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20">
                    লগইন পেজে যান
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-5 mt-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <SearchX className="w-12 h-12 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-xl">কোনো অর্ডার নেই!</p>
                    <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">আপনি এখনো আমাদের দোকান থেকে কোনো পণ্য অর্ডার করেননি। আপনার প্রয়োজনীয় কৃষি পণ্য কিনতে দোকানে যান।</p>
                  </div>
                  <button onClick={() => navigate("/shop")} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20 inline-flex items-center gap-2">
                    <ShoppingBag size={18} /> দোকানে যান
                  </button>
                </div>
              ) : (
                <div className="space-y-5 mt-4">
                  {orders.map((order, idx) => (
                    <OrderCard key={order.id} order={order} index={idx} />
                  ))}
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
      <MobileLayout />
      <DesktopLayout />
    </>
  );
}