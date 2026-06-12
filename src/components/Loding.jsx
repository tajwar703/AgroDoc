import React from "react";

export default function Loading() {
  return (
    // ব্যাকগ্রাউন্ড (হালকা ট্রান্সপারেন্ট ও ব্লার)
    <div className="fixed inset-0 z-[999] bg-white/60 backdrop-blur-sm flex items-center justify-center">
      
      {/* ── কন্টেইনার (মোবাইল ও পিসিতে সাইজ আলাদা হবে) ── */}
      <div className="flex flex-col items-center gap-3 md:gap-4 animate-[popIn_0.3s_ease-out_both] scale-[1] md:scale-[1.2]">
        
        {/* লোগো */}
        <div className="flex items-center gap-1.5 md:gap-2 mb-1 animate-[float_3s_ease-in-out_infinite]">
          <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg text-sm md:text-lg font-black shadow-sm -rotate-3 inline-block">
            Agro
          </span>
          <span className="text-sm md:text-lg font-black text-gray-800 tracking-tight">
            Doc.
          </span>
        </div>

        {/* লোডিং বার */}
        <div className="w-24 md:w-32 h-1 md:h-1.5 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-[40%] animate-[slideRight_0.8s_ease-in-out_infinite_alternate]" />
        </div>
        
        {/* টেক্সট */}
        <p className="text-[9px] md:text-[10px] font-bold text-gray-500 tracking-widest uppercase mt-0.5 md:mt-1 animate-pulse">
          লোড হচ্ছে...
        </p>

      </div>

      {/* ── অ্যানিমেশন সিএসএস ── */}
      <style>{`
        @keyframes slideRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(200%); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-3px) rotate(-3deg); }
        }
      `}</style>
    </div>
  );
}