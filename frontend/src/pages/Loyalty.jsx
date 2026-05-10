import React, { useState, useEffect } from "react";
import {
  Star, Gift, TrendingUp, Loader2,
  Clock, Sparkles, Award, History, Percent,
  Crown, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export default function Loyalty({ currentUser }) {
  const [activeTab, setActiveTab] = useState("benefits");
  const [pointLogs, setPointLogs] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [publicRewards, setPublicRewards] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);

  // We rely on currentUser.tier from the updated Profile payload
  const currentTier = currentUser?.tier || { tier_name: "Đồng", tier_order: 1, exp_required: 0, discount_percent: 0, color: "#CD7F32", icon: "🥉" };
  const userPoints = currentUser?.total_points || 0;

  const fetchData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [logsRes, myRewardsRes, tiersRes, publicRewardsRes] = await Promise.all([
        axios.get(`${API}/loyalty/points/${currentUser.id}`),
        axios.get(`${API}/user-rewards/my-rewards/${currentUser.id}`).catch(() => ({ data: [] })),
        axios.get(`${API}/loyalty/tiers`),
        axios.get(`${API}/rewards/`)
      ]);
      setPointLogs(logsRes.data || []);
      setMyRewards(myRewardsRes.data || []);
      setTiers(tiersRes.data || []);
      setPublicRewards(publicRewardsRes.data || []);
    } catch (err) { console.error("Lỗi tải dữ liệu loyalty:", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const redeemReward = async (r) => {
    if (userPoints < r.points_required) {
      import("react-hot-toast").then((module) => module.toast.error("Bạn không đủ điểm để đổi quà này"));
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/rewards/redeem/${r.id}?user_id=${currentUser.id}`);
      import("react-hot-toast").then((module) => module.toast.success(`Đổi ${r.name} thành công!`));
      await fetchData();
    } catch (err) {
      import("react-hot-toast").then((module) => module.toast.error(err.response?.data?.detail || "Không thể đổi quà"));
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <Star className="size-12 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm font-medium">Vui lòng đăng nhập để xem hạng thành viên</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="text-white/30 text-xs font-black uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  // Calculate Progress
  const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);
  const nextTier = sortedTiers.find(t => t.tier_order > currentTier.tier_order);
  let progressPercent = 100;
  if (nextTier) {
    const currentTierExp = currentTier.exp_required;
    const nextTierExp = nextTier.exp_required;
    const progressExp = userPoints - currentTierExp;
    const totalExpNeeded = nextTierExp - currentTierExp;
    progressPercent = Math.min(100, Math.max(0, (progressExp / totalExpNeeded) * 100));
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">Hạng thành viên</h1>
        <p className="text-white/40 text-sm font-medium mt-1">Tích lũy điểm để mở khóa các đặc quyền độc quyền</p>
      </motion.div>

      {/* Tier Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/10"
        style={{ background: `linear-gradient(135deg, ${currentTier.color || '#00704A'}33, #1E3932)` }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl">{currentTier.icon}</div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-14 rounded-full flex items-center justify-center text-3xl shadow-lg border border-white/20" style={{ backgroundColor: currentTier.color }}>
              {currentTier.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Hạng hiện tại</p>
              <h2 className="text-3xl font-black" style={{ color: currentTier.color }}>{currentTier.tier_name}</h2>
            </div>
          </div>

          <div className="mb-6 max-w-md">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold opacity-80">{fmt(userPoints)} <span className="text-[10px] uppercase">điểm</span></span>
              {nextTier ? (
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                  Cần {fmt(nextTier.exp_required - userPoints)} điểm nữa lên {nextTier.tier_name}
                </span>
              ) : (
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Hạng cao nhất</span>
              )}
            </div>
            <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} 
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: currentTier.color, boxShadow: `0 0 10px ${currentTier.color}` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex-1 max-w-[200px]">
              <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Giảm giá vĩnh viễn</div>
              <div className="text-2xl font-black text-emerald-400">{currentTier.discount_percent}%</div>
            </div>
            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex-1 max-w-[200px]">
              <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Quà khả dụng</div>
              <div className="text-2xl font-black text-amber-400">{myRewards.filter(r => !r.is_used).length}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Roadmap */}
      <div className="grid grid-cols-4 gap-2">
        {sortedTiers.map((t, idx) => {
          const isReached = userPoints >= t.exp_required;
          const isCurrent = t.id === currentTier.id;
          return (
            <div key={t.id} className={`flex flex-col items-center text-center ${isReached ? 'opacity-100' : 'opacity-40'} transition-all`}>
              <div className={`size-10 sm:size-12 rounded-full flex items-center justify-center text-xl sm:text-2xl mb-2 border-2 ${isCurrent ? 'scale-110 shadow-lg shadow-white/20' : ''}`} style={{ borderColor: t.color, backgroundColor: isReached ? `${t.color}22` : 'transparent' }}>
                {t.icon}
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-white mb-0.5">{t.tier_name}</span>
              <span className="text-[9px] text-white/50">{fmt(t.exp_required)} điểm</span>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5 mt-8">
        <button onClick={() => setActiveTab("benefits")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "benefits" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Crown className="size-3.5" />Đặc quyền Hạng
        </button>
        <button onClick={() => setActiveTab("store")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "store" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Gift className="size-3.5" />Cửa hàng quà
        </button>
        <button onClick={() => setActiveTab("my-rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "my-rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Award className="size-3.5" />Quà của tôi ({myRewards.length})
        </button>
        <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "history" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <History className="size-3.5" />Lịch sử
        </button>
      </div>

      {/* Đặc Quyền */}
      {activeTab === "benefits" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6 sm:p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2"><Sparkles className="size-5 text-emerald-400" /> Hệ thống đặc quyền</h3>
          <div className="space-y-4">
            {sortedTiers.map(t => (
              <div key={t.id} className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 ${userPoints >= t.exp_required ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5'}`}>
                <div className="size-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: t.color }}>{t.icon}</div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-white mb-1" style={{ color: t.color }}>Hạng {t.tier_name}</h4>
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-2">Từ {fmt(t.exp_required)} điểm</p>
                  <ul className="text-sm text-white/80 space-y-1">
                    {t.discount_percent > 0 ? (
                      <li className="flex items-center gap-2"><Percent className="size-3.5 text-emerald-400" /> Giảm giá {t.discount_percent}% mọi đơn hàng vĩnh viễn.</li>
                    ) : (
                      <li className="flex items-center gap-2 text-white/50">- Không có giảm giá -</li>
                    )}
                    {t.tier_order === 3 && <li className="flex items-center gap-2"><Gift className="size-3.5 text-amber-400" /> Tặng kèm Voucher 2 Ly nước bất kỳ khi thăng hạng.</li>}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cửa Hàng Quà Tặng */}
      {activeTab === "store" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Gift className="size-5 text-white" />
            <h3 className="text-lg font-black text-white">Đổi Điểm Lấy Quà</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicRewards.filter(r => r.is_active).map(r => (
              <div key={r.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                {r.image_url ? (
                  <img src={r.image_url} alt="" className="size-20 rounded-xl object-cover shadow-lg mb-3" />
                ) : (
                  <div className="size-20 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Gift className="size-8 text-white/30" />
                  </div>
                )}
                <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{r.name}</h4>
                <p className="text-[10px] text-white/50 mb-3 h-6 line-clamp-2">{r.description || "Quà tặng đặc biệt"}</p>
                <button 
                  onClick={() => redeemReward(r)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition-all ${userPoints >= r.points_required ? 'bg-amber-400 text-black hover:bg-amber-500 shadow-lg shadow-amber-400/20' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                >
                  {userPoints >= r.points_required ? `Đổi ${fmt(r.points_required)} điểm` : `Cần ${fmt(r.points_required)} điểm`}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quà Của Tôi */}
      {activeTab === "my-rewards" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Award className="size-5 text-white" />
            <h3 className="text-lg font-black text-white">Quà/Mã ưu đãi của bạn</h3>
          </div>
          {myRewards.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-8 italic">Bạn chưa có quà nào</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myRewards.map(ur => {
                const r = ur.reward;
                const isUsed = ur.is_used;
                return (
                  <div key={ur.id} className={`p-5 rounded-2xl border ${isUsed ? "border-white/10 bg-white/5 opacity-60 grayscale" : "border-emerald-500/30 bg-emerald-500/10"} transition-all flex gap-4`}>
                    {r?.image_url && <img src={r.image_url} alt="" className="size-16 rounded-xl object-cover shadow-lg border border-white/5 flex-shrink-0" />}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className={`text-[9px] font-black uppercase mb-1 block ${r?.reward_type_id === 2 ? 'text-sky-300' : 'text-purple-300'}`}>
                            {r?.reward_type_id === 2 ? "Mã giảm giá" : "Voucher tự động"}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight mb-2">{r?.name || "Mã ưu đãi"}</h4>
                        {isUsed && (
                            <p className="text-[10px] text-white/50">Dùng ngày: {new Date(ur.used_at).toLocaleDateString('vi-VN')}</p>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                        <span className={`px-2 py-1 rounded text-[9px] font-black ${isUsed ? "bg-white/10 text-white/50" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {isUsed ? "Đã Sử Dụng" : "Chưa Sử Dụng"}
                        </span>
                        {!isUsed && <span className="text-[10px] text-white/40 italic">Tự động ở Checkout</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Point History */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="size-5 text-white" />
            <h3 className="text-lg font-black text-white">Lịch sử tích điểm</h3>
          </div>
          {pointLogs.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-8 italic">Chưa có biến động điểm nào</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pointLogs.map(log => (
                <div key={log.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${log.points_changed >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                      {log.points_changed >= 0 ? <TrendingUp className="size-5 text-emerald-400" /> : <TrendingUp className="size-5 text-rose-400 rotate-180" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-0.5">{log.description || "Tích điểm"}</p>
                      <p className="text-[10px] text-white/40">{new Date(log.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-black ${log.points_changed >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {log.points_changed > 0 ? "+" : ""}{fmt(log.points_changed)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
