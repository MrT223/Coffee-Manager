// src/pages/CustomerDisplay.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { Coffee, CreditCard, Receipt, Smartphone, Clock } from "lucide-react";

const API = "http://127.0.0.1:8000/api";
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

export default function CustomerDisplay() {
  const [order, setOrder] = useState(null);
  const [idle, setIdle] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch menu products for idle display
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products/`),
          axios.get(`${API}/categories/`)
        ]);
        setProducts((prodRes.data || []).filter(p => !p.is_deleted && p.status_id === 1));
        setCategories(catRes.data || []);
      } catch { /* ignore */ }
    };
    fetchMenu();
  }, []);

  // Poll for latest POS order every 3 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await axios.get(`${API}/orders/pos/latest`);
        if (res.data && res.data.id) {
          setOrder(res.data);
          setIdle(false);
        } else {
          setOrder(null);
          setIdle(true);
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate a fake bank QR string
  const qrValue = order
    ? `https://img.vietqr.io/image/970422-1234567890-compact.jpg?amount=${order.total_price}&addInfo=DH${order.id}`
    : "";

  // Group products by category
  const grouped = categories.map(cat => ({
    ...cat,
    items: products.filter(p => p.category_id === cat.id)
  })).filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1f1b] via-[#1E3932] to-[#0d1f1b] text-white flex flex-col overflow-hidden relative">
      {/* Decorative bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#00704A]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-[#00704A]/5 rounded-full blur-3xl" />
      </div>

      {idle ? (
        /* ─── IDLE STATE: Show Menu ─── */
        <div className="relative z-10 flex flex-col h-screen">
          {/* Header */}
          <div className="text-center py-6 flex-shrink-0">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="bg-[#00704A] p-3 rounded-2xl shadow-lg shadow-[#00704A]/30">
                <Coffee className="size-8" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Cafe Sýbẩu <span className="text-[#00704A]">67</span>
              </h1>
            </div>
            <p className="text-white/40 text-sm">Chào mừng quý khách · Vui lòng đọc tên món cho nhân viên</p>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {grouped.map(cat => (
              <div key={cat.id} className="mb-6">
                <h2 className="text-sm font-extrabold text-[#00704A] uppercase tracking-widest mb-3 px-1">{cat.category_name}</h2>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {cat.items.map(p => (
                    <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                      <div className="aspect-[4/3] overflow-hidden bg-black/20">
                        <img src={p.image_url || "https://via.placeholder.com/200"} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-bold truncate">{p.name}</div>
                        <div className="text-[#00704A] font-extrabold text-sm mt-0.5">{fmt(p.price)}đ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-center text-white/20 py-20 text-sm">Đang tải thực đơn...</div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center py-3 border-t border-white/5 flex-shrink-0 bg-[#0d1f1b]/80 backdrop-blur-sm">
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="size-1.5 rounded-full bg-[#00704A]" style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }} />
              ))}
            </div>
            <p className="text-white/20 text-[10px] mt-1">Đơn hàng và mã QR thanh toán sẽ hiển thị tại đây</p>
          </div>
        </div>
      ) : (
        /* ─── PAYMENT STATE: Order + QR ─── */
        <div className="relative z-10 flex items-center justify-center min-h-screen px-8">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-[#00704A]/20 border border-[#00704A]/30 px-4 py-2 rounded-full">
                <CreditCard className="size-4 text-[#00704A]" />
                <span className="text-sm font-bold text-[#00704A]">Thanh toán đơn hàng #{order.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Left - Order Details */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2"><Receipt className="size-5 text-[#00704A]" /> Chi tiết đơn hàng</h2>
                <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                  {(order.order_details || []).map((d, i) => {
                    const prod = products.find(p => p.id === d.product_id);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <img src={prod?.image_url || "https://via.placeholder.com/40"} alt={prod?.name} className="size-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{prod?.name || `SP #${d.product_id}`}</div>
                          <div className="text-white/40 text-xs">x{d.quantity}</div>
                        </div>
                        <span className="text-sm font-extrabold text-[#00704A] flex-shrink-0">
                          {fmt(d.price_at_time * d.quantity)}đ
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Tổng cộng</span>
                    <span className="text-4xl font-black">
                      {fmt(order.total_price)} <span className="text-lg text-white/50">đ</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right - QR Code */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm flex flex-col items-center justify-center">
                <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2"><Smartphone className="size-5 text-[#00704A]" /> Quét mã để thanh toán</h2>
                <div className="bg-white p-4 rounded-2xl mb-4">
                  <QRCodeSVG value={qrValue} size={220} level="H" />
                </div>
                <p className="text-white/40 text-xs text-center max-w-[250px]">
                  Quý khách vui lòng quét mã QR bằng ứng dụng ngân hàng để hoàn tất thanh toán
                </p>
                <div className="mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="text-amber-400 text-xs font-bold flex items-center gap-1.5"><Clock className="size-3.5" /> Chờ xác nhận từ nhân viên...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
