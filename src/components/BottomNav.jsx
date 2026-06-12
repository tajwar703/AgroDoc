import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ScanLine, History,
  ShoppingBag, UserCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { label:"হোম",     icon:LayoutDashboard, path:"/"         },
  { label:"ইতিহাস",  icon:History,         path:"/history"  },
  { label:"স্ক্যান", icon:ScanLine,         path:"/scanner", center:true },
  { label:"দোকান",   icon:ShoppingBag,      path:"/shop"     },
  { label:"প্রোফাইল",icon:UserCircle,       path:"/profile"  },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      
      {/* একটি হালকা গ্রেডিয়েন্ট যা স্ক্রলিং কন্টেন্টকে ন্যাভবারের সাথে সুন্দরভাবে ব্লেন্ড করবে */}
      <div className="h-6 bg-gradient-to-t from-[#FDFDFD] to-transparent pointer-events-none" />

      {/* সলিড ব্যাকগ্রাউন্ড কন্টেইনার: এটি ন্যাভবারের নিচের ফাঁকা জায়গা দিয়ে স্ক্রলিং আইটেম দেখা যাওয়া বন্ধ করবে */}
      <div className="bg-[#FDFDFD] px-3 pb-3">
        
        {/* ফ্লোটিং এবং কম্প্যাক্ট ন্যাভবার */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[1.4rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 px-1 py-1.5 flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon    = item.icon;
            const active  = pathname === item.path;

            if (item.center) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-0.5 -mt-6 active:scale-90 transition-transform"
                >
                  {/* স্ক্যান বাটনটি আগের চেয়ে একটু কম্প্যাক্ট করা হয়েছে */}
                  <div className={`w-[52px] h-[52px] rounded-[1.1rem] flex items-center justify-center shadow-lg transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-br from-emerald-400 to-green-600 shadow-green-500/30 scale-105"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20"
                  }`}>
                    <Icon size={24} className="text-white" strokeWidth={2.5}/>
                  </div>
                  <span className={`text-[9px] font-black tracking-wide mt-1 ${active ? "text-green-600" : "text-gray-400"}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-200 active:scale-90 relative"
              >
                {/* Active ডট */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"/>
                )}
                
                {/* আইকন সাইজ এবং প্যাডিং কমিয়ে আরও ছিমছাম করা হয়েছে */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  active ? "bg-green-50" : "bg-transparent"
                }`}>
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className={active ? "text-green-600" : "text-gray-400"}
                  />
                </div>
                <span className={`text-[9px] font-bold tracking-wide leading-none ${
                  active ? "text-green-600" : "text-gray-400"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}