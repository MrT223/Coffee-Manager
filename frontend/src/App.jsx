// src/App.jsx
import React, { useState, useEffect, Fragment } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, ShoppingCart, CupSoda, Sandwich, Settings, 
  Users, Search, MapPin, LogOut, Gift, ClipboardList, 
  X, Trash2, ChevronRight, CreditCard, Coffee, Minus, Plus
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Toaster, toast } from 'react-hot-toast';

import AuthModal from "./components/AuthModal";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import OrdersManagement from "./pages/OrdersManagement";
import ProductsManagement from "./pages/ProductsManagement";
import Loyalty from "./pages/Loyalty";
import AdminPanel from "./pages/AdminPanel";
import RewardsManagement from "./pages/RewardsManagement";

const SidebarLink = ({ icon: Icon, label, path, active, onClick, visible = true }) => {
  if (!visible) return null;
  return (
    <button onClick={() => onClick(path)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${active ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/30" : "text-[#d4c9a8]/70 hover:bg-white/5 hover:text-[#d4c9a8]"}`}>
      <Icon className={`size-[18px] ${active ? "text-white" : "text-[#d4c9a8]/50"}`} />
      {label}
    </button>
  );
};

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null; 
    } catch (e) {
      return null;
    }
  });

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/products/"),
          axios.get("http://127.0.0.1:8000/api/categories/")
        ]);
        setProducts(prodRes.data || []);
        setCategories([{ id: 0, category_name: "All" }, ...(catRes.data || [])]);
      } catch (error) { console.error("Lỗi API:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      const timer = setTimeout(() => {
        handleClearCartAndReleaseStock();
        toast.error("Giỏ hàng của bạn đã quá hạn 15 phút và được hoàn trả vào kho.");
      }, 15 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [cart]);

  const handleClearCartAndReleaseStock = () => {
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      return cartItem ? { ...p, quantity: p.quantity !== null ? p.quantity + cartItem.qty : null } : p;
    }));
    setCart([]);
  };

  const addToCart = (product) => {
    if (product.quantity !== null && product.quantity <= 0) {
      toast.error("Sản phẩm đã hết hàng trong kho!");
      return;
    }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity !== null ? p.quantity - 1 : null } : p));
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item);
      return [...prev, {...product, qty: 1}];
    });
  };

  const updateQty = (id, delta) => {
    const productInStock = products.find(p => p.id === id);
    if (delta > 0 && (!productInStock || (productInStock.quantity !== null && productInStock.quantity <= 0))) {
      toast.error("Không đủ hàng trong kho!");
      return;
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity !== null ? p.quantity - delta : null } : p));
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeFromCart = (id) => {
    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity !== null ? p.quantity + cartItem.qty : null } : p));
    }
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleLogout = () => {
    handleClearCartAndReleaseStock();
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/menu");
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const requireCustomerAuth = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }
    if (currentUser.role_id !== 1) {
      toast.error("Chỉ tài khoản Khách hàng (Customer) mới có quyền đặt hàng!");
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex bg-[#0d1f1b] antialiased text-white overflow-x-hidden">
      {/* ═══════ SIDEBAR ═══════ */}
      <aside className="w-[260px] bg-gradient-to-b from-[#1E3932] to-[#0d1f1b] p-5 flex flex-col fixed h-full z-30 border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2 pt-2">
          <div className="bg-[#00704A] p-2.5 rounded-2xl shadow-lg shadow-[#00704A]/30 flex-shrink-0">
            <Coffee className="size-6 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-white leading-tight whitespace-nowrap">Cafe Sýbẩu</span>
            <span className="text-lg font-extrabold text-[#00704A] uppercase whitespace-nowrap">67</span>
          </div>
        </div>

        {/* Menu label */}
        <div className="px-4 mb-3">
          <span className="text-[9px] font-bold text-[#d4c9a8]/30 uppercase tracking-[0.3em]">Menu</span>
        </div>
        <nav className="flex-grow space-y-1">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" path="/dashboard" active={location.pathname === "/dashboard"} onClick={navigate} visible={currentUser?.role_id === 3} />
          <SidebarLink icon={ClipboardList} label="Đơn hàng" path="/orders" active={location.pathname === "/orders"} onClick={navigate} visible={currentUser?.role_id === 2} />
          <SidebarLink icon={Coffee} label="Sản phẩm" path="/products" active={location.pathname === "/products"} onClick={navigate} visible={currentUser?.role_id === 2 || currentUser?.role_id === 3} />
          <SidebarLink icon={Sandwich} label="Thực đơn" path="/menu" active={location.pathname === "/menu" || location.pathname === "/"} onClick={navigate} />
          <SidebarLink icon={Gift} label="Loyalty" path="/loyalty" active={location.pathname === "/loyalty"} onClick={navigate} visible={currentUser?.role_id === 1} />
          <SidebarLink icon={Users} label="Tài khoản" path="/admin" active={location.pathname === "/admin"} onClick={navigate} visible={currentUser?.role_id === 3} />
          <SidebarLink icon={Gift} label="Điểm & Quà" path="/admin/rewards" active={location.pathname === "/admin/rewards"} onClick={navigate} visible={currentUser?.role_id === 3} />
        </nav>

        {/* Bottom section */}
        <div className="pt-4 border-t border-white/5 space-y-1">
          <SidebarLink icon={Settings} label="Cài đặt" path="/settings" active={location.pathname === "/settings"} onClick={navigate} />
        </div>

        {/* User info at bottom of sidebar */}
        {currentUser && (
          <div className="mt-4 p-3 bg-white/5 rounded-2xl flex items-center gap-3">
            <div className="size-9 rounded-xl overflow-hidden flex-shrink-0">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=00704A&color=ffffff&bold=true&size=36`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.username}</div>
              <div className="text-[9px] text-[#d4c9a8]/50 font-medium">{currentUser.role_id === 1 ? "Customer" : currentUser.role_id === 2 ? "Staff" : "Admin"}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Đăng xuất">
              <LogOut className="size-3.5 text-[#d4c9a8]/50" />
            </button>
          </div>
        )}
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 flex flex-col ml-[260px] relative">
        {/* Header */}
        <header className="bg-[#1E3932]/80 backdrop-blur-xl p-4 px-8 border-b border-white/5 flex items-center sticky top-0 z-20 justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/30" />
            <input type="text" placeholder="Tìm kiếm món uống..." className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 outline-none focus:bg-white/10 focus:border-[#00704A]/50 transition-all" />
          </div>

          <div className="flex items-center gap-4">
            {(currentUser?.role_id === 1) && (
              <button onClick={() => navigate("/cart")} className="relative p-2.5 bg-white/5 border border-white/10 rounded-2xl text-white/60 hover:bg-[#00704A]/20 hover:border-[#00704A]/30 transition-all">
                <ShoppingCart className="size-5" />
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#00704A] text-white size-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#1E3932]">{cartCount}</span>}
              </button>
            )}

            {!currentUser && (
              <button onClick={() => setIsAuthModalOpen(true)} className="px-6 py-2.5 bg-[#00704A] text-white text-[11px] font-bold rounded-2xl hover:bg-[#00804f] transition-all shadow-lg shadow-[#00704A]/20 uppercase tracking-wider">Đăng nhập</button>
            )}
          </div>
        </header>

        {/* Main content area */}
        <main className={`flex-1 p-6 lg:p-8 ${cart.length > 0 && (location.pathname === "/" || location.pathname.includes("/menu")) ? 'pb-40' : 'pb-6'}`}>
          <Routes>
            <Route path="/" element={<Menu products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} />} />
            <Route path="/menu" element={<Menu products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} cartTotal={cartTotal} updateQty={updateQty} currentUser={currentUser} onRequireAuth={requireCustomerAuth} />} />
            <Route path="/checkout" element={<Checkout cart={cart} cartTotal={cartTotal} onCompleteOrder={() => setCart([])} currentUser={currentUser} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/loyalty" element={<Loyalty currentUser={currentUser} />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/rewards" element={<RewardsManagement />} />
          </Routes>
        </main>

        {/* ═══════ FLOATING CART BAR ═══════ */}
        <AnimatePresence>
          {cart.length > 0 && (location.pathname === "/" || location.pathname.includes("/menu")) && (
            <motion.div initial={{ y: 100, x: "-50%" }} animate={{ y: 0, x: "-50%" }} exit={{ y: 100, x: "-50%" }} className="fixed bottom-6 left-1/2 w-full max-w-lg px-4 z-40">
              <div className="bg-[#1E3932] text-white rounded-2xl p-3 shadow-2xl shadow-black/40 flex items-center justify-between border border-[#00704A]/30">
                <div onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 cursor-pointer pl-2">
                  <div className="bg-[#00704A] p-2.5 rounded-xl relative">
                    <ShoppingCart className="size-5" />
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-[#1E3932] size-5 rounded-full flex items-center justify-center text-[9px] font-black">{cartCount}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Tạm tính</div>
                    <div className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</div>
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="bg-[#00704A] hover:bg-[#00804f] px-6 py-3 rounded-xl text-[11px] font-black flex items-center gap-2 transition-all shadow-lg shadow-[#00704A]/30">
                  XEM GIỎ <ChevronRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ QUICK CART MODAL ═══════ */}
        <Transition show={isCartOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsCartOpen(false)}>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-end p-4">
              <Dialog.Panel className="w-full max-w-sm h-[90vh] bg-[#1E3932] rounded-3xl shadow-2xl flex flex-col p-6 overflow-hidden border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-xl font-extrabold text-white">Giỏ hàng nhanh</Dialog.Title>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X className="size-4 text-white/60" /></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00704A]/30 transition-all">
                      <img src={item.image_url || "https://via.placeholder.com/150"} className="size-14 rounded-xl object-cover" />
                      <div className="flex-grow">
                        <div className="text-sm font-bold text-white">{item.name}</div>
                        <div className="text-[#00704A] font-black text-xs">{new Intl.NumberFormat('vi-VN').format(item.price)} đ</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button onClick={() => updateQty(item.id, -1)} className="size-6 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-xs font-bold transition-colors"><Minus className="size-3" /></button>
                          <span className="text-xs font-black w-5 text-center text-white">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="size-6 flex items-center justify-center rounded-lg bg-[#00704A]/30 text-[#00704A] hover:bg-[#00704A]/50 text-xs font-bold transition-colors"><Plus className="size-3" /></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors self-start"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex justify-between items-end mb-5">
                    <span className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Tổng cộng</span>
                    <span className="text-2xl font-black text-white">{new Intl.NumberFormat('vi-VN').format(cartTotal)} <span className="text-sm text-white/50">đ</span></span>
                  </div>
                  <button onClick={() => { if (requireCustomerAuth()) { setIsCartOpen(false); navigate("/checkout"); } }} className="w-full py-3.5 bg-[#00704A] hover:bg-[#00804f] text-white rounded-2xl text-xs font-black shadow-lg shadow-[#00704A]/30 flex items-center justify-center gap-2 transition-all">
                    TIẾN HÀNH THANH TOÁN <CreditCard className="size-4" />
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </Transition>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={(u) => setCurrentUser(u)} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <MainLayout />
    </Router>
  );
}