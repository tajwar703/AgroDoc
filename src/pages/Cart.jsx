import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ArrowLeft, ShoppingCart, Trash2, Plus, Minus,
  MapPin, Phone, CheckCircle2, Package, Sprout,
  ScanLine, History, UserCircle, ChevronRight,
} from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="bg-green-600 text-white px-2.5 py-1 rounded-lg text-xl font-black shadow-sm -rotate-3 inline-block">Agro</span>
      <span className="text-xl font-black text-gray-800 tracking-tight">Doc.</span>
    </div>
  );
}

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const [step, setStep] = useState("cart"); // "cart" | "address" | "success"
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [address, setAddress] = useState({
    name: user?.displayName || "",
    phone: user?.phoneNumber?.replace("+88", "") || "",
    division: "",
    district: "",
    upazila: "",
    village: "",
    details: "",
  });

  const deliveryCharge = cartTotal > 2000 ? 0 : 80;
  const grandTotal = cartTotal + deliveryCharge;

  async function placeOrder() {
    if (!address.name || !address.phone || !address.district) return;
    setPlacing(true);
    try {
      const ref = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userPhone: user.phoneNumber || user.email,
        items: cartItems,
        address,
        subtotal: cartTotal,
        deliveryCharge,
        grandTotal,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setOrderId(ref.id.slice(0, 8).toUpperCase());
      clearCart();
      setStep("success");
    } catch (e) {
      alert("অর্ডার দেওয়া যায়নি, আবার চেষ্টা করুন।");
    }
    setPlacing(false);
  }

  /* ── Success Screen ── */
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 w-full max-w-sm text-center space-y-5">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800">অর্ডার সফল! 🎉</h2>
          <p className="text-gray-500 text-sm px-2">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>
          
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">অর্ডার নম্বর</p>
            <p className="text-2xl font-black text-green-600">#{orderId}</p>
          </div>
          
          <div className="space-y-3 pt-4">
            <button onClick={() => navigate("/orders")}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-600/20">
              অর্ডার ট্র্যাক করুন
            </button>
            <button onClick={() => navigate("/shop")}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl transition-all border border-gray-100">
              আরো কেনাকাটা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  const CartContent = () => (
    <div className="space-y-4">
      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <span className="text-6xl mb-2">🛒</span>
          <p className="text-gray-400 font-bold">আপনার কার্ট সম্পূর্ণ খালি!</p>
          <button onClick={() => navigate("/shop")}
            className="mt-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-green-600/20">
            কেনাকাটা শুরু করুন
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
                  {/* যদি Image URL থাকে তবে img ট্যাগ ব্যবহার করুন, না হলে ইমোজি */}
                  {item.image?.startsWith('http') || item.image?.startsWith('/') ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{item.image || "📦"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-800 leading-tight truncate mb-1">{item.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{item.unit}</p>
                  <p className="text-lg font-black text-green-600">৳{(item.price * item.qty).toLocaleString("bn-BD")}</p>
                </div>
                <div className="flex flex-col items-end justify-between h-20">
                  <button onClick={() => removeFromCart(item.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-600 hover:text-green-600 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold text-gray-800 w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-600 hover:text-green-600 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-3">অর্ডার সারসংক্ষেপ</h3>
            
            <div className="space-y-3 pt-1">
              {[
                { label: "সাবটোটাল", value: `৳${cartTotal.toLocaleString("bn-BD")}` },
                { label: "ডেলিভারি চার্জ", value: deliveryCharge === 0 ? "ফ্রি 🎉" : `৳${deliveryCharge}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">{r.label}</span>
                  <span className={`font-bold ${r.value.includes("ফ্রি") ? "text-green-600" : "text-gray-800"}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {deliveryCharge > 0 && (
              <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 flex items-start gap-2">
                 <Package size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                 <p className="text-[11px] text-green-700 font-medium leading-relaxed">
                   আর মাত্র <span className="font-bold">৳{(2000 - cartTotal).toLocaleString("bn-BD")}</span> টাকার অর্ডার করলেই পাচ্ছেন ফ্রি ডেলিভারি!
                 </p>
              </div>
            )}
            
            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="text-gray-800 font-bold">সর্বমোট</span>
              <span className="text-2xl font-black text-green-600">৳{grandTotal.toLocaleString("bn-BD")}</span>
            </div>
          </div>

          <button onClick={() => setStep("address")}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <MapPin size={18} />
            ডেলিভারি ঠিকানা দিন
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );

  const AddressForm = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-3 flex items-center gap-2">
          <MapPin size={14} className="text-green-500" />
          ডেলিভারি ঠিকানা
        </h3>
        
        <div className="space-y-4 pt-1">
          {[
            { key: "name", label: "আপনার নাম *", placeholder: "পূর্ণ নাম লিখুন", type: "text" },
            { key: "phone", label: "মোবাইল নম্বর *", placeholder: "01XXXXXXXXX", type: "tel" },
            { key: "district", label: "জেলা *", placeholder: "যেমন: ঢাকা", type: "text" },
            { key: "upazila", label: "উপজেলা", placeholder: "যেমন: মিরপুর", type: "text" },
            { key: "village", label: "গ্রাম / এলাকা", placeholder: "গ্রাম বা এলাকার নাম", type: "text" },
            { key: "details", label: "বিস্তারিত ঠিকানা", placeholder: "বাড়ি নং, রাস্তা, ল্যান্ডমার্ক", type: "text" },
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
        </div>
      </div>

      {/* Order Summary at bottom of address */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">মোট পরিশোধ</p>
          <p className="text-xl font-black text-green-600">৳{grandTotal.toLocaleString("bn-BD")}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-xs font-bold text-gray-600">ক্যাশ অন ডেলিভারি</p>
          <div className="bg-green-50 text-green-600 px-2.5 py-1 rounded-lg mt-1.5 inline-flex items-center gap-1.5">
             <Package size={14} />
             <span className="text-[10px] font-bold">Standard</span>
          </div>
        </div>
      </div>

      <button onClick={placeOrder} disabled={placing || !address.name || !address.phone || !address.district}
        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mb-8">
        <CheckCircle2 size={18} />
        {placing ? "অর্ডার প্রসেস হচ্ছে..." : "অর্ডার নিশ্চিত করুন"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24 md:pb-10">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => step === "address" ? setStep("cart") : navigate("/shop")}
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center transition-colors">
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2 border border-green-100">
          <ShoppingCart size={16} className="text-green-600" />
          <span className="text-xs font-bold text-green-700">{step === "cart" ? "কার্ট" : "ঠিকানা"}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {["কার্ট", "ঠিকানা", "সম্পন্ন"].map((s, i) => {
            const stepIndex = { cart: 0, address: 1, success: 2 }[step];
            const isActive = i <= stepIndex;
            return (
              <div key={s} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-300 ${isActive ? "bg-green-600 text-white shadow-md shadow-green-600/20" : "bg-gray-100 text-gray-400"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-bold ${isActive ? "text-gray-800" : "text-gray-400"} hidden sm:block`}>{s}</span>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full mx-2 ${i < stepIndex ? "bg-green-600" : "bg-gray-100"}`} />}
              </div>
            );
          })}
        </div>

        {step === "cart" ? <CartContent /> : <AddressForm />}
      </div>

      {/* Bottom Nav (Inline version - Styled matching Shop.jsx patterns) */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-50">
        <div className="bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.04)] rounded-t-[2rem]">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1.5 p-2">
            <Sprout size={22} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400">হোম</span>
          </button>
          
          <button onClick={() => navigate("/scanner")} className="flex flex-col items-center relative -top-6">
            <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-600/30 border-4 border-white text-white">
              <ScanLine size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-500 mt-1">স্ক্যান</span>
          </button>
          
          <button onClick={() => navigate("/shop")} className="flex flex-col items-center gap-1.5 p-2">
            <ShoppingCart size={22} className="text-green-600" />
            <span className="text-[10px] font-bold text-green-600">শপ</span>
          </button>
          
          <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1.5 p-2">
            <UserCircle size={22} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400">প্রোফাইল</span>
          </button>
        </div>
      </div>

    </div>
  );
}