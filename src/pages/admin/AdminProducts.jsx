import { useState, useEffect, useRef } from "react";
import { db } from "../../firebase";
import { collection, getDocs, addDoc, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Plus, Layers, ImagePlus, Loader2, SearchX, Trash2 } from "lucide-react";

// Cloudinary Credentials
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "AgroDoc"; 
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "dzr4s78pk"; 

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ 
    name: "", price: "", category: "fertilizer", unit: "", image: "", badge: "" 
  });
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const prodSnap = await getDocs(query(collection(db, "products"), orderBy("name")));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Handle Image Selection and Upload to Cloudinary
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show instant preview
    setPreviewImage(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("cloud_name", CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setNewProduct(prev => ({ ...prev, image: data.secure_url }));
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      alert("ছবি আপলোড করা যায়নি! আবার চেষ্টা করুন।");
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.unit) {
      alert("সব তথ্য দিন!");
      return;
    }
    if (!newProduct.image) {
      alert("অনুগ্রহ করে একটি ছবি আপলোড করুন!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), { 
        ...newProduct, 
        price: Number(newProduct.price), 
        rating: "4.7" 
      });
      alert("নতুন প্রোডাক্ট যুক্ত হয়েছে!");
      setNewProduct({ name: "", price: "", category: "fertilizer", unit: "", image: "", badge: "" });
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchProducts();
    } catch (err) { 
      alert("প্রোডাক্ট যোগ করতে ত্রুটি হয়েছে!"); 
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই প্রোডাক্টটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert("ডিলিট করা যায়নি!");
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 w-full">
        <Loader2 size={24} className="text-green-500 animate-spin mb-3" />
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">প্রোডাক্ট লোড হচ্ছে...</p>
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
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100/50">
            <Layers size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">প্রোডাক্ট ম্যানেজমেন্ট</h2>
            <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 md:mt-1">দোকানের সকল প্রোডাক্ট যোগ করুন এবং পরিচালনা করুন</p>
          </div>
        </div>
      </div>

      {/* ── Add New Product Form ── */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm animate-[fadeInUp_0.4s_ease-out_both]">
        <h3 className="text-sm font-black text-gray-800 border-b border-gray-50 pb-4 mb-5 flex items-center gap-2">
          <Plus size={18} className="text-green-600" /> নতুন প্রোডাক্ট যোগ করুন
        </h3>
        
        <form onSubmit={handleAddProduct} className="space-y-5">
          {/* Image Upload Area */}
          <div className="flex flex-col items-center justify-center">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" id="imageUpload" />
            <label htmlFor="imageUpload" 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-bold">পরিবর্তন করুন</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-green-500 transition-colors">
                  <ImagePlus size={28} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">ছবি আপলোড</span>
                </div>
              )}
              
              {/* Uploading Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin text-green-500" />
                  <span className="text-[10px] font-bold text-gray-600">আপলোড হচ্ছে...</span>
                </div>
              )}
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">প্রোডাক্টের নাম *</label>
              <input required placeholder="যেমন: ইউরিয়া সার" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm font-semibold transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">মূল্য (টাকা) *</label>
              <input required type="number" placeholder="যেমন: ১২০০" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm font-semibold transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">পরিমাণ / ইউনিট *</label>
              <input required placeholder="যেমন: ৫০ কেজি বস্তা" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm font-semibold transition-all"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">ক্যাটাগরি *</label>
              <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-sm font-bold transition-all appearance-none cursor-pointer">
                <option value="fertilizer">সার</option>
                <option value="pesticide">কীটনাশক</option>
                <option value="seeds">বীজ</option>
                <option value="tools">যন্ত্রপাতি</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={uploading} 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
              <Plus size={16} /> প্রোডাক্ট সেভ করুন
            </button>
          </div>
        </form>
      </div>

      {/* ── Product List Table ── */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 p-6 md:p-8 shadow-sm overflow-hidden animate-[fadeInUp_0.5s_ease-out_both]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-gray-800">সকল প্রোডাক্ট ({products.length})</h3>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-10">
            <SearchX size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-bold">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">ছবি</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">নাম</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ক্যাটাগরি</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">মূল্য</th>
                  <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><Layers size={16}/></div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-gray-800 text-[13px]">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{p.unit}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-black text-green-600 text-[14px]">৳{p.price}</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors active:scale-90">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}