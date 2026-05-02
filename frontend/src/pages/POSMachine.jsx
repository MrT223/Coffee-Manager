// src/pages/POSMachine.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Plus, Minus, Trash2, LogOut, ShoppingCart, BarChart3, ClipboardList, Coffee, Phone, CheckCircle, X, ChevronDown, Receipt, TrendingUp, Flame, Users, Filter } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts";
import { toast } from "react-hot-toast";

const API = "http://127.0.0.1:8000/api";
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(n);

// Custom Premium Dropdown Component
const CustomSelect = ({ value, onChange, options = [], placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = (options || []).find(o => String(o.value) === String(value));

  return (
    <div className="relative min-w-[160px]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white flex items-center justify-between hover:bg-white/10 transition-all outline-none focus:border-[#00704A]/50"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="size-3.5 text-[#00704A]" />}
          <span className={selectedOption ? "text-white" : "text-white/40"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`size-3.5 text-white/20 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E3932] border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden backdrop-blur-md">
            <div 
              className="px-4 py-2 hover:bg-[#00704A]/20 cursor-pointer text-xs text-white/60 hover:text-white transition-colors"
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map((opt, idx) => (
              <div 
                key={idx}
                className={`px-4 py-2 hover:bg-[#00704A]/20 cursor-pointer text-xs transition-colors ${String(value) === String(opt.value) ? 'text-[#00704A] font-bold bg-[#00704A]/10' : 'text-white'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function POSMachine() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  // Redirect if not staff/admin
  useEffect(() => {
    if (!currentUser || ![2, 3].includes(currentUser.role_id)) navigate("/menu");
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState("sale");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [ticket, setTicket] = useState([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerUser, setCustomerUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Report state
  const [reportData, setReportData] = useState({ daily_chart: [], top_products: [], summary: { total_revenue: 0, total_orders: 0, total_products_sold: 0 } });
  const [filterStaff, setFilterStaff] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [staffList, setStaffList] = useState([]);

  // Order history state
  const [posOrders, setPosOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products/`),
          axios.get(`${API}/categories/`)
        ]);
        setProducts(prodRes.data || []);
        setCategories([{ id: 0, category_name: "All" }, ...(catRes.data || [])]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Filtered products
  const filtered = useMemo(() => {
    let list = products.filter(p => !p.is_deleted && p.status_id === 1);
    if (selectedCat !== "All") list = list.filter(p => p.category_id === selectedCat);
    if (searchTerm) list = list.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [products, selectedCat, searchTerm]);

  const addToTicket = (product) => {
    if (product.quantity !== null && product.quantity <= 0) { toast.error("Hết hàng!"); return; }
    setTicket(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateTicketQty = (id, delta) => {
    setTicket(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const removeFromTicket = (id) => setTicket(prev => prev.filter(i => i.id !== id));

  const ticketTotal = ticket.reduce((s, i) => s + i.price * i.qty, 0);

  // Lookup customer by phone/username
  const lookupCustomer = async () => {
    if (!customerPhone.trim()) { setCustomerUser(null); return; }
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API}/users/lookup`, { params: { username: customerPhone.trim() }, headers: { Authorization: `Bearer ${token}` } });
      setCustomerUser(res.data);
      toast.success(`Tìm thấy: ${res.data.username}`);
    } catch {
      setCustomerUser(null);
      toast("Không tìm thấy khách hàng", { icon: "ℹ️" });
    }
  };

  // Submit POS order
  const submitOrder = async () => {
    if (ticket.length === 0) { toast.error("Chưa có món nào!"); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const body = {
        user_id: customerUser?.id || null,
        items: ticket.map(i => ({ product_id: i.id, quantity: i.qty })),
        channel: "POS",
        staff_id: currentUser.id
      };
      await axios.post(`${API}/orders/pos`, body, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Đã tạo đơn hàng POS!");
      setTicket([]);
      setCustomerPhone("");
      setCustomerUser(null);
      // Refresh products
      const prodRes = await axios.get(`${API}/products/`);
      setProducts(prodRes.data || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Lỗi tạo đơn!");
    } finally { setSubmitting(false); }
  };

  // Confirm payment for a POS order
  const confirmPayment = async (orderId) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.put(`${API}/orders/pos/${orderId}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Đã xác nhận thanh toán!");
      fetchPosOrders();
    } catch (e) { toast.error(e.response?.data?.detail || "Lỗi!"); }
  };

  // Fetch report
  const fetchReport = async () => {
    // Validation
    if (filterDateFrom && filterDateTo && new Date(filterDateFrom) > new Date(filterDateTo)) {
      toast.error("Ngày bắt đầu không thể lớn hơn ngày kết thúc");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const params = {};
      if (filterStaff) params.staff_id = filterStaff;
      if (filterChannel) params.channel = filterChannel;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      const res = await axios.get(`${API}/orders/report`, { params, headers: { Authorization: `Bearer ${token}` } });
      setReportData(res.data);
      if (filterDateFrom || filterDateTo || filterStaff || filterChannel) {
        toast.success("Đã cập nhật báo cáo");
      }
    } catch (e) { 
      console.error(e);
      toast.error("Không thể tải báo cáo");
    }
  };

  // Fetch POS orders
  const fetchPosOrders = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API}/orders/pos/orders`, { headers: { Authorization: `Bearer ${token}` } });
      setPosOrders(res.data || []);
    } catch (e) { console.error(e); }
  };

  // Fetch staff list for filter
  const fetchStaffList = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(`${API}/users/staff-list`, { headers: { Authorization: `Bearer ${token}` } });
      setStaffList(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (activeTab === "report") { fetchReport(); fetchStaffList(); }
    if (activeTab === "orders") fetchPosOrders();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    navigate("/menu");
  };

  const statusMap = { 1: "Chờ xác nhận", 2: "Đang chuẩn bị", 3: "Đang giao", 4: "Hoàn thành", 5: "Đã hủy" };
  const statusColor = { 1: "text-yellow-400", 2: "text-blue-400", 3: "text-purple-400", 4: "text-emerald-400", 5: "text-red-400" };

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-[#0d1f1b] text-white flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#1E3932] px-6 py-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#00704A] p-2 rounded-xl"><Coffee className="size-5" /></div>
          <span className="font-extrabold text-lg">Cafe Sýbẩu 67 <span className="text-[#00704A]">POS</span></span>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          {[
            { id: "sale", icon: ShoppingCart, label: "Bán hàng" },
            { id: "report", icon: BarChart3, label: "Báo cáo" },
            { id: "orders", icon: ClipboardList, label: "Đơn hàng" }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "bg-[#00704A] text-white shadow-lg" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
              <t.icon className="size-4" />{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold">{currentUser?.username}</div>
            <div className="text-[9px] text-white/40">Nhân viên POS</div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><LogOut className="size-4 text-white/50" /></button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "sale" && (
          <div className="flex h-full">
            {/* LEFT - Products */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Search + Categories */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                  <input type="text" placeholder="Tìm món..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-[#00704A]/50" />
                </div>
              </div>
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0">
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id === 0 ? "All" : c.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${(c.id === 0 && selectedCat === "All") || c.id === selectedCat ? "bg-[#00704A] text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
                    {c.category_name}
                  </button>
                ))}
              </div>
              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 content-start">
                {loading ? <div className="col-span-full text-center text-white/30 py-20">Đang tải...</div> :
                  filtered.map(p => (
                    <button key={p.id} onClick={() => addToTicket(p)}
                      className="bg-white/5 border border-white/5 rounded-2xl p-3 text-left hover:border-[#00704A]/40 hover:bg-white/[0.08] transition-all group">
                      <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-black/20">
                        <img src={p.image_url || "https://via.placeholder.com/150"} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-[#00704A] font-extrabold text-sm">{fmt(p.price)}đ</div>
                      {p.quantity !== null && <div className="text-[10px] text-white/30 mt-0.5">Kho: {p.quantity}</div>}
                    </button>
                  ))
                }
              </div>
            </div>

            {/* RIGHT - Ticket */}
            <div className="w-[380px] bg-[#1E3932]/60 border-l border-white/5 flex flex-col">
              <div className="p-4 border-b border-white/5">
                <h2 className="text-sm font-extrabold mb-3 flex items-center gap-2"><Receipt className="size-4 text-[#00704A]" /> Hóa đơn tạm tính</h2>
                {/* Customer Phone */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/30" />
                    <input type="text" placeholder="SĐT khách (tích điểm)" value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)} onBlur={lookupCustomer} onKeyDown={e => e.key === "Enter" && lookupCustomer()}
                      className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-[#00704A]/50" />
                  </div>
                </div>
                {customerUser && (
                  <div className="mt-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="size-3" /> KH: {customerUser.username} · Điểm: {customerUser.total_points}
                  </div>
                )}
              </div>
              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {ticket.length === 0 ? (
                  <div className="text-center text-white/20 py-16 text-xs">Chưa có món nào</div>
                ) : ticket.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl">
                    <img src={item.image_url || "https://via.placeholder.com/40"} className="size-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className="text-[#00704A] text-[11px] font-extrabold">{fmt(item.price * item.qty)}đ</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateTicketQty(item.id, -1)} className="size-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"><Minus className="size-3" /></button>
                      <span className="text-xs font-black w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateTicketQty(item.id, 1)} className="size-6 flex items-center justify-center rounded-lg bg-[#00704A]/30 hover:bg-[#00704A]/50 text-[#00704A]"><Plus className="size-3" /></button>
                    </div>
                    <button onClick={() => removeFromTicket(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
              </div>
              {/* Total + Submit */}
              <div className="p-4 border-t border-white/10 bg-[#1E3932]">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Tổng cộng</span>
                  <span className="text-2xl font-black">{fmt(ticketTotal)} <span className="text-sm text-white/50">đ</span></span>
                </div>
                <button onClick={submitOrder} disabled={submitting || ticket.length === 0}
                  className="w-full py-3.5 bg-[#00704A] hover:bg-[#00804f] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00704A]/30 flex items-center justify-center gap-2 transition-all">
                  {submitting ? "Đang xử lý..." : "XÁC NHẬN ĐƠN HÀNG"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "report" && (
          <div className="p-6 overflow-y-auto h-full">
            {/* Filters */}
            <div className="flex gap-3 mb-8 flex-wrap items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mr-2">
                <BarChart3 className="size-4 text-[#00704A]" />
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Bộ lọc</span>
              </div>

              <CustomSelect 
                value={filterStaff} 
                onChange={setFilterStaff}
                icon={Users}
                placeholder="Tất cả nhân viên"
                options={staffList.map(s => ({ value: s.id, label: s.username }))}
              />

              <CustomSelect 
                value={filterChannel} 
                onChange={setFilterChannel}
                icon={ShoppingCart}
                placeholder="Tất cả kênh"
                options={[
                  { value: "POS", label: "Tại quầy (POS)" },
                  { value: "ONLINE", label: "Trực tuyến (Web)" }
                ]}
              />

              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-[#00704A]/50 transition-all">
                <ClipboardList className="size-3.5 text-[#00704A]" />
                <input 
                  type="date" 
                  value={filterDateFrom} 
                  onChange={e => setFilterDateFrom(e.target.value)} 
                  style={{colorScheme:"dark"}}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer" 
                  title="Từ ngày"
                />
              </div>

              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 py-2 gap-2 focus-within:border-[#00704A]/50 transition-all">
                <ClipboardList className="size-3.5 text-[#00704A]" />
                <input 
                  type="date" 
                  value={filterDateTo} 
                  onChange={e => setFilterDateTo(e.target.value)} 
                  style={{colorScheme:"dark"}}
                  className="bg-transparent text-xs text-white outline-none cursor-pointer"
                  title="Đến ngày"
                />
              </div>

              <button 
                onClick={fetchReport} 
                className="px-6 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all shadow-lg shadow-[#00704A]/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Lọc dữ liệu
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Doanh thu", value: `${fmt(reportData.summary.total_revenue)}đ`, color: "from-emerald-500/20 to-emerald-500/5" },
                { label: "Đơn hàng", value: reportData.summary.total_orders, color: "from-blue-500/20 to-blue-500/5" },
                { label: "Sản phẩm bán", value: reportData.summary.total_products_sold, color: "from-amber-500/20 to-amber-500/5" }
              ].map((c, i) => (
                <div key={i} className={`bg-gradient-to-br ${c.color} border border-white/5 rounded-2xl p-5`}>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">{c.label}</div>
                  <div className="text-2xl font-black">{c.value}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6">
              <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><TrendingUp className="size-4 text-[#00704A]" /> Biểu đồ Doanh thu & Đơn hàng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={reportData.daily_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#1E3932", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="order_count" name="Đơn hàng" fill="#00704A" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" dataKey="revenue" name="Doanh thu (đ)" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <h3 className="text-sm font-extrabold mb-4 flex items-center gap-2"><Flame className="size-4 text-orange-400" /> Sản phẩm bán chạy</h3>
              <div className="space-y-2">
                {reportData.top_products.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <span className="text-xs font-black text-[#00704A] w-6 text-center">#{i + 1}</span>
                    <img src={p.image_url || "https://via.placeholder.com/32"} className="size-8 rounded-lg object-cover" />
                    <div className="flex-1"><div className="text-xs font-bold">{p.name}</div></div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold">{p.total_sold} ly</div>
                      <div className="text-[10px] text-white/40">{fmt(p.total_revenue)}đ</div>
                    </div>
                  </div>
                ))}
                {reportData.top_products.length === 0 && <div className="text-center text-white/20 py-8 text-xs">Chưa có dữ liệu</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="p-6 overflow-y-auto h-full">
            <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2"><ClipboardList className="size-5 text-[#00704A]" /> Chi tiết đơn hàng POS</h3>
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 text-white/40 uppercase tracking-wider">
                    <th className="py-3 px-4 text-left font-bold">Mã</th>
                    <th className="py-3 px-4 text-left font-bold">Thời gian</th>
                    <th className="py-3 px-4 text-left font-bold">Khách</th>
                    <th className="py-3 px-4 text-left font-bold">Món</th>
                    <th className="py-3 px-4 text-right font-bold">Tổng tiền</th>
                    <th className="py-3 px-4 text-center font-bold">Trạng thái</th>
                    <th className="py-3 px-4 text-center font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {posOrders.map(o => (
                    <tr key={o.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="py-3 px-4 font-bold">#{o.id}</td>
                      <td className="py-3 px-4 text-white/60">{new Date(o.order_date).toLocaleString("vi-VN")}</td>
                      <td className="py-3 px-4">{o.user_id ? `ID: ${o.user_id}` : "Khách vãng lai"}</td>
                      <td className="py-3 px-4 text-white/60">{o.order_details?.length || 0} món</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#00704A]">{fmt(o.total_price)}đ</td>
                      <td className={`py-3 px-4 text-center font-bold ${statusColor[o.status_id]}`}>{statusMap[o.status_id]}</td>
                      <td className="py-3 px-4 text-center">
                        {o.status_id === 1 && (
                          <button onClick={() => confirmPayment(o.id)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-500/30">
                            Xác nhận TT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {posOrders.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-white/20">Chưa có đơn hàng POS</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
