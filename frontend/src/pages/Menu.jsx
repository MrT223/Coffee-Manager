// src/pages/Menu.jsx
import React from "react";
import { ShoppingCart, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function Menu({ currentUser, products, categories, loading, selectedCategory, setSelectedCategory, onAddToCart }) {
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => {
        const cat = categories.find(c => c.category_name === selectedCategory);
        return cat ? p.category_id === cat.id : false;
      });

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Thực đơn</h2>
          <p className="text-white/30 text-sm font-medium mt-1">Khám phá các món đặc biệt của Cafe Sýbẩu 67</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-fit mb-8 border border-white/5">
        {categories.map((cat) => (
          <button 
            key={cat.id} 
            onClick={() => setSelectedCategory(cat.category_name)} 
            className={`px-5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.category_name 
                ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" 
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}
          >
            {cat.category_name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-[#00704A] animate-spin" />
          <span className="text-white/30 font-bold uppercase tracking-widest text-[10px]">Đang tải thực đơn...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                className="bg-[#1E3932] rounded-3xl border border-white/5 overflow-hidden hover:border-[#00704A]/40 transition-all group hover:shadow-xl hover:shadow-[#00704A]/10"
              >
                {/* Image */}
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img 
                    src={p.image_url || "https://via.placeholder.com/300x225"} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={p.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E3932] via-transparent to-transparent" />
                  {p.quantity !== null && p.quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white/80 font-black text-xs uppercase tracking-widest bg-rose-600/80 px-4 py-1.5 rounded-full">Hết hàng</span>
                    </div>
                  )}
                </div>

                <div className="p-5 pt-3">
                  <h3 className="font-bold text-white text-[15px] tracking-tight mb-1 line-clamp-1">{p.name}</h3>
                  <div className="flex items-end justify-between mt-3 gap-2">
                    <div className="min-w-0">
                      {currentUser?.role_id === 2 ? (
                        <div className="flex flex-col">
                          <span className="text-white/40 line-through text-xs font-semibold">{fmt(p.price)} đ</span>
                          <div className="text-emerald-400 font-black text-xl truncate">
                            {fmt(p.price * 0.8)}
                            <span className="text-[10px] ml-1 text-emerald-400/50 font-medium">VND</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#00704A] font-black text-xl truncate">
                          {fmt(p.price)}
                          <span className="text-[10px] ml-1 text-white/20 font-medium">VND</span>
                        </div>
                      )}
                      {p.quantity === null 
                        ? <div className="text-[10px] text-emerald-400/50 font-medium mt-0.5">Luôn sẵn sàng</div>
                        : p.quantity > 0 
                          ? <div className="text-[10px] text-white/20 font-medium mt-0.5">Còn {p.quantity} phần</div>
                          : null
                      }
                    </div>
                    <button 
                      onClick={() => onAddToCart(p)}
                      disabled={p.quantity !== null && p.quantity <= 0}
                      className={`p-3 rounded-2xl transition-all active:scale-90 flex-shrink-0 ${
                        p.quantity === null || p.quantity > 0 
                          ? "bg-[#00704A] text-white hover:bg-[#00804f] shadow-lg shadow-[#00704A]/30 hover:shadow-[#00704A]/50" 
                          : "bg-white/5 text-white/20 cursor-not-allowed"
                      }`}
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Spacer để tránh overlap với minicart */}
      <div className="h-32 w-full flex-shrink-0"></div>
    </motion.section>
  );
}