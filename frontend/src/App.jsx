// src/App.jsx
import React, { useState, useEffect, Fragment } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, ShoppingCart, CupSoda, Sandwich, Settings, 
  Users, Search, MapPin, LogOut, Gift, ClipboardList, 
  X, Trash2, ChevronRight, CreditCard 
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';

import AuthModal from "./components/AuthModal";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

const SidebarLink = ({ icon: Icon, label, path, active, onClick, visible = true }) => {
  if (!visible) return null;
  return (
    <button onClick={() => onClick(path)} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${active ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}>
      <Icon className={`size-4.5 ${active ? "text-white" : "text-zinc-400"}`} />
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
  
  // FIX: Loại bỏ kiểm tra ngặt nghèo để tài khoản không tự bị văng
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
        alert("Giỏ hàng của bạn đã quá hạn 15 phút và được hoàn trả vào kho.");
      }, 15 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [cart]);

  const handleClearCartAndReleaseStock = () => {
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      return cartItem ? { ...p, quantity: p.quantity + cartItem.qty } : p;
    }));
    setCart([]);
  };

  const addToCart = (product) => {
    if (product.quantity <= 0) {
      alert("Sản phẩm đã hết hàng trong kho!");
      return;
    }
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity - 1 } : p));
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? {...item, qty: item.qty + 1} : item);
      return [...prev, {...product, qty: 1}];
    });
  };

  const updateQty = (id, delta) => {
    const productInStock = products.find(p => p.id === id);
    if (delta > 0 && (!productInStock || productInStock.quantity <= 0)) {
      alert("Không đủ hàng trong kho!");
      return;
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity - delta } : p));
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeFromCart = (id) => {
    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity + cartItem.qty } : p));
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

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] antialiased text-zinc-900 overflow-x-hidden">
      <aside className="w-64 bg-white p-6 flex flex-col border-r border-zinc-100 fixed h-full z-30">
        <div className="flex items-center gap-2.5 mb-10 px-1">
          <div className="bg-amber-600 p-1.5 rounded-xl shadow-md"><CupSoda className="size-5 text-white" /></div>
          <span className="text-xl font-extrabold tracking-tight">Cafe<span className="text-amber-600">Bell</span></span>
        </div>
        <nav className="flex-grow space-y-1.5">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" path="/dashboard" active={location.pathname === "/dashboard"} onClick={navigate} visible={currentUser?.role_id === 3} />
          <SidebarLink icon={ClipboardList} label="Đơn hàng" path="/orders" active={location.pathname === "/orders"} onClick={navigate} visible={currentUser?.role_id >= 2} />
          <SidebarLink icon={Sandwich} label="Thực đơn" path="/menu" active={location.pathname === "/menu" || location.pathname === "/"} onClick={navigate} />
          <SidebarLink icon={Gift} label="Loyalty" path="/loyalty" active={location.pathname === "/loyalty"} onClick={navigate} visible={currentUser?.role_id === 1 || currentUser?.role_id === 3} />
        </nav>
        <div className="pt-4 border-t border-zinc-100">
          <SidebarLink icon={Settings} label="Cài đặt" path="/settings" active={location.pathname === "/settings"} onClick={navigate} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col ml-64 relative">
        <header className="bg-white/70 backdrop-blur-xl p-4 px-8 border-b border-zinc-100 flex items-center sticky top-0 z-20 justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input type="text" placeholder="Tìm kiếm món uống..." className="w-full pl-10 pr-4 py-2 bg-zinc-100/50 rounded-xl text-xs outline-none focus:bg-white transition-all" />
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => navigate("/cart")} className="relative p-2 bg-zinc-100 rounded-xl text-zinc-500 hover:bg-amber-50 transition-all group">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white size-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white">{cartCount}</span>}
            </button>

            {/* HIỂN THỊ HEADER KHI ĐÃ LOG IN (Bỏ điều kiện .id cứng nhắc) */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-4 border-l border-zinc-100">
                <div className="text-right">
                  <div className="text-xs font-bold text-zinc-900">{currentUser.username}</div>
                  <button onClick={handleLogout} className="text-[9px] text-rose-500 font-bold uppercase hover:text-rose-700">Đăng xuất</button>
                </div>
                <div className="size-9 rounded-xl bg-amber-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                   <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=fef3c7&color=b45309&bold=true`} alt="avatar" />
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2 bg-zinc-900 text-white text-[10px] font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-lg uppercase">Đăng nhập</button>
            )}
          </div>
        </header>

        <main className={`flex-1 p-6 max-w-[1400px] ${cart.length > 0 && location.pathname.includes("/menu") ? 'pb-32' : 'pb-6'}`}>
          <Routes>
            <Route path="/" element={<Menu products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} />} />
            <Route path="/menu" element={<Menu products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} />} />
            <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} cartTotal={cartTotal} updateQty={updateQty} currentUser={currentUser} />} />
            <Route path="/checkout" element={<Checkout cart={cart} cartTotal={cartTotal} onCompleteOrder={() => setCart([])} currentUser={currentUser} />} />
            <Route path="/dashboard" element={<div className="text-center font-bold py-20 text-zinc-400">Trang Dashboard (Sắp ra mắt)</div>} />
          </Routes>
        </main>

        {/* Floating Cart & Quick Modal code giữ nguyên */}
        <AnimatePresence>
          {cart.length > 0 && location.pathname.includes("/menu") && (
            <motion.div initial={{ y: 100, x: "-50%" }} animate={{ y: 0, x: "-50%" }} exit={{ y: 100, x: "-50%" }} className="fixed bottom-6 left-1/2 w-full max-w-lg px-4 z-40">
              <div className="bg-zinc-900 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/10">
                <div onClick={() => setIsCartOpen(true)} className="flex items-center gap-3 cursor-pointer pl-2">
                  <div className="bg-amber-600 p-2 rounded-xl relative">
                    <ShoppingCart className="size-5" />
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-zinc-900 size-4 rounded-full flex items-center justify-center text-[9px] font-black">{cartCount}</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Tạm tính</div>
                    <div className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</div>
                  </div>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="bg-amber-600 hover:bg-amber-700 px-5 py-2.5 rounded-xl text-[11px] font-black flex items-center gap-2 transition-all">
                  THANH TOÁN <ChevronRight className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Transition show={isCartOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsCartOpen(false)}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-end p-4">
              <Dialog.Panel className="w-full max-w-sm h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-xl font-extrabold text-zinc-900">Giỏ hàng nhanh</Dialog.Title>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"><X className="size-4" /></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-100">
                      <img src={item.image_url || "https://via.placeholder.com/150"} className="size-14 rounded-xl object-cover" />
                      <div className="flex-grow">
                        <div className="text-sm font-bold text-zinc-900">{item.name}</div>
                        <div className="text-amber-600 font-black text-xs">{new Intl.NumberFormat('vi-VN').format(item.price)} đ</div>
                        <div className="text-[10px] text-zinc-400 font-bold mt-0.5">Số lượng: {item.qty}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-zinc-100">
                  <div className="flex justify-between items-end mb-5">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Tổng cộng</span>
                    <span className="text-2xl font-black text-zinc-900">{new Intl.NumberFormat('vi-VN').format(cartTotal)} <span className="text-sm">đ</span></span>
                  </div>
                  <button onClick={() => { setIsCartOpen(false); navigate("/checkout"); }} className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all">
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
      <MainLayout />
    </Router>
  );
}