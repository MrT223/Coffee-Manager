import React, { useState, useEffect } from "react";
import {
  Gift, Percent, Loader2, Save, RefreshCw, Plus, Pencil, Trash2, X
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
      const [rewardsRes, configRes] = await Promise.all([
        axios.get(`${API}/rewards/`),
        axios.get(`${API}/loyalty/config`).catch(() => ({ data: null })),
      ]);
      setRewards(rewardsRes.data || []);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="text-white/30 text-xs font-black uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý điểm & Quà tặng</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Cấu hình tích điểm và quản lý danh mục phần thưởng</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw className="size-4 text-white/50" />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5">
        <button onClick={() => setActiveTab("rewards")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "rewards" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Gift className="size-3.5" />Quà tặng ({rewards.length})
        </button>
        <button onClick={() => setActiveTab("config")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "config" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Percent className="size-3.5" />Cấu hình tích điểm
        </button>
      </div>

      {/* TAB TRANG QUẢN TRỊ QUÀ TẶNG */}
      {activeTab === "rewards" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateReward} className="px-5 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all flex items-center gap-2 shadow-lg shadow-[#00704A]/20">
              <Plus className="size-4" /> Thêm Quà Tặng
            </button>
          </div>

          <div className="bg-[#00704A] rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">ID</th>
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Tên Quà Tặng</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Yêu cầu</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Loại Quà</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Giảm giá/Kho</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rewards.map(r => (
                  <tr key={r.id} className={`transition-colors ${!r.is_active ? 'opacity-40 grayscale hover:opacity-60' : 'hover:bg-white/5'}`}>
                    <td className="py-4 px-6 text-xs text-white/50 font-bold">#{r.id}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {r.image_url && <img src={r.image_url} className="size-10 rounded-xl object-cover flex-shrink-0" alt="" />}
                        <div>
                          <div className="text-sm font-bold text-white">{r.name}</div>
                          {r.description && <div className="text-[10px] text-white/40 mt-1 line-clamp-1">{r.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-black text-amber-300">{fmt(r.points_required)} điểm</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.reward_type_id == 1 ? "bg-purple-500/20 text-purple-300" : "bg-sky-500/20 text-sky-300"}`}>
                        {r.reward_type_id == 1 ? "Quà Tặng Vật Phẩm" : "Mã Giảm Giá"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                        <div className="text-xs text-white/50 font-bold mb-1">{r.discount_value ? fmt(r.discount_value) + " đ" : "—"}</div>
                        <div className="text-[10px] text-white/30">{r.quantity !== null ? `Còn ${r.quantity}` : "Vô hạn"}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleRewardActive(r)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${r.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                          {r.is_active ? "Bật" : "Tắt"}
                        </button>
                        <button onClick={() => openEditReward(r)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                          <Pencil className="size-3.5 text-white/50" />
                        </button>
                        <button onClick={() => deleteReward(r.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors">
                          <Trash2 className="size-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rewards.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-white/30 text-sm">Chưa có quà tặng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB LOYALTY CONFIG */}
      {activeTab === "config" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
          <div className="bg-[#00704A] rounded-3xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/10 p-3 rounded-2xl">
                <Percent className="size-5 text-white/60" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Cấu hình tích điểm</h3>
                <p className="text-[10px] text-white/40 font-medium">Tỷ lệ điểm thưởng trên mỗi đơn hàng</p>
              </div>
            </div>

            {config ? (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-2">Tỷ lệ tích điểm hiện tại</label>
                  <div className="text-3xl font-black text-amber-300">{(parseFloat(config.earning_rate) * 100).toFixed(1)}%</div>
                  <p className="text-[10px] text-white/40 mt-1">{config.description}</p>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-2">Tỷ lệ mới (%)</label>
                  <div className="flex gap-3">
                    <input
                      type="number" step="0.1" min="0.1" max="100"
                      value={newRate} onChange={e => setNewRate(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-white/20"
                      placeholder="5.0"
                    />
                    <button
                      onClick={saveConfig} disabled={savingConfig}
                      className="px-6 py-3 bg-white text-[#00704A] rounded-xl text-xs font-black hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg"
                    >
                      {savingConfig ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-white/30 text-sm text-center py-8">Chưa có cấu hình tích điểm</p>
            )}
          </div>
        </motion.div>
      )}

      {/* MODAL FORM REWARDS */}
      <AnimatePresence>
        {showRewardForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRewardForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/10 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">{editingReward ? "Sửa phân thưởng" : "Thêm phần thưởng mới"}</h2>
                <button onClick={() => setShowRewardForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="size-5 text-white/40" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Tên quà tặng</label>
                  <input value={rewardForm.name} onChange={e => setRewardForm({...rewardForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Nhập tên..." />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Mô tả (Không bắt buộc)</label>
                  <input value={rewardForm.description} onChange={e => setRewardForm({...rewardForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Chi tiết phần thưởng..." />
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
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Điểm Cần Đổi</label>
                    <input type="number" min="1" value={rewardForm.points_required} onChange={e => setRewardForm({...rewardForm, points_required: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Vd: 300..." />
                  </div>
                </div>
                <AnimatePresence>
                  {rewardForm.reward_type_id == 2 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95, height: 0 }} animate={{ opacity: 1, scale: 1, height: 'auto' }} exit={{ opacity: 0, scale: 0.95, height: 0 }}>
                      <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mt-4 mb-1.5">Mức giảm giá (VND - Tùy chọn)</label>
                      <input type="number" min="0" value={rewardForm.discount_value} onChange={e => setRewardForm({...rewardForm, discount_value: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Vnd: 50000" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Số lượng (Kho) - Tùy chọn</label>
                    <input type="number" min="0" value={rewardForm.quantity} onChange={e => setRewardForm({...rewardForm, quantity: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Bỏ trống nếu vô hạn" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Trạng thái (Bật/Tắt)</label>
                    <button onClick={() => setRewardForm({...rewardForm, is_active: !rewardForm.is_active})} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${rewardForm.is_active ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'}`}>
                      {rewardForm.is_active ? "Đang Bật" : "Đang Tắt"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Hình ảnh (Tùy chọn)</label>
                  <div className="flex gap-2">
                    <input value={rewardForm.image_url} onChange={e => setRewardForm({...rewardForm, image_url: e.target.value})} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Nhập Link URL hoặc Tải lên..." />
                    <label className="flex-shrink-0 cursor-pointer px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors flex items-center justify-center">
                      {uploadingImage ? <Loader2 className="size-4 animate-spin text-white/40" /> : <span className="text-xs font-bold text-white/80">Tải ảnh lên</span>}
                      <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
                <button onClick={saveReward} disabled={savingReward} className="w-full py-3 mt-4 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00704A]/20">
                  {savingReward ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
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
