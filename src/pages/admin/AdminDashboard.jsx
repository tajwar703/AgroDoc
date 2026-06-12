import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Users, TrendingUp, Package, AlertTriangle, Activity, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, revenue: 0, totalOrders: 0, agencyRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const userSnap = await getDocs(collection(db, "users"));
        const orderSnap = await getDocs(collection(db, "orders"));
        const agencySnap = await getDocs(collection(db, "agency_bookings"));

        const ordersList = orderSnap.docs.map(d => d.data());
        const totalRev = ordersList.filter(o => o.status === "delivered").reduce((sum, o) => sum + (o.grandTotal || 0), 0);

        setStats({
          totalUsers: userSnap.size || 12, // ডেমো ব্যাকআপ যদি ইউজার কালেকশন খালি থাকে
          revenue: totalRev,
          totalOrders: orderSnap.size,
          agencyRequests: agencySnap.docs.filter(d => d.data().status === "requested").length
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 w-full">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-16 h-16 rounded-full bg-green-100 animate-ping opacity-40" />
          <div className="relative w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
            <Loader2 size={20} className="text-green-500 animate-spin" />
          </div>
        </div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          ড্যাশবোর্ড লোড হচ্ছে...
        </p>
      </div>
    );
  }

  // Home.jsx এর মতো সলিড কালার এবং আইকন ব্যবহার করা হয়েছে
  const statCards = [
    { label: "মোট ইউজার", val: stats.totalUsers, icon: Users, bg: "bg-[#2094f3]" },
    { label: "মোট বিক্রি", val: `৳${stats.revenue.toLocaleString("bn-BD")}`, icon: TrendingUp, bg: "bg-[#00b067]" },
    { label: "মোট অর্ডার", val: stats.totalOrders, icon: Package, bg: "bg-[#9b51e0]" },
    { label: "জরুরি রিকোয়েস্ট", val: stats.agencyRequests, icon: AlertTriangle, bg: "bg-[#ff4560]" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-[popIn_0.4s_ease-out_both] w-full">
      
      {/* ── Custom Animation (Home er moto) ── */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(15px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5 md:pb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100/50">
          <Activity size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">ওভারভিউ ড্যাশবোর্ড</h2>
          <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 md:mt-1">সিস্টেমের বর্তমান অবস্থা এবং সকল পরিসংখ্যান একনজরে</p>
        </div>
      </div>

      {/* ── Stats Grid (Home Card Style) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((c, index) => (
          <div 
            key={index} 
            style={{ animationDelay: `${index * 80}ms` }} 
            className="w-full group bg-white rounded-[24px] border border-gray-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg p-5 md:p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 animate-[popIn_0.5s_ease-out_both]"
          >
            
            {/* Icon Box */}
            <div className={`w-[70px] h-[70px] md:w-[75px] md:h-[75px] rounded-[22px] md:rounded-[24px] ${c.bg} flex items-center justify-center shadow-md mb-1 group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              <c.icon size={32} strokeWidth={2} className="text-white" />
            </div>
            
            {/* Text Area */}
            <div className="text-center w-full mt-1">
              <p className="text-[14px] md:text-[15px] font-extrabold text-[#1f2937] tracking-tight">{c.label}</p>
              <p className="text-lg md:text-xl font-black text-gray-600 mt-1 truncate">{c.val}</p>
            </div>
            
          </div>
        ))}
      </div>
      
    </div>
  );
}