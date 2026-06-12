import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Package,
  Wallet,
  CreditCard,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod" | "mobile"
  const [address, setAddress] = useState({
    name: user?.displayName || "",
    phone: user?.phoneNumber?.replace("+88", "") || "",
    district: "",
    upazila: "",
    details: "",
  });

  // যদি কার্ট খালি থাকে, তবে শপে পাঠিয়ে দিন
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 font-bold mb-4">আপনার কার্ট খালি!</p>
        <button 
          onClick={() => navigate("/shop")}
          className="bg-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-green-600/20"
        >
          শপে ফিরে যান
        </button>
      </div>
    );
  }

  const deliveryCharge = cartTotal > 2000 ? 0 : 80;
  const grandTotal = cartTotal + deliveryCharge;

  async function handlePlaceOrder() {
    if (!address.name || !address.phone || !address.district || !address.details) {
      alert("অনুগ্রহ করে সব তথ্য সঠিকভাবে দিন।");
      return;
    }
    setPlacing(true);
    try {
      const ref = await addDoc(collection(db, "orders"), {
        userId: user?.uid || "guest",
        userPhone: address.phone,
        items: cartItems,
        address,
        paymentMethod,
        subtotal: cartTotal,
        deliveryCharge,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      
      clearCart();
      // অর্ডার প্লেস হওয়ার পর Success পেজে পাঠিয়ে দেওয়া হবে
      navigate("/cart", { state: { step: "success", orderId: ref.id.slice(0, 8).toUpperCase() } });
    } catch (e) {
      alert("অর্ডার দেওয়া যায়নি, আবার চেষ্টা করুন।");
    }
    setPlacing(false);
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-black text-gray-800">চেকআউট</h1>
        </div>
        <div className="bg-green-50 rounded-xl px-3 py-2 border border-green-100">
          <ShieldCheck size={16} className="text-green-600" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        {/* ── Delivery Address Form ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-2">
            <MapPin size={14} className="text-green-500" />
            ডেলিভারি ঠিকানা
          </h3>
          
          <div className="space-y-4 pt-1">
            {[
              { key: "name", label: "আপনার নাম *", placeholder: "পূর্ণ নাম লিখুন", type: "text" },
              { key: "phone", label: "মোবাইল নম্বর *", placeholder: "01XXXXXXXXX", type: "tel" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">{f.label}</label>
                <input 
                  value={address[f.key]} 
                  onChange={e => setAddress({ ...address, [f.key]: e.target.value })}
                  placeholder={f.placeholder} 
                  type={f.type}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                />
              </div>
            ))}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">জেলা *</label>
                <input 
                  value={address.district} 
                  onChange={e => setAddress({ ...address, district: e.target.value })}
                  placeholder="যেমন: ঢাকা" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">উপজেলা</label>
                <input 
                  value={address.upazila} 
                  onChange={e => setAddress({ ...address, upazila: e.target.value })}
                  placeholder="যেমন: মিরপুর" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">বিস্তারিত ঠিকানা *</label>
              <textarea 
                value={address.details} 
                onChange={e => setAddress({ ...address, details: e.target.value })}
                placeholder="বাড়ি নং, রাস্তা, গ্রাম বা এলাকার নাম" 
                rows="2"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-2">
            <Wallet size={14} className="text-blue-500" />
            পেমেন্ট মেথড
          </h3>

          <div className="space-y-3 pt-2">
            <label 
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "cod" ? "border-green-500 bg-green-50/30" : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "cod" ? "bg-green-100 text-green-600" : "bg-white text-gray-400 shadow-sm"}`}>
                  <Package size={20} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${paymentMethod === "cod" ? "text-green-800" : "text-gray-700"}`}>ক্যাশ অন ডেলিভারি</p>
                  <p className="text-[10px] text-gray-500">পণ্য হাতে পেয়ে টাকা দিন</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-green-500" : "border-gray-300"}`}>
                {paymentMethod === "cod" && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
              </div>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="hidden" />
            </label>

            <label 
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "mobile" ? "border-green-500 bg-green-50/30" : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "mobile" ? "bg-pink-100 text-pink-600" : "bg-white text-gray-400 shadow-sm"}`}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${paymentMethod === "mobile" ? "text-green-800" : "text-gray-700"}`}>মোবাইল ব্যাংকিং</p>
                  <p className="text-[10px] text-gray-500">বিকাশ / নগদ পেমেন্ট</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "mobile" ? "border-green-500" : "border-gray-300"}`}>
                {paymentMethod === "mobile" && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
              </div>
              <input type="radio" name="payment" value="mobile" checked={paymentMethod === "mobile"} onChange={() => setPaymentMethod("mobile")} className="hidden" />
            </label>
          </div>
        </div>

      </div>

      {/* ── Fixed Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] rounded-t-[2rem] z-50">
        <div className="max-w-xl mx-auto">
          
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 block">সর্বমোট (ডেলিভারি সহ)</span>
              <span className="text-2xl font-black text-green-600">
                ৳{grandTotal.toLocaleString("bn-BD")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">আইটেম</span>
              <span className="text-sm font-black text-gray-800">{cartItems.length} টি</span>
            </div>
          </div>

          <button 
            onClick={handlePlaceOrder} 
            disabled={placing || !address.name || !address.phone || !address.district || !address.details}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {placing ? (
              "অর্ডার প্রসেস হচ্ছে..."
            ) : (
              <>
                অর্ডার কনফার্ম করুন
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}