import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"; // 'getDocs' এর পরিবর্তে 'onSnapshot'
import { Calendar, Smartphone } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ১. loading স্টেট ট্রু করুন
    setLoading(true);
    
    // ২. Firestore কুয়েরি তৈরি করুন
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

    // ৩. 'onSnapshot' ব্যবহার করে রিয়েল-টাইম লিসেনার সেট করুন
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false); // ডেটা লোড হলে লোডিং বন্ধ করুন
    }, (error) => {
      console.error("Error listening to users: ", error);
      setLoading(false); // এরর হলেও লোডিং বন্ধ করুন
    });

    // ৪. কম্পোনেন্ট আনমাউন্ট হলে লিসেনার বন্ধ করুন
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs font-bold text-gray-400 animate-pulse">ইউজার ডাটা লোড হচ্ছে...</div>;

  return (
    <div className="space-y-4 animate-fadeIn px-3 sm:px-0"> {/* মোবাইল-এ মার্জিন যুক্ত করা হয়েছে */}
      <h2 className="text-xl font-black text-gray-800 mb-4 text-center sm:text-left">
        নিবন্ধিত ইউজার তালিকা ({users.length} জন)
      </h2>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* টেবিল লেআউট: শুধুমাত্র মিডিয়াম এবং বড় স্ক্রিনের জন্য (md:block) */}
        <div className="hidden md:block p-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-bold">ব্যবহারকারী</th>
                <th className="pb-3 font-bold">যোগাযোগ</th>
                <th className="pb-3 font-bold">যোগদানের তারিখ</th>
                <th className="pb-3 font-bold text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
              {users.map((u) => {
                let displayDate = "তথ্য নেই";
                if (u.createdAt) {
                  const dateObj = typeof u.createdAt === 'string' ? new Date(u.createdAt) : u.createdAt.toDate();
                  displayDate = dateObj.toLocaleDateString("bn-BD", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
                }
                const userName = u.name || u.displayName || "নামহীন কৃষক";
                const userPhone = u.phone || u.phoneNumber || u.email || "মোবাইল যুক্ত নেই";
                const userAvatarText = userName ? userName[0].toUpperCase() : "K";

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* ব্যবহারকারীর নাম */}
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-black text-sm">
                          {userAvatarText}
                        </div>
                        <div>
                          <p className="font-bold text-gray-950 text-sm">{userName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">ID: {u.id.slice(0, 6)}</p>
                        </div>
                      </div>
                    </td>
                    {/* মোবাইল বা ইমেইল */}
                    <td className="py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Smartphone size={12} className="text-gray-400" />
                        <span>{userPhone}</span>
                      </div>
                    </td>
                    {/* যোগদানের তারিখ */}
                    <td className="py-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span>{displayDate}</span>
                      </div>
                    </td>
                    {/* লগইন স্ট্যাটাস */}
                    <td className="py-4 text-right">
                      {u.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-600 px-2.5 py-1 rounded-full text-[10px] font-black">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          অনলাইন
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                          অফলাইন
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* কার্ড লেআউট: শুধুমাত্র মোবাইল এবং ছোট স্ক্রিনের জন্য (md:hidden) */}
        <div className="md:hidden p-5 space-y-4">
          {users.map((u) => {
            let displayDate = "তথ্য নেই";
            if (u.createdAt) {
              const dateObj = typeof u.createdAt === 'string' ? new Date(u.createdAt) : u.createdAt.toDate();
              displayDate = dateObj.toLocaleDateString("bn-BD", { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
            }
            const userName = u.name || u.displayName || "নামহীন কৃষক";
            const userPhone = u.phone || u.phoneNumber || u.email || "মোবাইল যুক্ত নেই";
            const userAvatarText = userName ? userName[0].toUpperCase() : "K";

            return (
              <div key={u.id} className="p-4 border border-gray-100 rounded-2xl bg-white space-y-2">
                
                {/* সারি ১: অবতার, নাম, আইডি, স্ট্যাটাস */}
                <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-black text-sm">
                            {userAvatarText}
                        </div>
                        <div>
                            <p className="font-bold text-gray-950 text-sm truncate max-w-[120px]">{userName}</p>
                            <p className="text-[10px] text-gray-400 font-bold">ID: {u.id.slice(0, 6)}</p>
                        </div>
                    </div>
                    <div>
                        {u.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-600 px-2 py-0.5 rounded-full text-[9px] font-black">
                              <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                              অনলাইন
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              অফলাইন
                            </span>
                        )}
                    </div>
                </div>

                {/* সারি ২: যোগাযোগের তথ্য */}
                <div className="flex items-center gap-1.5 text-gray-600 text-[11px] truncate">
                   <Smartphone size={13} className="text-gray-400" />
                   <span>{userPhone}</span>
                </div>

                {/* সারি ৩: অ্যাক্টিভিটি তথ্য */}
                <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Calendar size={13} className="text-gray-400" />
                    <span>যোগদানের তারিখ: {displayDate}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* কোনো ইউজার পাওয়া না গেলে */}
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-400 font-bold">কোনো ইউজার ডাটা পাওয়া যায়নি।</div>
        )}
      </div>
    </div>
  );
}