// src/pages/Loyalty.jsx
import React, { useState, useEffect } from "react";
import {
  Star, Gift, TrendingUp, TrendingDown, Loader2,
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
        <span className="text-white/30 text-xs font-black uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  const earnedTotal = pointLogs.filter(l => l.points_changed > 0).reduce((s, l) => s + l.points_changed, 0);
  const spentTotal = Math.abs(pointLogs.filter(l => l.points_changed < 0).reduce((s, l) => s + l.points_changed, 0));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">Chương trình tích điểm</h1>
        <p className="text-white/40 text-sm font-medium mt-1">Tích điểm mỗi đơn hàng, đổi quà hấp dẫn</p>
      </motion.div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#00704A] to-[#004d33] rounded-3xl p-6 text-white shadow-xl shadow-[#00704A]/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Điểm hiện tại</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight">{fmt(userPoints)}</h2>
          <p className="text-xs opacity-50 mt-1">điểm thưởng</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="size-4 text-emerald-400" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Tổng tích</span>
          </div>
          <h3 className="text-2xl font-black text-emerald-300">+{fmt(earnedTotal)}</h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="size-4 text-rose-400" />
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Đã dùng</span>
          </div>
          <h3 className="text-2xl font-black text-rose-300">-{fmt(spentTotal)}</h3>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5">
        <button onClick={() => setActiveTab("rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Gift className="size-3.5" />Đổi quà
        </button>
        <button onClick={() => setActiveTab("my-rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "my-rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Award className="size-3.5" />Quà của tôi ({myRewards.length})
        </button>
      </div>

      {/* Cửa hàng Rewards */}
      {activeTab === "rewards" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Gift className="size-4 text-white/60" />
            <h3 className="text-sm font-extrabold text-white">Cửa hàng quà tặng</h3>
          </div>
          {rewards.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-8 italic">Chưa có quà tặng nào</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rewards.map(r => {
                const canRedeem = userPoints >= r.points_required;
                return (
                  <div key={r.id} className={`p-5 rounded-2xl border ${canRedeem ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-white/5"} transition-all flex gap-4`}>
                    {r.image_url && <img src={r.image_url} alt="" className="size-16 rounded-xl object-cover shadow-lg border border-white/5 flex-shrink-0" />}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h4 className="text-sm font-bold text-white">{r.name}</h4>
                            {r.description && <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{r.description}</p>}
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {r.discount_value && parseFloat(r.discount_value) > 0 && (
                                <div className="inline-block px-2 py-0.5 bg-sky-500/20 text-sky-300 text-[9px] font-bold rounded-md">
                                  Giảm {fmt(r.discount_value)} đ
                                </div>
                              )}
                              <button onClick={() => setDetailModal({ show: true, reward: r })} className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white/80 text-[9px] font-bold rounded-md transition-colors">
                                Chi tiết
                              </button>
                            </div>
                          </div>
                          <Award className={`size-5 flex-shrink-0 ml-2 ${canRedeem ? "text-amber-400" : "text-white/20"}`} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-black text-amber-300">{fmt(r.points_required)} điểm</span>
                        <button
                          onClick={() => handleRedeemClick(r)}
                          disabled={!canRedeem || redeeming === r.id}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                            canRedeem
                              ? "bg-white text-[#00704A] hover:bg-white/90 shadow-md"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
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
          )}
        </motion.div>
      )}

      {/* Quà Của Tôi */}
      {activeTab === "my-rewards" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Award className="size-4 text-white/60" />
            <h3 className="text-sm font-extrabold text-white">Quà/Mã giảm giá đã đổi</h3>
          </div>
          {myRewards.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-8 italic">Bạn chưa đổi quà nào</p>
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
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span className={`text-[9px] font-black uppercase mb-1 block ${r?.reward_type_id === 2 ? 'text-sky-300' : 'text-purple-300'}`}>
                                {r?.reward_type_id === 2 ? "Mã giảm giá" : "Quà vật phẩm"}
                            </span>
                            <h4 className="text-sm font-bold text-white">{r?.name || "Mã ưu đãi"}</h4>
                            {isUsed && (
                                <p className="text-[10px] text-white/50 mt-0.5">Dùng ngày: {new Date(ur.used_at).toLocaleDateString('vi-VN')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black ${isUsed ? "bg-white/10 text-white/50" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {isUsed ? "Đã Sử Dụng" : "Chưa Sử Dụng"}
                        </span>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="size-4 text-white/60" />
          <h3 className="text-sm font-extrabold text-white">Lịch sử điểm</h3>
        </div>
        {pointLogs.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-8 italic">Chưa có biến động điểm nào</p>
        ) : (
          <div className="divide-y divide-white/5">
            {pointLogs.map(log => (
              <div key={log.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${log.points_changed > 0 ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                    {log.points_changed > 0 ? <TrendingUp className="size-4 text-emerald-400" /> : <TrendingDown className="size-4 text-rose-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{log.description || (log.points_changed > 0 ? "Tích điểm" : "Đổi quà")}</p>
                    <p className="text-[10px] text-white/40">{new Date(log.created_at).toLocaleString("vi-VN")}</p>
                  </div>
                </div>
                <span className={`text-sm font-black ${log.points_changed > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {log.points_changed > 0 ? "+" : ""}{fmt(log.points_changed)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* CONFIRM MODAL */}
      <AnimatePresence>
        {confirmModal.show && confirmModal.reward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal({ show: false, reward: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-white/10 flex flex-col items-center">
              <div className="size-14 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/30">
                <Gift className="size-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 text-center">Xác nhận đổi quà</h3>
              <p className="text-sm text-white/60 text-center mb-6 px-4">
                Bạn sắp dùng <strong className="text-amber-400">{fmt(confirmModal.reward.points_required)} điểm</strong> để đổi lấy <strong>{confirmModal.reward.name}</strong>. Điểm của bạn sẽ bị trừ đi tương ứng.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmModal({ show: false, reward: null })} disabled={redeeming} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
                  Hủy bỏ
                </button>
                <button onClick={confirmRedeem} disabled={redeeming} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 transition-all">
                  {redeeming ? <Loader2 className="size-4 animate-spin" /> : "Đồng ý"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailModal.show && detailModal.reward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailModal({ show: false, reward: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-md border border-white/10 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-white pr-4">{detailModal.reward.name}</h3>
                <button onClick={() => setDetailModal({ show: false, reward: null })} className="p-2 bg-white/10 rounded-full hover:bg-white/20 flex-shrink-0"><X className="size-4 text-white" /></button>
              </div>
              {detailModal.reward.image_url && <img src={detailModal.reward.image_url} alt="" className="w-full aspect-video object-cover rounded-2xl mb-4 border border-white/5 shadow-inner" />}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4 max-h-48 overflow-y-auto">
                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Thông tin chi tiết</h4>
                <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{detailModal.reward.description || "Chưa có mô tả chi tiết."}</p>
              </div>
              {detailModal.reward.reward_type_id === 2 && detailModal.reward.discount_value && (
                <div className="mb-4 inline-block w-fit px-3 py-1.5 bg-sky-500/20 text-sky-300 text-xs font-black rounded-xl border border-sky-500/30">
                  GIẢM TRỰC TIẾP {fmt(detailModal.reward.discount_value)} Đ
                </div>
              )}
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Điểm yêu cầu</div>
                  <div className="text-lg font-black text-amber-300">{fmt(detailModal.reward.points_required)} <span className="text-xs opacity-60">pts</span></div>
                </div>
                <button onClick={() => { setDetailModal({ show: false, reward: null }); handleRedeemClick(detailModal.reward); }} className="px-6 py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black shadow-lg shadow-[#00704A]/30 transition-all">
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
