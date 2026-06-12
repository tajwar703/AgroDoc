import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Leaf, 
  Truck 
} from "lucide-react";

export default function ProductDetails() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQty, removeFromCart } = useCart();
  
  const product = state?.product;

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4">
        <p className="text-gray-400 font-bold mb-4">প্রোডাক্ট খুঁজে পাওয়া যায়নি!</p>
        <button 
          onClick={() => navigate("/shop")}
          className="bg-green-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-green-600/20"
        >
          শপে ফিরে যান
        </button>
      </div>
    );
  }

  const cartItem = cartItems.find((item) => item.id === product.id);
  const inCart = !!cartItem;
  const quantity = cartItem?.qty || 0;
  const totalCartItems = cartItems.reduce((total, item) => total + item.qty, 0);

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-28">
      
      {/* ── Header ── */}
      <div className="fixed top-0 left-0 w-full z-40 px-4 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-gray-700 transition-transform active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        
        <button 
          onClick={() => navigate("/cart")}
          className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-gray-700 relative transition-transform active:scale-95"
        >
          <ShoppingCart size={20} />
          {totalCartItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* ── Product Image ── */}
      <div className="w-full h-[45vh] bg-gray-50 relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      {/* ── Product Details Card ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8">
          
          {/* ✅ Star rating badge সরানো হয়েছে */}
          <div className="mb-4">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-3 py-1.5 rounded-lg mb-3 inline-block">
              {product.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 leading-tight mb-2">
              {product.name}
            </h1>
            <p className="text-sm font-bold text-gray-400">{product.unit}</p>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-3 py-5 border-y border-gray-50 my-5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <ShieldCheck size={16} />
              </div>
              ১০০% অরিজিনাল
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Leaf size={16} />
              </div>
              সেরা মান
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Truck size={16} />
              </div>
              দ্রুত ডেলিভারি
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">প্রোডাক্টের বিবরণ</h3>
            <p className="text-sm text-gray-500 leading-relaxed text-justify">
              {product.description || 
                `${product.name} একটি অত্যন্ত উন্নত মানের পণ্য যা আপনার কৃষিকাজকে আরও সহজ ও লাভজনক করতে সাহায্য করবে। এর সঠিক ব্যবহার ফসলের বৃদ্ধি নিশ্চিত করে এবং মাটির গুণাগুণ বজায় রাখে। সঠিক পরিমাপে ব্যবহার করলে দ্রুত এবং ভালো ফলাফল পাওয়া যায়।`}
            </p>
          </div>

        </div>
      </div>

      {/* ── Fixed Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-4 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] rounded-t-[2rem] z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">মোট মূল্য</span>
            <span className="text-2xl font-black text-green-600">
              ৳{(product.price * (quantity || 1)).toLocaleString("bn-BD")}
            </span>
          </div>

          {inCart ? (
            <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              <button 
                onClick={() => {
                  if (quantity === 1) removeFromCart(product.id);
                  else updateQty(product.id, quantity - 1);
                }} 
                className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                <Minus size={20} />
              </button>
              
              <span className="text-lg font-black text-gray-800 w-8 text-center">
                {quantity}
              </span>
              
              <button 
                onClick={() => updateQty(product.id, quantity + 1)} 
                className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-md shadow-green-600/20 text-white hover:bg-green-500 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(product)}
              className="flex-1 max-w-[200px] bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShoppingCart size={18} />
              কার্টে যোগ করুন
            </button>
          )}

        </div>
      </div>

    </div>
  );
}