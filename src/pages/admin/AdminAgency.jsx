import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { MapPin, Phone, Check, X } from "lucide-react";

export default function AdminAgency() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const snap = await getDocs(query(collection(db, "agency_bookings"), orderBy("createdAt", "desc")));
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "agency_bookings", id), { status: newStatus });
    alert("এজেন্সি টিম স্ট্যাটাস আপডেট হয়েছে!");
    fetchBookings();
  };

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400 animate-pulse">রিকোয়েস্ট লোড হচ্ছে...</div>;

  return (
    <div className="space-y-4 animate-fadeIn">
      <h2 className="text-xl font-black text-gray-800 mb-4">জরুরি শ্রমিক রিকোয়েস্ট কন্ট্রোল ({bookings.length} টি)</h2>
      {bookings.map((req) => (
        <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-800">{req.farmerName}</span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${req.status === "requested" ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-green-50 text-green-600"}`}>{req.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={12}/> {req.location}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12}/> {req.farmerPhone}</p>
          </div>

          <div className="text-xs bg-gray-50 rounded-xl p-3 space-y-1">
            <p><span className="font-bold text-gray-700">প্রয়োজনীয় শ্রমিক:</span> {req.workerNeeded}</p>
            <p><span className="font-bold text-gray-700">ফসলের ধরন:</span> {req.cropType || "N/A"}</p>
            <p className="text-red-600 font-bold"><span className="font-bold text-gray-700">তারিখ:</span> {req.urgencyDate}</p>
          </div>

          <div className="flex gap-2 justify-end">
            {req.status === "requested" ? (
              <>
                <button onClick={() => updateStatus(req.id, "accepted_dispatched")} className="bg-green-600 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 shadow-sm w-full justify-center">
                  <Check size={14} /> কনফার্ম
                </button>
                <button onClick={() => updateStatus(req.id, "rejected")} className="bg-gray-100 text-gray-600 font-bold py-2 px-3 rounded-xl text-xs w-full justify-center">
                  রিজেক্ট
                </button>
              </>
            ) : (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border">অ্যাক্সেপ্টেড ✅</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}