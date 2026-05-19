// src/App.jsx
import React, { useState, useEffect, Fragment } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  LayoutDashboard, ShoppingCart, CupSoda, Sandwich, Settings, 
  Users, Search, MapPin, LogOut, Gift, ClipboardList, 
  X, Trash2, ChevronRight, CreditCard, Coffee, Minus, Plus, Monitor, UserCircle
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import { Toaster, toast } from 'react-hot-toast';

import AuthModal from "./components/AuthModal";
import BirthdayModal from "./components/BirthdayModal";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import OrdersManagement from "./pages/OrdersManagement";
import ProductsManagement from "./pages/ProductsManagement";
import Loyalty from "./pages/Loyalty";
import AdminPanel from "./pages/AdminPanel";
import RewardsManagement from "./pages/RewardsManagement";
import Profile from "./pages/Profile";
import POSMachine from "./pages/POSMachine";
import CustomerDisplay from "./pages/CustomerDisplay";
import PaymentReturn from "./pages/PaymentReturn";

// Cấu hình Axios Interceptor để tự động gắn Token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 Unauthorized toàn cục
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      
      // Chuyển hướng người dùng về trang chủ
      if (window.location.pathname !== "/menu" && window.location.pathname !== "/") {
        window.location.href = "/menu";
      } else {
        // Nếu đã ở menu, tải lại trang để clear React state
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

const SidebarLink = ({ icon: Icon, label, path, active, onClick, visible = true }) => {
  if (!visible) return null;
  return (
    <button onClick={() => onClick(path)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold transition-all duration-200 ${active ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/30" : "text-[#d4c9a8]/70 hover:bg-white/5 hover:text-[#d4c9a8]"}`}>
      <Icon className={`size-[18px] ${active ? "text-white" : "text-[#d4c9a8]/50"}`} />
      {label}
    </button>
  );
};

// Route guard: chỉ cho phép truy cập nếu user có role phù hợp
const ProtectedRoute = ({ currentUser, allowedRoles = [1, 2, 3], children }) => {
  if (!currentUser || !allowedRoles.includes(currentUser.role_id)) {
    return <Navigate to="/menu" replace />;
  }
  return children;
};

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null; 
    } catch (e) {
      return null;
    }
  });

  const [cart, setCart] = useState([]);
  const cartRef = React.useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchProfileAndReward = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        // Fetch full profile (including birthday and notification flags)
        const profileRes = await axios.get("/api/profile/me", cfg);
        const profile = profileRes.data;
        
        // Update currentUser state with new data
        setCurrentUser(prev => ({ 
          ...prev, 
          birthday: profile.birthday,
          birthday_locked: profile.birthday_locked,
          total_points: profile.total_points,
          tier: profile.tier
        }));

        // Trigger birthday modal if flag is set
        if (profile.should_show_birthday_modal) {
          setTimeout(() => setShowBirthdayModal(true), 1000); // Delay for a better entrance
        }
      } catch (e) {
        console.error("Lỗi đồng bộ profile:", e);
      }
    };
    fetchProfileAndReward();
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, comboRes] = await Promise.all([
          axios.get("/api/products/"),
          axios.get("/api/categories/"),
          axios.get("/api/combos/?active_only=true")
        ]);
        const freshProducts = prodRes.data || [];
        const combos = comboRes.data || [];
        
        // Map combos to look like products
        const combosMapped = combos.map(c => ({
          id: `combo_${c.id}`, // String ID để phân biệt
          combo_id: c.id,
          name: c.name,
          price: c.final_price,
          original_price: c.original_price,
          image_url: c.image_url,
          category_id: "combo_cat",
          is_combo: true,
          combo_items: c.items,
          quantity: null // Không quản lý tồn kho cứng ở level combo
        }));

        setProducts([...combosMapped, ...freshProducts.map(p => {
          const cartItem = cartRef.current.find(item => item.id === p.id);
          return cartItem && p.quantity !== null ? { ...p, quantity: p.quantity - cartItem.qty } : p;
        })]);
        
        setCategories([
          { id: 0, category_name: "All" }, 
          { id: "combo_cat", category_name: "Combo đặc biệt" },
          ...(catRes.data || [])
        ]);
      } catch (error) { console.error("Lỗi API:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, [location.pathname]);

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
    const cartItem = cart.find(item => item.id === id);
    if (!cartItem) return;

    // Chặn giảm khi đã ở mức tối thiểu (qty=1)
    if (delta < 0 && cartItem.qty <= 1) return;

    const productInStock = products.find(p => p.id === id);
    if (delta > 0 && (!productInStock || (productInStock.quantity !== null && productInStock.quantity <= 0))) {
      toast.error("Không đủ hàng trong kho!");
      return;
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity !== null ? p.quantity - delta : null } : p));
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item));
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
    localStorage.removeItem("access_token");
    setCurrentUser(null);
    navigate("/menu");
  };

  // Tính giảm giá theo hạng thành viên
  const tierDiscountPercent = (currentUser?.role_id === 1 && currentUser?.tier?.discount_percent) ? parseFloat(currentUser.tier.discount_percent) : 0;
  
  const cartTotal = cart.reduce((sum, item) => {
    let price = item.price;
    if (currentUser?.role_id === 2 && !item.is_combo) {
      price = price * 0.8; // Nhân viên giảm 20%
    } else if (tierDiscountPercent > 0 && currentUser?.role_id === 1 && !item.is_combo) {
      price = price * (1 - tierDiscountPercent / 100); // Giảm giá hạng thành viên
    }
    return sum + (price * item.qty);
  }, 0);
  const cartOriginalTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const requireCustomerAuth = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return false;
    }
    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      toast.error("Tài khoản của bạn không có quyền đặt hàng!");
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
          <SidebarLink icon={UserCircle} label="Hồ sơ" path="/profile" active={location.pathname === "/profile"} onClick={navigate} visible={!!currentUser} />
          <SidebarLink icon={Users} label="Tài khoản" path="/admin" active={location.pathname === "/admin"} onClick={navigate} visible={currentUser?.role_id === 3} />
          <SidebarLink icon={Gift} label="Điểm & Quà" path="/admin/rewards" active={location.pathname === "/admin/rewards"} onClick={navigate} visible={currentUser?.role_id === 3} />
          <SidebarLink icon={Monitor} label="Máy POS" path="/pos" active={false} onClick={() => window.open('/pos', '_blank')} visible={currentUser?.role_id === 2 || currentUser?.role_id === 3} />
          <SidebarLink icon={Monitor} label="Màn hình khách" path="/customer-display" active={false} onClick={() => window.open('/customer-display', '_blank')} visible={currentUser?.role_id === 2 || currentUser?.role_id === 3} />
        </nav>


        {/* User info at bottom of sidebar */}
        {currentUser && (
          <div className="mt-4 p-3 bg-white/5 rounded-2xl flex items-center gap-3">
            <div onClick={() => currentUser.role_id === 1 && navigate("/profile")} className={`size-9 rounded-xl overflow-hidden flex-shrink-0 ${currentUser.role_id === 1 ? "cursor-pointer hover:ring-2 ring-[#00704A]/50 transition-all" : ""}`}>
              <img src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=00704A&color=ffffff&bold=true&size=36`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div onClick={() => currentUser.role_id === 1 && navigate("/profile")} className={`flex-grow min-w-0 ${currentUser.role_id === 1 ? "cursor-pointer" : ""}`}>
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
            <input 
              type="text" 
              placeholder="Tìm kiếm món uống, danh mục..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Tự động chuyển về trang Menu khi gõ tìm kiếm từ trang khác
                if (e.target.value.trim() && location.pathname !== "/" && location.pathname !== "/menu") {
                  navigate("/menu");
                }
              }}
              className="w-full pl-11 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 outline-none focus:bg-white/10 focus:border-[#00704A]/50 transition-all" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="size-3.5 text-white/40" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {(currentUser?.role_id === 1 || currentUser?.role_id === 2) && (
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
            <Route path="/" element={<Menu currentUser={currentUser} products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/menu" element={<Menu currentUser={currentUser} products={products} categories={categories} loading={loading} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} onAddToCart={addToCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/cart" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[1, 2]}><Cart cart={cart} removeFromCart={removeFromCart} cartTotal={cartTotal} updateQty={updateQty} currentUser={currentUser} onRequireAuth={requireCustomerAuth} /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[1, 2]}><Checkout cart={cart} cartTotal={cartTotal} cartOriginalTotal={cartOriginalTotal} onCompleteOrder={() => setCart([])} currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[3]}><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[2]}><OrdersManagement /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[2, 3]}><ProductsManagement currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/loyalty" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[1]}><Loyalty currentUser={currentUser} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute currentUser={currentUser}><Profile currentUser={currentUser} onUserUpdate={setCurrentUser} /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[3]}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/rewards" element={<ProtectedRoute currentUser={currentUser} allowedRoles={[3]}><RewardsManagement /></ProtectedRoute>} />
            <Route path="/payment-return" element={<PaymentReturn />} />
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
                    {tierDiscountPercent > 0 && currentUser?.role_id === 1 ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 line-through">{new Intl.NumberFormat('vi-VN').format(cartOriginalTotal)}</span>
                        <span className="text-sm font-black text-emerald-400">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</span>
                      </div>
                    ) : (
                      <div className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</div>
                    )}
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
                        {(() => {
                          const isStaff = currentUser?.role_id === 2;
                          const hasLoyaltyDiscount = tierDiscountPercent > 0 && currentUser?.role_id === 1 && !item.is_combo;
                          const displayPrice = isStaff && !item.is_combo ? item.price * 0.8 : hasLoyaltyDiscount ? item.price * (1 - tierDiscountPercent / 100) : item.price;
                          const showDiscount = (isStaff && !item.is_combo) || hasLoyaltyDiscount;
                          return showDiscount ? (
                            <div>
                              <span className="text-white/30 line-through text-[10px] mr-1">{new Intl.NumberFormat('vi-VN').format(item.price)}</span>
                              <span className="text-emerald-400 font-black text-xs">{new Intl.NumberFormat('vi-VN').format(displayPrice)} đ</span>
                            </div>
                          ) : (
                            <div className="text-[#00704A] font-black text-xs">{new Intl.NumberFormat('vi-VN').format(item.price)} đ</div>
                          );
                        })()}
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
                    <div className="text-right">
                      {tierDiscountPercent > 0 && currentUser?.role_id === 1 && (
                        <div className="text-xs text-white/30 line-through">{new Intl.NumberFormat('vi-VN').format(cartOriginalTotal)} đ</div>
                      )}
                      <span className={`text-2xl font-black ${tierDiscountPercent > 0 && currentUser?.role_id === 1 ? 'text-emerald-400' : 'text-white'}`}>{new Intl.NumberFormat('vi-VN').format(cartTotal)} <span className="text-sm text-white/50">đ</span></span>
                    </div>
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
      <BirthdayModal isOpen={showBirthdayModal} onClose={() => setShowBirthdayModal(false)} username={currentUser?.username} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* POS routes – full-screen, no sidebar */}
        <Route path="/pos" element={<POSMachine />} />
        <Route path="/customer-display" element={<CustomerDisplay />} />
        {/* All other routes – with sidebar layout */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </Router>
  );
}