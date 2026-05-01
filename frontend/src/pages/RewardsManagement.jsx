import React, { useState, useEffect } from "react";
import {
  Gift, Percent, Loader2, Save, RefreshCw, Plus, Pencil, Trash2, X, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomSelect from "../components/CustomSelect";

const API = "http://127.0.0.1:8000/api";

const EMPTY_REWARD = { name: "", description: "", points_required: "", reward_type_id: 1, discount_value: "", image_url: "", quantity: "", is_active: true };

export default function RewardsManagement() {
  const [activeTab, setActiveTab] = useState("rewards");
  
  // States for Rewards
  const [rewards, setRewards] = useState([]);
  const [history, setHistory] = useState([]); // Thêm state cho lịch sử
  const [loading, setLoading] = useState(true);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState(EMPTY_REWARD);
  const [savingReward, setSavingReward] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // States for Config
  const [config, setConfig] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, historyRes, configRes] = await Promise.all([
        axios.get(`${API}/rewards/`),
        axios.get(`${API}/loyalty/history`).catch(() => ({ data: [] })),
        axios.get(`${API}/loyalty/config`).catch(() => ({ data: null })),
      ]);
      setRewards(rewardsRes.data || []);
      setHistory(historyRes.data || []);
      if (configRes.data) {
        setConfig(configRes.data);
        setNewRate(String(parseFloat(configRes.data.earning_rate) * 100));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveConfig = async () => {
    const rate = parseFloat(newRate) / 100;
    if (isNaN(rate) || rate <= 0 || rate > 100) { toast.error("Tỷ lệ phải từ 0.01% đến 100%"); return; }
    setSavingConfig(true);
    try { 
      await axios.put(`${API}/loyalty/config`, { earning_rate: rate }); 
      await fetchData(); 
      toast.success("Cập nhật tỷ lệ tích điểm thành công!"); 
    } catch (err) { 
      toast.error(err.response?.data?.detail || "Lỗi cập nhật"); 
    } finally { 
      setSavingConfig(false); 
    }
  };

  const openCreateReward = () => { setEditingReward(null); setRewardForm(EMPTY_REWARD); setShowRewardForm(true); };
  
  const openEditReward = (r) => { 
    setEditingReward(r); 
    setRewardForm({ 
      name: r.name, 
      description: r.description || "", 
      points_required: r.points_required, 
      reward_type_id: r.reward_type_id, 
      discount_value: r.discount_value || "",
      image_url: r.image_url || "",
      quantity: r.quantity !== null ? r.quantity : "",
      is_active: r.is_active
    }); 
    setShowRewardForm(true); 
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
    
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingImage(true);
      const res = await axios.post(`${API}/products/upload-image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setRewardForm({ ...rewardForm, image_url: res.data.url });
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi tải ảnh"); } finally { setUploadingImage(false); }
  };

  const saveReward = async () => {
    if (!rewardForm.name || !rewardForm.points_required) { 
        toast.error("Vui lòng điền Tên quà và Điểm yêu cầu!"); 
        return; 
    }
    setSavingReward(true);
    try {
      const payload = { 
        ...rewardForm, 
        points_required: parseInt(rewardForm.points_required),
        reward_type_id: parseInt(rewardForm.reward_type_id),
        discount_value: rewardForm.discount_value && rewardForm.reward_type_id == 2 ? parseFloat(rewardForm.discount_value) : null,
        quantity: rewardForm.quantity === "" ? null : parseInt(rewardForm.quantity)
      };
      
      if (editingReward) { 
        await axios.put(`${API}/rewards/${editingReward.id}`, payload); 
      } else { 
        await axios.post(`${API}/rewards/`, payload); 
      }
      
      setShowRewardForm(false);
      toast.success(editingReward ? "Cập nhật quà tặng thành công" : "Thêm quà tặng thành công");
      await fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.detail || "Lỗi lưu phần thưởng"); 
    } finally { 
      setSavingReward(false); 
    }
  };

  const deleteReward = async (id) => { 
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Xác nhận xóa quà tặng định danh này?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors">Hủy</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try { 
                await axios.delete(`${API}/rewards/${id}`); 
                toast.success("Đã xóa quà tặng"); 
                await fetchData(); 
              } catch (err) { toast.error(err.response?.data?.detail || "Lỗi xóa quà tặng"); }
            }} 
            className="px-3 py-1.5 bg-rose-500 rounded-lg text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >Xóa</button>
        </div>
      </div>
    ), { id: 'confirm-toast', duration: Infinity, style: { background: '#1E3932', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const toggleRewardActive = async (r) => {
    try {
      await axios.put(`${API}/rewards/${r.id}`, { ...r, is_active: !r.is_active });
      toast.success(r.is_active ? "Đã tắt phần thưởng" : "Đã bật phần thưởng");
      await fetchData();
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

  const getTypeName = (id) => id === 2 ? "Mã giảm giá" : "Vật phẩm";
  const getRewardName = (id) => rewards.find(r => r.id === id)?.name || `Quà #${id}`;
  const getCustomerName = (id) => `Khách hàng #${id}`; // Fallback nếu không có data khách

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="opacity-30 text-xs font-black uppercase tracking-widest">Đang tải cấu hình đổi thưởng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black  tracking-tight">Quản lý đổi thưởng</h1>
          <p className="opacity-40 text-sm font-medium mt-1">Cấu hình quà tặng và lịch sử quy đổi</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <RefreshCw className="size-4 opacity-50" />
        </button>
      </motion.div>

      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-black/5 dark:border-white/5">
        <button onClick={() => setActiveTab("rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "opacity-40 hover:text-black dark:hover:text-white/70"}`}>
          <Gift className="size-3.5" />Quà tặng ({rewards.length})
        </button>
        <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "history" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "opacity-40 hover:text-black dark:hover:text-white/70"}`}>
          <Clock className="size-3.5" />Lịch sử đổi quà
        </button>
      </div>

      {activeTab === "rewards" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateReward} className="px-5 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all flex items-center gap-2 shadow-lg shadow-[#00704A]/20">
              <Plus className="size-4" /> Thêm Quà Tặng
            </button>
          </div>
          <div className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <th className="text-left text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider py-4 px-6">Quà tặng</th>
                  <th className="text-left text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider py-4 px-4">Loại</th>
                  <th className="text-right text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider py-4 px-4">Điểm yêu cầu</th>
                  <th className="text-center text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider py-4 px-4">Trạng thái</th>
                  <th className="text-center text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {rewards.map(r => (
                  <tr key={r.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img src={r.image_url || "https://via.placeholder.com/40"} className="size-10 rounded-xl object-cover border border-black/5 dark:border-white/5" />
                        <span className="text-sm font-bold ">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] opacity-40 font-black uppercase">{getTypeName(r.reward_type_id)}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-black text-amber-500">{r.points_required}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.is_active ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                        {r.is_active ? "Kích hoạt" : "Tạm dừng"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button onClick={() => openEditReward(r)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg"><Pencil className="size-4 opacity-50" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {activeTab === "history" && (
        <div className="bg-white dark:bg-[#00704A] rounded-3xl p-6 border border-black/5 dark:border-white/10">
          {history.map(h => (
            <div key={h.id} className="flex justify-between items-center py-3 border-b border-black/5 dark:border-white/5 last:border-0">
              <span className="text-sm font-bold ">{getCustomerName(h.customer_id)}</span>
              <span className="text-xs opacity-60">{getRewardName(h.reward_id)}</span>
              <span className="text-[11px] opacity-40">{new Date(h.redeemed_at).toLocaleString("vi-VN")}</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showRewardForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRewardForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-[#1E3932] rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-black/5 dark:border-white/10 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black ">{editingReward ? "Sửa quà tặng" : "Thêm quà tặng mới"}</h2>
                <button onClick={() => setShowRewardForm(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><X className="size-5 text-black/30 dark:text-white/40" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-black/30 dark:text-white/40 font-bold uppercase tracking-wider block mb-1.5">Tên quà tặng</label>
                  <input value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm  outline-none focus:ring-2 focus:ring-[#00704A] transition-all" placeholder="Voucher 50k..." />
                </div>
                <div>
                  <label className="text-[10px] text-black/30 dark:text-white/40 font-bold uppercase tracking-wider block mb-1.5">Mô tả</label>
                  <textarea value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm  outline-none focus:ring-2 focus:ring-[#00704A] transition-all h-20 resize-none" placeholder="Giảm trực tiếp vào tổng hóa đơn..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Loại Quà</label>
                    <CustomSelect 
                      value={parseInt(rewardForm.reward_type_id) || 1} 
                      onChange={val => setRewardForm({...rewardForm, reward_type_id: parseInt(val)})} 
                      options={[
                        { value: 1, label: "Quà Tặng Hiện Vật" },
                        { value: 2, label: "Mã Giảm Giá" }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-black/30 dark:text-white/40 font-bold uppercase tracking-wider block mb-1.5">Điểm yêu cầu</label>
                    <input type="number" value={rewardForm.points_required} onChange={e => setRewardForm({...rewardForm, points_required: e.target.value})} className="w-full px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm  outline-none focus:ring-2 focus:ring-[#00704A] transition-all" placeholder="500" />
                  </div>
                </div>
                <button onClick={saveReward} disabled={savingReward} className="w-full py-3 mt-4 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00704A]/20">
                  {editingReward ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
