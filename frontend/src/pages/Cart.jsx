// src/pages/Cart.jsx
import React, { useState, useEffect } from "react";
import { Trash2, CreditCard, Package, Clock, ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Cart({ cart, removeFromCart, cartTotal, updateQty, currentUser }) {
  // activeTab: "current", "tracking", "history"
  const [activeTab, setActiveTab] = useState("current");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const navigate = useNavigate();

  // Tải lịch sử đơn hàng từ Database khi vào tab Tracking hoặc History
  useEffect(() => {
    if ((activeTab === "tracking" || activeTab === "history") && currentUser && currentUser.id) {
      const fetchOrders = async () => {
        try {
          setLoadingOrders(true);
          const res = await axios.get("http://127.0.0.1:8000/api/orders/");
          
          // Lọc đúng ID người dùng
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
    if (!currentUser) {
      alert("Vui lòng đăng nhập để tiến hành thanh toán!");
      return;
    }
    if (cart.length === 0) return;
    navigate("/checkout");
  };

  // Phân loại đơn hàng
  const processingOrders = orders.filter(o => o.status_id === 1); // Trạng thái 1: Đang chờ/xử lý
  const historyOrders = orders.filter(o => o.status_id !== 1); // Khác 1: Hoàn thành, Hủy...

  // Hàm hỗ trợ render giao diện thẻ đơn hàng
  const renderOrderCard = (order) => {
    // Xác định giao diện theo trạng thái
    let StatusIcon = Clock;
    let bgColor = "bg-amber-50 text-amber-600";
    let badgeBg = "bg-amber-100 text-amber-700";
    let statusText = "Chờ xác nhận";

    if (order.status_id === 2 || order.status_id === "hoàn thành") {
      StatusIcon = CheckCircle2;
      bgColor = "bg-emerald-50 text-emerald-600";
      badgeBg = "bg-emerald-100 text-emerald-700";
      statusText = "Hoàn thành";
    } else if (order.status_id === 3 || order.status_id === "hủy") {
      StatusIcon = XCircle;
      bgColor = "bg-rose-50 text-rose-600";
      badgeBg = "bg-rose-100 text-rose-700";
      statusText = "Đã hủy";
    }

    return (
      <div key={order.id} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-5 hover:border-amber-200 transition-all cursor-pointer group">
        <div className={`p-4 rounded-2xl ${bgColor}`}>
          <StatusIcon className="size-6" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-sm text-zinc-900 tracking-tight">Đơn hàng #CB-00{order.id}</h3>
            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${badgeBg}`}>
              {statusText}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] text-zinc-400 font-bold">{new Date(order.order_date).toLocaleString('vi-VN')}</p>
            <p className="text-[10px] text-amber-700 font-black">{new Intl.NumberFormat('vi-VN').format(order.total_price)} đ</p>
          </div>
        </div>
        <ChevronRight className="text-zinc-300 group-hover:text-amber-600 transition-colors" />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* --- MENU TABS --- */}
      <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit mb-8 shadow-inner overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab("current")}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "current" ? "bg-white text-amber-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Giỏ hàng
        </button>
        <button 
          onClick={() => setActiveTab("tracking")}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "tracking" ? "bg-white text-amber-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Đang xử lý
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === "history" ? "bg-white text-amber-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Lịch sử
        </button>
      </div>

      {/* --- TAB 1: GIỎ HÀNG HIỆN TẠI --- */}
      {activeTab === "current" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
            <h2 className="text-xl font-extrabold mb-6 tracking-tight">Chi tiết món đã chọn</h2>
            {cart.length > 0 ? (
              <div className="divide-y divide-zinc-50">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <img src={item.image_url || "https://via.placeholder.com/150"} className="size-16 rounded-2xl object-cover shadow-sm" />
                    <div className="flex-grow">
                      <h3 className="text-sm font-bold text-zinc-900">{item.name}</h3>
                      <p className="text-amber-600 font-black text-xs mt-0.5">{new Intl.NumberFormat('vi-VN').format(item.price)} đ</p>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                      <button onClick={() => updateQty(item.id, -1)} className="text-zinc-400 hover:text-zinc-900 font-bold px-1">-</button>
                      <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="text-zinc-400 hover:text-zinc-900 font-bold px-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="size-12 text-zinc-200 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm font-medium italic">Giỏ hàng của bạn đang trống</p>
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="bg-zinc-900 text-white rounded-3xl p-8 flex items-center justify-between shadow-xl border border-white/5">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mb-1">Tổng cộng thanh toán</p>
                <h3 className="text-3xl font-black tracking-tight">{new Intl.NumberFormat('vi-VN').format(cartTotal)} <span className="text-sm font-medium opacity-60">VND</span></h3>
              </div>
              <button 
                onClick={handleGoToCheckout}
                className="bg-amber-600 hover:bg-amber-700 px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-600/20 uppercase text-xs"
              >
                Tiếp tục thanh toán <ChevronRight className="size-5" />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* --- TAB 2: ĐƠN HÀNG ĐANG XỬ LÝ --- */}
      {activeTab === "tracking" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {!currentUser ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-zinc-200">
               <p className="text-zinc-400 font-bold text-sm uppercase">Vui lòng đăng nhập để xem đơn hàng</p>
            </div>
          ) : loadingOrders ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="size-8 text-amber-500 animate-spin" />
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : processingOrders.length > 0 ? (
            processingOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-20 text-zinc-400 text-sm font-medium italic">Không có đơn hàng nào đang xử lý</div>
          )}
        </motion.div>
      )}

      {/* --- TAB 3: LỊCH SỬ ĐƠN HÀNG (Hoàn thành / Đã hủy) --- */}
      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {!currentUser ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-zinc-200">
               <p className="text-zinc-400 font-bold text-sm uppercase">Vui lòng đăng nhập để xem lịch sử</p>
            </div>
          ) : loadingOrders ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="size-8 text-amber-500 animate-spin" />
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Đang tải dữ liệu...</span>
            </div>
          ) : historyOrders.length > 0 ? (
            historyOrders.map(order => renderOrderCard(order))
          ) : (
            <div className="text-center py-20 text-zinc-400 text-sm font-medium italic">Lịch sử đơn hàng trống</div>
          )}
        </motion.div>
      )}
    </div>
  );
}