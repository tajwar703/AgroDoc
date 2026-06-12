import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingBag, Layers, AlertTriangle, 
  Users, LogOut, Menu, X 
} from "lucide-react"; // Menu এবং X আইকন যুক্ত করা হয়েছে

// সমস্ত মডিউলার কম্পোনেন্টগুলো ইম্পোর্ট করা হলো
import AdminDashboard from "./AdminDashboard";
import AdminOrders from "./AdminOrders";
import AdminProducts from "./AdminProducts";
import AdminAgency from "./AdminAgency";
import AdminUsers from "./AdminUsers";

/* ── Logo ── */
function Logo() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <span className="bg-gradient-to-br from-green-500 to-emerald-600 text-white px-2 py-0.5 rounded-lg text-xl font-black shadow-sm -rotate-3 inline-block">Agro</span>
        <span className="text-xl font-black text-gray-800 tracking-tight">Doc.</span>
      </div>
      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-0.5">Admin Panel</span>
    </div>
  );
}

const TABS = [
  { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { id: "orders", label: "অর্ডারসমূহ", icon: ShoppingBag },
  { id: "products", label: "প্রোডাক্টস", icon: Layers },
  { id: "agency", label: "জরুরি এজেন্সি", icon: AlertTriangle },
  { id: "users", label: "ইউজারস ট্র্যাকিং", icon: Users },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // মোবাইল মেনুর স্টেট
  const navigate = useNavigate();

  // অ্যাক্টিভ ট্যাব অনুযায়ী কম্পোনেন্ট রেন্ডার করা
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboard />;
      case "orders": return <AdminOrders />;
      case "products": return <AdminProducts />;
      case "agency": return <AdminAgency />;
      case "users": return <AdminUsers />;
      default: return <AdminDashboard />;
    }
  };

  /* ── MOBILE NAV (Header + Hamburger Drawer) ── */
  const MobileNav = () => (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-1.5 -ml-1.5 text-gray-600 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
          >
            <Menu size={22} />
          </button>
          <Logo />
        </div>
        <button 
          onClick={() => navigate("/")} 
          className="text-[10px] font-bold text-red-500 flex items-center gap-1 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
        >
          <LogOut size={12}/> প্রস্থান
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed top-0 left-0 h-full w-[260px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-6 border-b border-gray-100 flex justify-between items-start">
          <Logo />
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="p-1.5 bg-gray-50 text-gray-500 rounded-full border border-gray-100 hover:bg-gray-100 active:scale-95 transition-all"
          >
            <X size={18}/>
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false); // ট্যাব সিলেক্ট করলে মেনু বন্ধ হয়ে যাবে
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                  isActive 
                    ? "bg-green-50 text-green-700 border-l-4 border-green-500 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-4 border-transparent"
                }`}
              >
                <Icon size={18} className={isActive ? "text-green-600" : "text-gray-400"} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  );

  /* ── DESKTOP SIDEBAR ── */
  const DesktopSidebar = () => (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm z-40 py-6 px-4">
      <div className="px-2 mb-8">
        <Logo />
      </div>
      
      <nav className="flex-1 space-y-1.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-[13px] font-bold transition-all duration-300 ${
                isActive 
                  ? "bg-green-50 text-green-700 border-l-4 border-green-500 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800 border-l-4 border-transparent"
              }`}
            >
              <Icon size={18} className={isActive ? "text-green-600" : "text-gray-400"} />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="pt-5 border-t border-gray-100 mt-4">
        <button onClick={() => navigate("/")} 
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-100 hover:bg-red-50 text-red-600 text-[13px] font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-95">
          <LogOut size={16} /> প্যানেল থেকে প্রস্থান
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row w-full">
        {/* Mobile Navigation */}
        <MobileNav />
        
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 w-full max-w-[1400px] mx-auto overflow-hidden min-h-screen flex flex-col">
          <div key={activeTab} className="animate-[fadeInUp_0.4s_ease-out_both] w-full flex-1">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </>
  );
}