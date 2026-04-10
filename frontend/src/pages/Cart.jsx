// src/pages/Cart.jsx
import React, { useState, useEffect } from "react";
import { Trash2, CreditCard, Package, Clock, ChevronRight, Loader2, CheckCircle2, XCircle, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Cart({ cart, removeFromCart, cartTotal, updateQty, currentUser, onRequireAuth }) {
  const [activeTab, setActiveTab] = useState("current");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if ((activeTab === "tracking" || activeTab === "history") && currentUser && currentUser.id) {
      const fetchOrders = async () => {
        try {
          setLoadingOrders(true);
          const res = await axios.get("http://127.0.0.1:8000/api/orders/");
          const userOrders = res.data.filter(order =>
            order.user_id !== null && Number(order.user_id) === Number(currentUser.id)
          );
          setOrders(userOrders);
        } catch (error) {
          console.error("Lỗi tải đơn hàng:", error);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, currentUser]);

  const handleGoToCheckout = () => {
    if (!onRequireAuth()) return;
    if (cart.length === 0) return;
    navigate("/checkout");
  };

  const processingOrders = orders.filter(o => [1, 2, 3].includes(o.status_id));
  const historyOrders = orders.filter(o => [4, 5].includes(o.status_id));

  const [selectedOrder, setSelectedOrder] = useState(null);

  const STATUS_MAP = {
    1: { label: "Chờ xác nhận", icon: Clock, bgColor: "bg-amber-500/20 text-amber-400", badgeBg: "bg-amber-500/20 text-amber-300" },
    2: { label: "Đang chuẩn bị", icon: Clock, bgColor: "bg-sky-500/20 text-sky-400", badgeBg: "bg-sky-500/20 text-sky-300" },
    3: { label: "Đang giao hàng", icon: Clock, bgColor: "bg-violet-500/20 text-violet-400", badgeBg: "bg-violet-500/20 text-violet-300" },
    4: { label: "Đã hoàn thành", icon: CheckCircle2, bgColor: "bg-emerald-500/20 text-emerald-400", badgeBg: "bg-emerald-500/20 text-emerald-300" },
    5: { label: "Đã hủy", icon: XCircle, bgColor: "bg-rose-500/20 text-rose-400", badgeBg: "bg-rose-500/20 text-rose-300" },
  };

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

  const [cancelling, setCancelling] = useState(null);
  const handleCancelOrder = async (orderId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Bạn có chắc muốn hủy đơn hàng này?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors">Hủy</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                setCancelling(orderId);
                await axios.put(`http://127.0.0.1:8000/api/orders/${orderId}/status`, { status_id: 5 });
                const res = await axios.get("http://127.0.0.1:8000/api/orders/");
                const userOrders = res.data.filter(order =>
                  order.user_id !== null && Number(order.user_id) === Number(currentUser.id)
                );
                setOrders(userOrders);
                setSelectedOrder(null);
                toast.success("Đã hủy đơn hàng thành công");
              } catch (err) {
                toast.error(err.response?.data?.detail || "Lỗi hủy đơn hàng");
              } finally {
                setCancelling(null);
              }
            }} 
            className="px-3 py-1.5 bg-rose-500 rounded-lg text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    ), { id: 'confirm-toast', duration: Infinity, style: { background: '#1E3932', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const renderOrderCard = (order) => {
    const s = STATUS_MAP[order.status_id] || STATUS_MAP[1];
    const StatusIcon = s.icon;
    return (
      <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-[#00704A] p-5 rounded-3xl border border-white/10 flex items-center gap-5 hover:border-white/20 transition-all cursor-pointer group">
        <div className={`p-4 rounded-2xl ${s.bgColor}`}>
          <StatusIcon className="size-6" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-white tracking-tight">{orderCode(order)}</h3>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${s.badgeBg}`}>
              {s.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] text-white/40 font-bold">{new Date(order.order_date).toLocaleString('vi-VN')}</p>
            <p className="text-[10px] text-amber-300 font-black truncate max-w-[100px]" title={fmt(order.total_price) + " đ"}>{fmtShort(order.total_price)} đ</p>
          </div>
        </div>
        <ChevronRight className="text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    );
  };

  // === Chi tiết đơn hàng ===
  if (selectedOrder) {
    const s = STATUS_MAP[selectedOrder.status_id] || STATUS_MAP[1];
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-white/40 font-bold text-[10px] mb-6 hover:text-white transition-colors uppercase tracking-widest">
          <ChevronRight className="size-4 rotate-180" /> QUAY LẠI
        </button>
        <div className="bg-[#00704A] rounded-3xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white tracking-tight">{orderCode(selectedOrder)}</h2>
            <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${s.badgeBg}`}>{s.label}</span>
          </div>
          <p className="text-xs text-white/40 font-medium mb-6">{new Date(selectedOrder.order_date).toLocaleString("vi-VN")}</p>

          <div className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Chi tiết món</h3>
            <div className="divide-y divide-white/5">
              {(selectedOrder.order_details || []).map((detail, i) => (
                <div key={i} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-white">Sản phẩm #{detail.product_id}</span>
                    <span className="text-white/40 text-xs ml-2">x{detail.quantity}</span>
                  </div>
                  <span className="text-sm font-black text-amber-300 truncate max-w-[100px] ml-auto block text-right" title={fmt(detail.price_at_time * detail.quantity) + " đ"}>{fmtShort(detail.price_at_time * detail.quantity)} đ</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center p-5 bg-[#1E3932] text-white rounded-2xl mb-6 gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40 flex-shrink-0">Tổng tiền</span>
            <span className="text-xl font-black min-w-0 truncate text-right block max-w-[150px]" title={fmt(selectedOrder.total_price) + " đ"}>{fmt(selectedOrder.total_price)} đ</span>
          </div>

          {[1, 2, 3].includes(selectedOrder.status_id) && (
            <button
              onClick={() => handleCancelOrder(selectedOrder.id)}
              disabled={cancelling === selectedOrder.id}
              className="w-full py-3 bg-rose-500/15 text-rose-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-rose-500/25 border border-rose-500/20 transition-all"
            >
              {cancelling === selectedOrder.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Hủy đơn hàng
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* TABS */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit mb-8 border border-white/5 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "current" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}
        >
          Giỏ hàng
        </button>
        <button
          onClick={() => setActiveTab("tracking")}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "tracking" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}
        >
          Đang xử lý
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "history" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}
        >
          Lịch sử
        </button>
      </div>

      {/* TAB 1: GIỎ HÀNG */}
      {activeTab === "current" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-[#00704A] rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-extrabold text-white mb-6 tracking-tight">Chi tiết món đã chọn</h2>
            {cart.length > 0 ? (
              <div className="divide-y divide-white/5">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <img src={item.image_url || "https://via.placeholder.com/150"} className="size-16 rounded-2xl object-cover" />
                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{item.name}</h3>
                      {currentUser?.role_id === 2 ? (
                        <div className="mt-0.5">
                          <span className="text-white/40 line-through text-[10px] font-semibold mr-2">{fmt(item.price)} đ</span>
                          <span className="text-emerald-400 font-black text-xs truncate" title={fmt(item.price * 0.8) + " đ"}>{fmtShort(item.price * 0.8)} đ</span>
                        </div>
                      ) : (
                        <p className="text-amber-300 font-black text-xs mt-0.5 truncate" title={fmt(item.price) + " đ"}>{fmtShort(item.price)} đ</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                      <button onClick={() => updateQty(item.id, -1)} className="text-white/40 hover:text-white font-bold px-1"><Minus className="size-3" /></button>
                      <span className="text-xs font-black w-4 text-center text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="text-white/40 hover:text-white font-bold px-1"><Plus className="size-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="size-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm font-medium italic">Giỏ hàng của bạn đang trống</p>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="bg-[#1E3932] text-white rounded-3xl p-8 flex items-center justify-between border border-white/10">
              <div className="min-w-0 pr-4">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-1 truncate">Tổng cộng thanh toán</p>
                <h3 className="text-3xl font-black tracking-tight truncate block max-w-full" title={new Intl.NumberFormat('vi-VN').format(cartTotal) + " VND"}>{fmtShort(cartTotal)} <span className="text-sm font-medium opacity-40">VND</span></h3>
              </div>
              <button
                onClick={handleGoToCheckout}
                className="bg-[#00704A] hover:bg-[#00804f] px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#00704A]/30 uppercase text-xs"
              >
                Tiếp tục thanh toán <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 2: ĐANG XỬ LÝ */}
      {activeTab === "tracking" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {!currentUser ? (
            <div className="bg-[#00704A] p-12 rounded-3xl text-center border border-dashed border-white/20">
              <p className="text-white/50 font-bold text-sm uppercase">Vui lòng đăng nhập để xem đơn hàng</p>
            </div>
          ) : loadingOrders ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="size-8 text-[#00704A] animate-spin" />
              <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : processingOrders.length > 0 ? (
            processingOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-20 text-white/30 text-sm font-medium italic">Không có đơn hàng nào đang xử lý</div>
          )}
        </motion.div>
      )}

      {/* TAB 3: LỊCH SỬ */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {!currentUser ? (
            <div className="bg-[#00704A] p-12 rounded-3xl text-center border border-dashed border-white/20">
              <p className="text-white/50 font-bold text-sm uppercase">Vui lòng đăng nhập để xem lịch sử</p>
            </div>
          ) : loadingOrders ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="size-8 text-[#00704A] animate-spin" />
              <span className="text-white/30 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : historyOrders.length > 0 ? (
            historyOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-20 text-white/30 text-sm font-medium italic">Lịch sử đơn hàng trống</div>
          )}
        </motion.div>
      )}
    </div>
  );
}