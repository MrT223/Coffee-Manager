// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import {
  ShoppingCart, DollarSign, Package, TrendingUp,
  Clock, CheckCircle2, XCircle, Loader2, AlertCircle,
  Coffee, Users, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  const colorMap = {
    amber:   "bg-amber-500/20 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    sky:     "bg-sky-500/20 text-sky-400 border-sky-500/20",
    violet:  "bg-violet-500/20 text-violet-400 border-violet-500/20",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-6 flex items-start gap-4 hover:border-black/10 dark:hover:border-white/20 transition-all overflow-hidden shadow-sm"
    >
      <div className={`p-3 rounded-2xl border flex-shrink-0 ${colorMap[color] || colorMap.amber}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mb-1 truncate">{label}</p>
        <h3 className="text-2xl font-black  tracking-tight truncate">{value}</h3>
        {sub && <p className="text-[10px] text-black/30 dark:text-white/40 font-semibold mt-1 truncate">{sub}</p>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ statusId }) {
  const map = {
    1: { label: "Chờ xác nhận", cls: "bg-amber-500/20 text-amber-300" },
    2: { label: "Đang chuẩn bị", cls: "bg-sky-500/20 text-sky-300" },
    3: { label: "Đang giao hàng", cls: "bg-violet-500/20 text-violet-300" },
    4: { label: "Đã hoàn thành", cls: "bg-emerald-500/20 text-emerald-300" },
    5: { label: "Đã hủy", cls: "bg-rose-500/20 text-rose-300" },
  };
  const s = map[statusId] || map[1];
  return (
    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [ordRes, prodRes, catRes] = await Promise.all([
          axios.get(`${API}/orders/`),
          axios.get(`${API}/products/`),
          axios.get(`${API}/categories/`),
        ]);
        setOrders(ordRes.data || []);
        setProducts(prodRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Không thể kết nối đến server. Hãy đảm bảo backend đang chạy.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="opacity-30 text-xs font-black uppercase tracking-widest">Đang tải Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="size-10 text-rose-400" />
        <span className="text-rose-400 text-sm font-bold">{error}</span>
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const completedOrders = orders.filter(o => o.status_id === 4).length;
  const pendingOrders = orders.filter(o => o.status_id === 1).length;
  const preparingOrders = orders.filter(o => o.status_id === 2).length;
  const deliveringOrders = orders.filter(o => o.status_id === 3).length;
  const cancelledOrders = orders.filter(o => o.status_id === 5).length;
  const completedRevenue = orders
    .filter(o => o.status_id === 4)
    .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.quantity !== null && p.quantity <= 0).length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const recentOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 8);

  const productSalesMap = {};
  orders.forEach(order => {
    (order.order_details || []).forEach(detail => {
      if (!productSalesMap[detail.product_id]) {
        productSalesMap[detail.product_id] = { qty: 0, revenue: 0 };
      }
      productSalesMap[detail.product_id].qty += detail.quantity;
      productSalesMap[detail.product_id].revenue += parseFloat(detail.price_at_time) * detail.quantity;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([pid, data]) => ({
      product: products.find(p => p.id === parseInt(pid)),
      ...data,
    }))
    .filter(item => item.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const statusBreakdown = [
    { label: "Chờ xác nhận", count: pendingOrders, color: "bg-amber-500" },
    { label: "Đang chuẩn bị", count: preparingOrders, color: "bg-sky-500" },
    { label: "Đang giao hàng", count: deliveringOrders, color: "bg-violet-500" },
    { label: "Hoàn thành", count: completedOrders, color: "bg-emerald-500" },
    { label: "Đã hủy", count: cancelledOrders, color: "bg-rose-500" },
  ];
  const maxStatusCount = Math.max(...statusBreakdown.map(s => s.count), 1);

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));
  // Rút gọn số lớn: 1.234.567 → 1,2 tr | 1.234.567.890 → 1,2 tỷ
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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black  tracking-tight">Dashboard</h1>
        <p className="opacity-40 text-sm font-medium mt-1">Tổng quan tình trạng bán hàng</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Tổng đơn hàng" value={totalOrders} sub={`${pendingOrders} đang chờ xử lý`} color="amber" delay={0} />
        <StatCard icon={DollarSign} label="Tổng doanh thu" value={`${fmtShort(totalRevenue)} đ`} sub={`HT: ${fmtShort(completedRevenue)} đ`} color="emerald" delay={1} />
        <StatCard icon={Coffee} label="Sản phẩm" value={totalProducts} sub={`${outOfStock} hết hàng`} color="sky" delay={2} />
        <StatCard icon={TrendingUp} label="GT TB / đơn" value={`${fmtShort(avgOrderValue)} đ`} sub={`${categories.length} danh mục`} color="violet" delay={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trạng thái đơn hàng */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-6 lg:col-span-1 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="size-4 text-black/40 dark:text-white/60" />
            <h3 className="text-sm font-extrabold ">Trạng thái đơn hàng</h3>
          </div>
          <div className="space-y-4">
            {statusBreakdown.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] font-bold opacity-40">{s.label}</span>
                  <span className="text-[10px] font-black ">{s.count}</span>
                </div>
                <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${s.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 grid grid-cols-2 gap-3">
            <div className="bg-emerald-500/15 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-emerald-300">{completedOrders}</div>
              <div className="text-[9px] font-bold text-emerald-400/70 uppercase">Hoàn thành</div>
            </div>
            <div className="bg-rose-500/15 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-rose-300">{cancelledOrders}</div>
              <div className="text-[9px] font-bold text-rose-400/70 uppercase">Đã hủy</div>
            </div>
          </div>
        </motion.div>

        {/* Đơn hàng gần đây */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-6 lg:col-span-2 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-black/40 dark:text-white/60" />
              <h3 className="text-sm font-extrabold ">Đơn hàng gần đây</h3>
            </div>
            <span className="text-[10px] opacity-30 font-bold">{totalOrders} đơn tổng cộng</span>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="size-10 text-black/5 dark:text-white/10 mx-auto mb-3" />
              <p className="text-black/20 dark:text-white/30 text-xs font-medium italic">Chưa có đơn hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <th className="text-left text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider pb-3 px-2">Mã đơn</th>
                    <th className="text-left text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider pb-3 px-2">Ngày đặt</th>
                    <th className="text-right text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider pb-3 px-2">Tổng tiền</th>
                    <th className="text-left text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider pb-3 px-2">Số món</th>
                    <th className="text-right text-[10px] font-bold text-black/30 dark:text-white/40 uppercase tracking-wider pb-3 px-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2">
                        <span className="text-xs font-bold ">{orderCode(order)}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-[11px] opacity-40 font-medium">
                          {new Date(order.order_date).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-xs font-black text-amber-300 truncate block max-w-[100px] ml-auto" title={fmt(order.total_price) + " đ"}>{fmtShort(order.total_price)} đ</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-[11px] opacity-40 font-medium">
                          {(order.order_details || []).reduce((s, d) => s + d.quantity, 0)} món
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <StatusBadge statusId={order.status_id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sản phẩm bán chạy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-6 shadow-sm"
        >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="size-4 text-black/40 dark:text-white/60" />
          <h3 className="text-sm font-extrabold ">Sản phẩm bán chạy</h3>
        </div>

        {topProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-black/20 dark:text-white/30 text-xs font-medium italic">Chưa có dữ liệu bán hàng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {topProducts.map((item, i) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="relative">
                  <img
                    src={item.product.image_url || "https://via.placeholder.com/80"}
                    className="size-12 rounded-xl object-cover"
                    alt={item.product.name}
                  />
                  <span className="absolute -top-1.5 -left-1.5 bg-amber-500 text-white size-5 rounded-full flex items-center justify-center text-[9px] font-black">
                    {i + 1}
                  </span>
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="text-xs font-bold  truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-amber-600 dark:text-amber-300 font-black">{item.qty} ly đã bán</p>
                  <p className="text-[10px] text-black/30 dark:text-white/40 font-medium">{fmt(item.revenue)} đ</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
