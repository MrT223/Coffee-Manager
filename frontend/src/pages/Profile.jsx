// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import {
  User, ShoppingBag, Star, Calendar, Shield,
  Loader2, Lock, Eye, EyeOff, ChevronDown, ChevronUp,
  Package, Clock, CheckCircle2, XCircle, Truck,
  Coffee, ArrowUpRight, Hash, Receipt, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://127.0.0.1:8000/api";

// ── Helpers ─────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d) => new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS_MAP = {
  1: { label: "Chờ xác nhận", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30", icon: Clock },
  2: { label: "Đang chuẩn bị", color: "text-sky-300", bg: "bg-sky-500/15 border-sky-500/30", icon: Coffee },
  3: { label: "Đang giao hàng", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-500/30", icon: Truck },
  4: { label: "Đã hoàn thành", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30", icon: CheckCircle2 },
  5: { label: "Đã hủy", color: "text-rose-300", bg: "bg-rose-500/15 border-rose-500/30", icon: XCircle },
};

// ── StatusBadge ─────────────────────────────────────────
function StatusBadge({ statusId, statusName }) {
  const s = STATUS_MAP[statusId] || { label: statusName || "Không rõ", color: "text-white/50", bg: "bg-white/10 border-white/10", icon: Package };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${s.bg} ${s.color}`}>
      <Icon className="size-3" />
      {s.label}
    </span>
  );
}

// ── PasswordModal ───────────────────────────────────────
function PasswordModal({ show, onClose }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => { setCurrent(""); setNewPw(""); setConfirm(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw !== confirm) { toast.error("Mật khẩu mới không khớp!"); return; }
    if (newPw.length < 6) { toast.error("Mật khẩu mới cần ít nhất 6 ký tự!"); return; }
    try {
      setLoading(true);
      await axios.put(`${API}/profile/password`, {
        current_password: current,
        new_password: newPw,
      });
      toast.success("Đổi mật khẩu thành công!");
      reset();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Đổi mật khẩu thất bại");
    } finally { setLoading(false); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { reset(); onClose(); }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-white/10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-[#00704A]/30 rounded-xl">
            <Lock className="size-5 text-[#00704A]" />
          </div>
          <h3 className="text-lg font-black text-white">Đổi mật khẩu</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current password */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]/50 transition-all pr-11"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]/50 transition-all pr-11"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]/50 transition-all"
              required
            />
            {confirm && newPw !== confirm && (
              <p className="text-rose-400 text-[10px] mt-1 font-bold">Mật khẩu xác nhận không khớp</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black shadow-lg shadow-[#00704A]/30 flex items-center justify-center gap-2 transition-all">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Xác nhận"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── OrderCard ───────────────────────────────────────────
function OrderCard({ order, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const canCancel = order.status_id === 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#00704A]/30 transition-all"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="bg-[#00704A]/20 p-2.5 rounded-xl">
            <Receipt className="size-5 text-[#00704A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Đơn #{order.id}</span>
              <StatusBadge statusId={order.status_id} statusName={order.status_name} />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/40 flex items-center gap-1">
                <Calendar className="size-3" />
                {fmtDateTime(order.order_date)}
              </span>
              <span className="text-[10px] text-white/40">
                {order.items.length} sản phẩm
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-black text-[#00704A]">{fmt(order.total_price)} đ</span>
          {expanded ? <ChevronUp className="size-4 text-white/30" /> : <ChevronDown className="size-4 text-white/30" />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03]">
                  {item.product_image ? (
                    <img src={item.product_image} alt="" className="size-10 rounded-lg object-cover border border-white/5" />
                  ) : (
                    <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Coffee className="size-4 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.product_name}</p>
                    <p className="text-[10px] text-white/40">x{item.quantity} · {fmt(item.price_at_time)} đ/sp</p>
                  </div>
                  <span className="text-xs font-black text-white/70">{fmt(item.price_at_time * item.quantity)} đ</span>
                </div>
              ))}

              {/* Order footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Tổng thanh toán</div>
                <div className="text-lg font-black text-white">{fmt(order.total_price)} <span className="text-xs text-white/40">đ</span></div>
              </div>

              {canCancel && (
                <button
                  onClick={() => onCancel(order.id)}
                  className="w-full mt-2 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-black rounded-xl border border-rose-500/20 transition-all uppercase tracking-wider"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Profile ────────────────────────────────────────
export default function Profile({ currentUser, onUserUpdate }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [showPwModal, setShowPwModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${API}/profile/me`),
          axios.get(`${API}/profile/orders`),
        ]);
        setProfile(profileRes.data);
        setOrders(ordersRes.data || []);
      } catch (err) {
        console.error("Lỗi tải profile:", err);
        toast.error("Không thể tải thông tin cá nhân");
      } finally { setLoading(false); }
    };
    fetchAll();
  }, [currentUser]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Kiểm tra kích thước (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 2MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API}/profile/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const newAvatarUrl = res.data.url;
      
      // Cập nhật profile state
      setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      
      // Cập nhật localStorage và App state qua callback
      const updatedUser = { ...currentUser, avatar_url: newAvatarUrl };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
      
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Không thể upload ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status_id: 5 });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status_id: 5, status_name: "Đã hủy" } : o));
      toast.success("Đã hủy đơn hàng thành công");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Không thể hủy đơn hàng");
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <User className="size-12 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm font-medium">Vui lòng đăng nhập để xem thông tin cá nhân</p>
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

  const completedOrders = orders.filter((o) => o.status_id === 4).length;
  const cancelledOrders = orders.filter((o) => o.status_id === 5).length;
  const pendingOrders = orders.filter((o) => [1, 2, 3].includes(o.status_id)).length;
  const memberSince = profile?.created_at ? fmtDate(profile.created_at) : "—";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-white/40 text-sm font-medium mt-1">Quản lý thông tin tài khoản và lịch sử đơn hàng</p>
      </motion.div>

      {/* ── Profile Hero Card ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1E3932] to-[#0d1f1b] rounded-3xl border border-white/10 p-6 relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 size-48 bg-[#00704A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 size-36 bg-[#00704A]/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Upload */}
          <div className="relative group">
            <div className="size-20 rounded-2xl overflow-hidden border-2 border-[#00704A]/40 shadow-xl shadow-[#00704A]/20 bg-[#1E3932] relative">
              {uploadingAvatar ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                  <Loader2 className="size-6 text-white animate-spin" />
                </div>
              ) : null}
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=00704A&color=ffffff&bold=true&size=80&font-size=0.4`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="size-5 text-white mb-1" />
                <span className="text-[8px] font-bold text-white uppercase">Thay đổi</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 size-5 rounded-full border-2 border-[#1E3932] flex items-center justify-center z-20">
              <CheckCircle2 className="size-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white tracking-tight">{currentUser.username}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00704A]/20 text-[#00704A] text-[10px] font-black uppercase tracking-wider border border-[#00704A]/30">
                <Shield className="size-3" />
                {currentUser.role_id === 1 ? "Khách hàng" : currentUser.role_id === 2 ? "Nhân viên" : "Quản trị viên"}
              </span>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Calendar className="size-3" />
                Thành viên từ {memberSince}
              </span>
            </div>
          </div>

          {/* Change password button */}
          <button
            onClick={() => setShowPwModal(true)}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00704A]/30 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <Lock className="size-3.5" />
            Đổi mật khẩu
          </button>
        </div>
      </motion.div>

      {/* ── Stats Grid ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tổng đơn", value: profile?.total_orders || 0, icon: ShoppingBag, color: "from-[#00704A]/30 to-[#00704A]/10", iconColor: "text-[#00704A]" },
          { label: "Hoàn thành", value: completedOrders, icon: CheckCircle2, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
          { label: "Điểm thưởng", value: fmt(profile?.total_points || 0), icon: Star, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
          { label: "Tổng chi tiêu", value: `${fmt(profile?.total_spent || 0)} đ`, icon: ArrowUpRight, color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-400", small: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl border border-white/10 p-4`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`size-4 ${stat.iconColor}`} />
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</span>
            </div>
            <h3 className={`${stat.small ? "text-lg" : "text-2xl"} font-black text-white`}>{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────── */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "orders"
              ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <ShoppingBag className="size-3.5" />
          Đơn hàng ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "pending"
              ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Clock className="size-3.5" />
          Đang xử lý ({pendingOrders})
        </button>
      </div>

      {/* ── Orders List ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {(() => {
          const filtered = activeTab === "pending"
            ? orders.filter((o) => [1, 2, 3].includes(o.status_id))
            : orders;

          if (filtered.length === 0) {
            return (
              <div className="bg-white/5 rounded-3xl border border-white/10 p-12 text-center">
                <Package className="size-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm font-medium">
                  {activeTab === "pending" ? "Không có đơn hàng đang xử lý" : "Chưa có đơn hàng nào"}
                </p>
              </div>
            );
          }

          return filtered.map((order) => (
            <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
          ));
        })()}
      </motion.div>

      {/* ── Password Modal ────────────────────── */}
      <AnimatePresence>
        <PasswordModal show={showPwModal} onClose={() => setShowPwModal(false)} />
      </AnimatePresence>
    </div>
  );
}
