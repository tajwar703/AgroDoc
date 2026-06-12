import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { Package, MapPin, Phone, Calendar, CreditCard, SearchX, Loader2 } from "lucide-react";

const getStatusStyle = (status) => {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20';
    case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20';
    case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500/20';
    case 'delivered': return 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500/20';
    case 'cancelled': return 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500/20';
    default: return 'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-500/20';
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("bn-BD", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    try {
      const orderSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
      setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      fetchOrders();
    } catch (e) {
      alert("স্ট্যাটাস আপডেট করা যায়নি!");
    } finally {
      setUpdating(null);
    }
  };

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
          অর্ডার লিস্ট লোড হচ্ছে...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 w-full">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 md:pb-6 animate-[fadeInUp_0.3s_ease-out_both]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
            <Package size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">অর্ডার ম্যানেজমেন্ট</h2>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 md:mt-1">গ্রাহকদের সর্বমোট {orders.length} টি অর্ডার পাওয়া গেছে</p>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {orders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-4 animate-[fadeInUp_0.4s_ease-out_both]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
             <SearchX className="w-10 h-10 text-gray-300" />
          </div>
          <div>
             <p className="font-bold text-gray-700 text-lg">কোনো অর্ডার পাওয়া যায়নি!</p>
             <p className="text-gray-400 text-xs mt-1">দোকান থেকে কেউ এখনো কোনো অর্ডার করেনি।</p>
          </div>
        </div>
      )}

      {/* ── Orders List ── */}
      <div className="space-y-5">
        {orders.map((order, idx) => (
          <div 
            key={order.id} 
            style={{ animationDelay: `${Math.min(idx * 80, 500)}ms` }}
            className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all p-5 md:p-7 animate-[fadeInUp_0.5s_ease-out_both] flex flex-col"
          >
            {/* Top Bar (ID & Status) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-[14px] flex items-center justify-center border border-gray-100 flex-shrink-0">
                  <Package size={20} className="text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-black text-gray-800">#{order.id.slice(0,8).toUpperCase()}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar size={10}/> {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1.5">
                    <Phone size={12} className="text-green-500"/> {order.userPhone || order.address?.phone || "N/A"}
                  </p>
                </div>
              </div>
              
              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden sm:block">স্ট্যাটাস:</span>
                <div className="relative">
                  <select 
                    value={order.status || 'pending'} 
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className={`appearance-none border rounded-xl text-xs font-bold pl-4 pr-8 py-2.5 focus:outline-none focus:ring-2 shadow-sm cursor-pointer transition-all disabled:opacity-50 ${getStatusStyle(order.status || 'pending')}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updating === order.id && (
                     <div className="absolute right-2 top-1/2 -translate-y-1/2">
                       <Loader2 size={12} className="animate-spin text-gray-500" />
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Grid (Products & Details) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
              
              {/* Left: Products */}
              <div>
                <p className="font-bold text-gray-400 text-[10px] uppercase tracking-widest mb-2.5">অর্ডারকৃত পণ্যসমূহ</p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={i} className="bg-gray-50/80 border border-gray-100 px-3.5 py-2.5 rounded-xl flex justify-between items-center hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.image ? <img src={item.image} alt="p" className="w-full h-full object-cover" /> : <Package size={14} className="text-gray-300"/>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-700 truncate leading-none">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium mt-1">{item.unit} <span className="mx-1">x</span> {item.qty} টি</p>
                        </div>
                      </div>
                      <span className="font-black text-[13px] text-gray-900 bg-white px-2 py-1 rounded-lg border border-gray-100">৳{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Address & Bill */}
              <div className="flex flex-col gap-3">
                <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 flex-1">
                  <p className="font-bold text-blue-400 text-[10px] uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <MapPin size={12} /> গ্রাহকের ঠিকানা
                  </p>
                  <p className="text-[13px] font-bold text-gray-800">{order.address?.name}</p>
                  <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                    {order.address?.details}, <br />
                    {order.address?.upazila}, {order.address?.district}
                  </p>
                </div>

                <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-green-600">
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-green-600/70 text-[10px] uppercase tracking-widest">মোট বিল</p>
                      <p className="text-[10px] font-bold text-gray-500 capitalize">{order.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'অনলাইন পেমেন্ট'}</p>
                    </div>
                  </div>
                  <p className="font-black text-xl text-green-700 tracking-tight">৳{order.grandTotal?.toLocaleString("bn-BD")}</p>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}