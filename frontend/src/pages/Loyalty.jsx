// src/pages/Loyalty.jsx
import React, { useState, useEffect } from "react";
import {
  Star, Gift, TrendingUp, TrendingDown, Loader2, Search,
  Clock, ArrowUpRight, ArrowDownRight, Sparkles, Award, X, History, Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://127.0.0.1:8000/api";

export default function Loyalty({ currentUser }) {
  const [activeTab, setActiveTab] = useState("rewards");
  const [pointLogs, setPointLogs] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [userPoints, setUserPoints] = useState(currentUser?.total_points || 0);
  const [confirmModal, setConfirmModal] = useState({ show: false, reward: null });
  const [detailModal, setDetailModal] = useState({ show: false, reward: null });
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [logsRes, rewardsRes, myRewardsRes] = await Promise.all([
          axios.get(`${API}/loyalty/points/${currentUser.id}`),
          axios.get(`${API}/rewards/`),
          axios.get(`${API}/user-rewards/my-rewards/${currentUser.id}`).catch(() => ({ data: [] }))
        ]);
        setPointLogs(logsRes.data || []);
        setRewards((rewardsRes.data || []).filter(r => r.is_active));
        setMyRewards(myRewardsRes.data || []);
        const total = (logsRes.data || []).reduce((sum, log) => sum + log.points_changed, 0);
        setUserPoints(total >= 0 ? total : 0);
      } catch (err) { console.error("Lỗi tải dữ liệu loyalty:", err); } finally { setLoading(false); }
    };
    fetchData();
  }, [currentUser]);

  const handleRedeemClick = (reward) => {
    if (userPoints < reward.points_required) { toast.error("Bạn không đủ điểm để đổi quà này!"); return; }
    setConfirmModal({ show: true, reward });
  };

  const confirmRedeem = async () => {
    const r = confirmModal.reward;
    if (!r) return;
    try {
      setRedeeming(r.id);
      await axios.post(`${API}/rewards/redeem/${r.id}?user_id=${currentUser.id}`);
      
      // Reload everything
      const [logsRes, myRewardsRes] = await Promise.all([
          axios.get(`${API}/loyalty/points/${currentUser.id}`),
          axios.get(`${API}/user-rewards/my-rewards/${currentUser.id}`)
      ]);
      setPointLogs(logsRes.data || []);
      setMyRewards(myRewardsRes.data || []);
      
      const total = (logsRes.data || []).reduce((sum, log) => sum + log.points_changed, 0);
      setUserPoints(total >= 0 ? total : 0);
      toast.success("Đổi quà thành công!");
      setConfirmModal({ show: false, reward: null });
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi đổi quà"); } finally { setRedeeming(null); }
  };

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <Star className="size-12 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm font-medium">Vui lòng đăng nhập để xem điểm tích lũy</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="opacity-30 text-xs font-black uppercase tracking-widest">Đang kết nối hệ thống Loyalty...</span>
      </div>
    );
  }

  const earnedTotal = pointLogs.filter(l => l.points_changed > 0).reduce((s, l) => s + l.points_changed, 0);
  const spentTotal = Math.abs(pointLogs.filter(l => l.points_changed < 0).reduce((s, l) => s + l.points_changed, 0));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black  tracking-tight">Thành viên thân thiết</h1>
        <p className="opacity-40 text-sm font-medium mt-1">Tra cứu điểm thưởng và hạng thành viên</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#00704A] to-[#004d33] rounded-3xl p-6 text-white shadow-xl shadow-[#00704A]/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Điểm hiện tại</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">{fmt(userPoints)}</h2>
          <p className="text-xs opacity-50 mt-1">điểm thưởng</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--bg-card)] border border-black/5 dark:border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="size-4 text-emerald-500" />
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Tổng tích</span>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-300">+{fmt(earnedTotal)}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[var(--bg-card)] border border-black/5 dark:border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="size-4 text-rose-500" />
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Đã dùng</span>
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-300">-{fmt(spentTotal)}</h3>
        </motion.div>
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-black/5 dark:border-white/5">
        <button onClick={() => setActiveTab("rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "opacity-40 hover:text-black/70 dark:hover:text-white/70"}`}>
          <Gift className="size-3.5" />Đổi quà
        </button>
        <button onClick={() => setActiveTab("my-rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "my-rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "opacity-40 hover:text-black/70 dark:hover:text-white/70"}`}>
          <Award className="size-3.5" />Quà của tôi ({myRewards.length})
        </button>
      </div>

      {activeTab === "rewards" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-card)] border border-black/5 dark:border-white/10 rounded-3xl p-6">
          <Search className="size-8 opacity-20 mb-4" />
          <h3 className="text-lg font-black  mb-2">Tra cứu thẻ thành viên</h3>
          <p className="opacity-40 text-[11px] font-medium mb-6">Nhập số điện thoại khách hàng để kiểm tra điểm</p>
          <div className="w-full flex gap-2">
            <input 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-3  text-sm outline-none focus:ring-2 focus:ring-[#00704A] transition-all"
              placeholder="09xx xxx xxx"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {rewards.map(r => {
              const canRedeem = userPoints >= r.points_required;
              return (
                <div key={r.id} className={`p-5 rounded-2xl border ${canRedeem ? "border-amber-500/30 bg-amber-500/10" : "border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5"} transition-all flex gap-4`}>
                  {r.image_url && <img src={r.image_url} alt="" className="size-16 rounded-xl object-cover shadow-lg border border-white/5 flex-shrink-0" />}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className="text-sm font-bold ">{r.name}</h4>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {r.discount_value && parseFloat(r.discount_value) > 0 && (
                              <div className="inline-block px-2 py-0.5 bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[9px] font-bold rounded-md">
                                Giảm {fmt(r.discount_value)} đ
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-300">{fmt(r.points_required)} điểm</span>
                      <button
                        onClick={() => handleRedeemClick(r)}
                        disabled={!canRedeem || redeeming === r.id}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                          canRedeem
                            ? "bg-[#00704A] text-white hover:bg-[#00804f] shadow-md"
                            : "bg-black/5 dark:bg-white/5 opacity-20 cursor-not-allowed"
                        }`}
                      >
                        {redeeming === r.id ? <Loader2 className="size-3.5 animate-spin" /> : "Đổi ngay"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {activeTab === "my-rewards" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-card)] border border-black/5 dark:border-white/10 rounded-3xl p-6">
          <h3 className="text-sm font-extrabold  mb-6">Quà/Mã giảm giá đã đổi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myRewards.map(ur => {
              const r = ur.reward;
              const isUsed = ur.is_used;
              return (
                <div key={ur.id} className={`p-5 rounded-2xl border ${isUsed ? "border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 opacity-60 grayscale" : "border-emerald-500/30 bg-emerald-500/10"} transition-all flex gap-4`}>
                   <div className="flex-1">
                      <h4 className="text-sm font-bold ">{r?.name || "Mã ưu đãi"}</h4>
                      <p className="text-[10px] opacity-40 mt-0.5">{isUsed ? "Đã sử dụng" : "Chưa sử dụng"}</p>
                   </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="size-4 text-black/40 dark:text-white/60" />
          <h3 className="text-sm font-extrabold ">Lịch sử điểm</h3>
        </div>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {pointLogs.map(h => (
            <div key={h.id} className="py-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[11px] opacity-40 font-bold">{new Date(h.created_at).toLocaleDateString("vi-VN")}</span>
                <span className={`text-xs font-black ${h.points_changed > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                  {h.points_changed > 0 ? `+${h.points_changed}` : h.points_changed} pts
                </span>
              </div>
              <p className="text-xs font-bold ">{h.description || "Giao dịch tại quầy"}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {confirmModal.show && confirmModal.reward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ show: false, reward: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-black/10 dark:border-white/10 flex flex-col items-center">
              <h3 className="text-xl font-black  mb-2 text-center">Xác nhận đổi quà</h3>
              <p className="text-sm opacity-60 text-center mb-6">
                Bạn chắc chắn muốn đổi <strong className="text-amber-500">{confirmModal.reward.name}</strong>?
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmModal({ show: false, reward: null })} className="flex-1 py-3 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20  rounded-xl text-xs font-bold transition-all">Hủy</button>
                <button onClick={confirmRedeem} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20">Đồng ý</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailModal.show && detailModal.reward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailModal({ show: false, reward: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-md border border-white/10 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black  pr-4">{detailModal.reward.name}</h3>
                <button onClick={() => setDetailModal({ show: false, reward: null })} className="p-2 bg-black/5 dark:bg-white/10 rounded-full"><X className="size-4" /></button>
              </div>
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-black/10 dark:border-white/10">
                <div>
                  <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-1">Điểm yêu cầu</div>
                  <div className="text-lg font-black  tracking-tighter">{fmt(detailModal.reward.points_required)} <span className="text-xs opacity-60">pts</span></div>
                </div>
                <button onClick={() => { setDetailModal({ show: false, reward: null }); handleRedeemClick(detailModal.reward); }} className="px-6 py-3 bg-[#00704A] text-white rounded-xl text-xs font-black">
                  Tiến hành đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
