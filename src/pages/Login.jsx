import { useState, useEffect } from "react";
import { auth, db } from "../firebase"; // db ইমপোর্ট করা হয়েছে
import { doc, setDoc } from "firebase/firestore"; // Firestore ফাংশন
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const navigate = useNavigate();

  // মাউন্ট হওয়ার পর অ্যানিমেশন ট্রিগার করার জন্য
  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  async function handleSubmit() {
    if (!email || !password) return setError("ইমেইল ও পাসওয়ার্ড দিন");
    if (isRegister && (!name || !phone)) return setError("নাম ও মোবাইল নাম্বার দিন");
    if (password.length < 6) return setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");

    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        // ১. Authentication এ ইউজার তৈরি করা
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // ২. Auth প্রোফাইলে নাম আপডেট করা
        await updateProfile(user, { displayName: name });
        
        // ৩. Firestore ডাটাবেসে ইউজারের তথ্য সেভ করা
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name,
          email: email,
          phone: phone,
          createdAt: new Date().toISOString()
        });

        console.log("User Data Saved to Firestore successfully!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      const msg = {
        "auth/user-not-found": "এই ইমেইলে কোনো অ্যাকাউন্ট নেই",
        "auth/wrong-password": "পাসওয়ার্ড ভুল হয়েছে",
        "auth/email-already-in-use": "এই ইমেইল আগে থেকেই নিবন্ধিত",
        "auth/invalid-email": "সঠিক ইমেইল ঠিকানা দিন",
        "auth/invalid-credential": "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে",
      };
      setError(msg[err.code] || "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber || "N/A",
        createdAt: new Date().toISOString()
      }, { merge: true });

      navigate("/");
    } catch (err) {
      setError("গুগল লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
    }
    setLoading(false);
  }

  // ইনপুট ফিল্ডের কমন স্টাইল
  const inputClass = "w-full bg-white/50 border border-green-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-700 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-400/40 focus:border-green-500 shadow-sm";

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "2s" }}></div>

      {/* Main Card */}
      <div className={`relative bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 p-6 sm:p-10 w-full max-w-[420px] transition-all duration-1000 ease-out transform ${
          mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-95"
        }`}
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-2 group cursor-pointer">
            <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-xl text-3xl font-black shadow-lg shadow-green-500/30 transform -rotate-3 group-hover:rotate-0 transition-all duration-300">
              Agro
            </span>
            <span className="text-3xl font-black text-gray-800 ml-1 tracking-tight">Doc</span>
          </div>
          <p className="text-emerald-600/80 text-sm font-semibold tracking-wide">AI দিয়ে উদ্ভিদের যত্ন নিন</p>
        </div>

        {/* Tab Navigation */}
        <div className="relative flex bg-green-100/50 rounded-xl p-1 mb-6 border border-green-100">
          <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-md transition-transform duration-300 ease-in-out ${
              isRegister ? "translate-x-full left-0 ml-1" : "translate-x-0 left-1"
            }`}
          ></div>
          {["লগইন", "নতুন অ্যাকাউন্ট"].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => { setIsRegister(idx === 1); setError(""); }}
              className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${
                (isRegister ? 1 : 0) === idx ? "text-green-600" : "text-gray-500 hover:text-green-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Unified Form */}
        <div className="space-y-4">
          
          {/* Smooth transition container for Name & Phone */}
          <div className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isRegister ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <input type="text" placeholder="আপনার পুরো নাম" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} tabIndex={isRegister ? 0 : -1} />
            </div>
            
            <div className="relative">
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              <input type="tel" placeholder="মোবাইল নাম্বার (01XXXXXXXXX)" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} tabIndex={isRegister ? 0 : -1} />
            </div>
          </div>

          <div className="relative">
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <input type="email" placeholder="ইমেইল ঠিকানা" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          
          <div className="relative">
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <input 
              type="password" 
              placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className={inputClass} 
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center animate-pulse shadow-sm">
              <span className="text-red-500 mr-2 text-lg"></span>
              <p className="text-red-600 text-xs font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/30 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                অপেক্ষা করুন...
              </>
            ) : (isRegister ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন")}
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-7">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-[#f1f9f4] rounded-full text-gray-400 font-bold border border-gray-100">অথবা</span>
          </div>
        </div>

        {/* Google SignIn */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>গুগল দিয়ে প্রবেশ করুন</span>
        </button>

      </div>
    </div>
  );
}