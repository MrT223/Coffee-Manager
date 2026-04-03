// src/pages/OrdersManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Loader2, Clock, CheckCircle2, XCircle, ChevronDown,
  Package, Truck, Coffee, RefreshCw, ChevronLeft, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "http://127.0.0.1:8000/api";

const STATUS_MAP = {
  1: { label: "Chờ xác nhận", icon: Clock, cls: "bg-amber-500/20 text-amber-300", dot: "bg-amber-500" },
  2: { label: "Đang chuẩn bị", icon: Coffee, cls: "bg-sky-500/20 text-sky-300", dot: "bg-sky-500" },
  3: { label: "Đang giao hàng", icon: Truck, cls: "bg-violet-500/20 text-violet-300", dot: "bg-violet-500" },
  4: { label: "Đã hoàn thành", icon: CheckCircle2, cls: "bg-emerald-500/20 text-emerald-300", dot: "bg-emerald-500" },
  5: { label: "Đã hủy", icon: XCircle, cls: "bg-rose-500/20 text-rose-300", dot: "bg-rose-500" },
};

const NEXT_STATUS = {
  1: [2, 5],
  2: [3, 5],
  3: [4, 5],
};

function StatusBadge({ statusId }) {
  const s = STATUS_MAP[statusId] || STATUS_MAP[1];
  return (
    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/orders/`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatusId) => {
    try {
      setUpdating(orderId);
      await axios.put(`${API}/orders/${orderId}/status`, { status_id: newStatusId });
      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status_id: newStatusId }));
      }
      toast.success("Cập nhật trạng thái thành công");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Lỗi cập nhật trạng thái");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status_id === parseInt(filter));
  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
  const fmtShort = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(".", ",") + " tỷ";
    if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " tr";
    return fmt(n);
  };

  const orderCode = (order) => {
    const d = new Date(order.order_date);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `CS${yy}${mm}${dd}-${String(order.id).padStart(5, "0")}`;
  };

  // Detail view
  if (selectedOrder) {
    const s = STATUS_MAP[selectedOrder.status_id] || STATUS_MAP[1];
    const StatusIcon = s.icon;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-3xl mx-auto">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-white/40 font-bold text-[10px] mb-6 hover:text-white transition-colors uppercase tracking-widest">
          <ChevronLeft className="size-4" /> QUAY LẠI DANH SÁCH
        </button>
        <div className="bg-[#00704A] rounded-3xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">{orderCode(selectedOrder)}</h2>
              <p className="text-xs text-white/40 font-medium mt-1">{new Date(selectedOrder.order_date).toLocaleString("vi-VN")}</p>
            </div>
            <StatusBadge statusId={selectedOrder.status_id} />
          </div>

          <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Chi tiết món</h3>
            <div className="divide-y divide-white/5">
              {(selectedOrder.order_details || []).map((detail, i) => (
                <div key={i} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white">Sản phẩm #{detail.product_id}</span>
                    <span className="text-white/40 text-xs ml-2">x{detail.quantity}</span>
                  </div>
                  <span className="text-sm font-black text-amber-300 block max-w-[100px] truncate ml-auto flex-shrink-0 text-right" title={fmt(detail.price_at_time * detail.quantity) + " đ"}>{fmtShort(detail.price_at_time * detail.quantity)} đ</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-5 bg-[#1E3932] text-white rounded-2xl mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 flex-shrink-0">Tổng tiền</span>
            <span className="text-xl font-black min-w-0 truncate ml-4" title={fmt(selectedOrder.total_price) + " đ"}>{fmt(selectedOrder.total_price)} đ</span>
          </div>

          {NEXT_STATUS[selectedOrder.status_id] && (
            <div className="flex gap-3">
              {NEXT_STATUS[selectedOrder.status_id].map(nextId => {
                const next = STATUS_MAP[nextId];
                const isCancel = nextId === 5;
                return (
                  <button
                    key={nextId}
                    onClick={() => updateStatus(selectedOrder.id, nextId)}
                    disabled={updating === selectedOrder.id}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 ${isCancel
                        ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20"
                        : "bg-white text-[#00704A] hover:bg-white/90 shadow-lg"
                      }`}
                  >
                    {updating === selectedOrder.id ? <Loader2 className="size-4 animate-spin" /> : <next.icon className="size-4" />}
                    {next.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Xử lý và cập nhật trạng thái đơn hàng</p>
        </div>
        <button onClick={fetchOrders} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw className={`size-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
        </button>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 overflow-x-auto max-w-full border border-white/5">
        <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${filter === "all" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          Tất cả ({orders.length})
        </button>
        {Object.entries(STATUS_MAP).map(([id, s]) => {
          const count = orders.filter(o => o.status_id === parseInt(id)).length;
          return (
            <button key={id} onClick={() => setFilter(id)} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${filter === id ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Loader2 className="size-8 text-[#00704A] animate-spin" />
          <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Đang tải...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="size-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm font-medium italic">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-[#00704A] rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Mã đơn</th>
                <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Ngày đặt</th>
                <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Số món</th>
                <th className="text-right text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Tổng tiền</th>
                <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Trạng thái</th>
                <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(order => {
                const nextStatuses = NEXT_STATUS[order.status_id];
                return (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-white">{orderCode(order)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] text-white/50 font-medium">
                        {new Date(order.order_date).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-white/50 font-medium">
                        {(order.order_details || []).reduce((s, d) => s + d.quantity, 0)} món
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-black text-amber-300 block max-w-[100px] truncate ml-auto" title={fmt(order.total_price) + " đ"}>{fmtShort(order.total_price)} đ</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <StatusBadge statusId={order.status_id} />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors" title="Xem chi tiết">
                          <Eye className="size-3.5 text-white/50" />
                        </button>
                        {nextStatuses && nextStatuses.filter(id => id !== 5).map(nextId => (
                          <button
                            key={nextId}
                            onClick={() => updateStatus(order.id, nextId)}
                            disabled={updating === order.id}
                            className="px-3 py-1.5 bg-white text-[#00704A] rounded-lg text-[9px] font-black hover:bg-white/90 transition-all"
                          >
                            {updating === order.id ? "..." : STATUS_MAP[nextId]?.label}
                          </button>
                        ))}
                        {nextStatuses && (
                          <button
                            onClick={() => updateStatus(order.id, 5)}
                            disabled={updating === order.id}
                            className="px-3 py-1.5 bg-rose-500/15 text-rose-300 rounded-lg text-[9px] font-black hover:bg-rose-500/25 border border-rose-500/20 transition-all"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
