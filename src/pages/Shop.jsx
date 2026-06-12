import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import {
  Search, Sprout, Star, Store, Droplets, Bug, Tractor, Plus,
  LogOut, LayoutDashboard, Package, MapPin, Truck, UserCircle, ScanLine, History
} from "lucide-react";
import { useCart } from "../context/CartContext";
import TopNav from "../components/TopNav"; 
import BottomNav from "../components/BottomNav";
import Loading from "../components/Loding";

const CATEGORIES = [
  { id: 'all',        name: 'সব প্রোডাক্ট', icon: Store    },
  { id: 'fertilizer', name: 'সার',           icon: Droplets },
  { id: 'pesticide',  name: 'কীটনাশক',       icon: Bug      },
  { id: 'seeds',      name: 'বীজ',           icon: Sprout   },
  { id: 'tools',      name: 'যন্ত্রপাতি',     icon: Tractor  },
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
    { label:"ড্যাশবোর্ড",   icon:<LayoutDashboard size={16}/>, path:"/"             },
    { label:"স্ক্যান করুন",  icon:<ScanLine size={16}/>,        path:"/scanner"      },
    { label:"ইতিহাস",       icon:<History size={16}/>,         path:"/history"      },
    { label:"দোকান",        icon:<Store size={16}/>,           path:"/shop"         },
    { label:"আমার অর্ডার",  icon:<Package size={16}/>,         path:"/orders"       }, // ✅ fixed: /order → /orders
    { label:"কৃষি এজেন্সি", icon:<Truck size={16}/>,           path:"/agro-agency"  },
    { label:"ঠিকানা বই",    icon:<MapPin size={16}/>,          path:"/address-book" },
    { label:"প্রোফাইল",     icon:<UserCircle size={16}/>,      path:"/profile"      },
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

/* ── Product Card ── */
function ProductCard({ product, onAdd, navigate, index = 0 }) {
  const { cartItems } = useCart();
  const inCart = cartItems.some(c => c.id === product.id);

  const fallbackImage = "https://via.placeholder.com/400x300?text=No+Image+Available";

  return (
    <div
      onClick={() => navigate(`/product-details/${product.id}`, { state: { product } })} // ✅ fixed route
      style={{ animationDelay: `${(index * 50) + 150}ms` }}
      className="group relative bg-white rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-green-500/10 hover:border-green-200 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col opacity-0 animate-slideUpFade"
    >
      {/* Image */}
      <div className="relative h-32 md:h-40 w-full overflow-hidden bg-gray-50 border-b border-gray-100">
        <img
          src={product.image || fallbackImage}
          alt={product.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {product.badge && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md shadow-md shadow-green-500/20 flex items-center gap-1 z-10 tracking-wide">
            {product.badge}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3 md:p-4 flex flex-col flex-1 bg-white">
        <div className="flex justify-between items-start mb-1.5">
          <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-wider bg-green-50 border border-green-100/60 px-2 py-0.5 rounded-md">
            {product.category}
          </span>
        </div>
        
        <h3 className="text-xs md:text-sm font-bold text-gray-800 leading-snug mb-1 group-hover:text-green-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-[10px] md:text-xs font-medium text-gray-400 mb-3 flex items-center gap-1">
          <Package size={10} className="text-gray-300" />
          {product.unit}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-medium mb-0.5">মূল্য</span>
            <span className="text-base md:text-lg font-black text-gray-900 tracking-tight">৳{product.price}</span>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className={`w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
              inCart
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/30"
                : "bg-gray-50 hover:bg-green-500 hover:text-white text-gray-600 hover:shadow-md hover:shadow-green-500/20"
            }`}
          >
            {inCart ? <span className="text-sm font-black">✓</span> : <Plus size={16} strokeWidth={2.5}/>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════ MAIN SHOP COMPONENT ════════════ */
export default function Shop() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [searchQuery, setSearchQuery]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const displayName = user?.displayName || user?.phoneNumber || user?.email?.split("@")[0] || "কৃষক";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  /* ── Shared UI Parts ── */
  const SearchAndFilter = () => (
    <div className="flex flex-col xl:flex-row gap-3 justify-between items-start xl:items-center w-full opacity-0 animate-slideUpFade" style={{ animationDelay: '100ms' }}>
      <div className="relative w-full xl:w-[400px]">
        <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="প্রোডাক্ট খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all text-sm font-medium"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/25 border border-transparent"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
              }`}
            >
              <Icon size={14} className={selectedCategory === cat.id ? "text-white" : "text-gray-400"} />
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  const ProductGrid = () => (
    <div className="w-full">
      {filtered.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center text-center mt-4 opacity-0 animate-slideUpFade" style={{ animationDelay: '200ms' }}>
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
             <Search className="w-8 h-8 text-gray-300" />
           </div>
           <p className="font-bold text-gray-700 text-base">কোনো প্রোডাক্ট পাওয়া যায়নি!</p>
           <p className="text-gray-400 text-xs mt-1">অন্য কোনো নাম লিখে খুঁজুন অথবা ক্যাটাগরি পরিবর্তন করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 xl:gap-5 mt-5">
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} index={idx} onAdd={addToCart} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );

  /* ── MOBILE LAYOUT ── */
  const MobileLayout = () => (
    <div className="lg:hidden min-h-screen bg-[#FDFDFD] pb-20 flex flex-col w-full relative">

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFDFD]">
          <Loading />
        </div>
      )}

      <div className="w-full sticky top-0 z-50">
        <TopNav isDesktop={false} />
      </div>
      
      {!loading && (
        <div className="px-3 pt-5 space-y-2">
          <div className="mb-3 opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
              <Store className="w-5 h-5 text-green-600" /> 
              কৃষি দোকান
            </h1>
          </div>
          <SearchAndFilter />
          <ProductGrid />
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full z-50">
        <BottomNav />
      </div>
    </div>
  );

  /* ── DESKTOP LAYOUT ── */
  const DesktopLayout = () => (
    <div className="hidden lg:flex min-h-screen bg-[#f8fafc]">
      <Sidebar user={user} displayName={displayName} navigate={navigate} />

      {loading && (
        <div className="fixed inset-0 ml-60 z-30 flex items-center justify-center bg-[#f8fafc]">
          <Loading />
        </div>
      )}

      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <TopNav isDesktop={true} />

        {!loading && (
          <div className="flex-1 w-full max-w-[1200px] mx-auto py-6 px-6 flex flex-col gap-5">
            
            <div className="flex items-center justify-between opacity-0 animate-slideUpFade" style={{ animationDelay: '0ms' }}>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Store className="w-6 h-6 text-green-600" /> 
                  কৃষি দোকান
                </h1>
                <p className="text-xs text-gray-500 mt-1">আপনার ফসলের জন্য প্রয়োজনীয় মানসম্মত সার, বীজ এবং ঔষধ সংগ্রহ করুন।</p>
              </div>
            </div>

            <SearchAndFilter />
            <ProductGrid />

          </div>
        )}
      </main>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes slideUpFade {
            0% { opacity: 0; transform: translateY(20px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slideUpFade {
            animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      <MobileLayout />
      <DesktopLayout />
    </>
  );
}