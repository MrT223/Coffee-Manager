// src/pages/Menu.jsx
import React from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function Menu({ products, categories, loading, selectedCategory, setSelectedCategory, onAddToCart }) {
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(p => {
        const cat = categories.find(c => c.category_name === selectedCategory);
        return cat ? p.category_id === cat.id : false;
      });

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Thực đơn</h2>
          <p className="text-zinc-400 text-xs font-medium mt-0.5">Khám phá các món mới nhất của CafeBell</p>
        </div>
        <div className="flex bg-zinc-100 p-1.5 rounded-xl gap-1 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setSelectedCategory(cat.category_name)} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.category_name 
                  ? "bg-white text-amber-600 shadow-sm" 
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-amber-500 animate-spin" />
          <span className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Đang tải thực đơn...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence mode='popLayout'>
            {filteredProducts.map(p => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={p.id} 
                className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-50 hover:border-amber-100 hover:bg-amber-50/40 transition-all group"
              >
                 <div className="relative overflow-hidden rounded-xl shadow-sm flex-shrink-0">
                    <img 
                      src={p.image_url || "https://via.placeholder.com/150"} 
                      className="size-20 object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                 </div>
                 <div className="flex-grow">
                    <h3 className="font-bold text-zinc-900 text-base tracking-tight">{p.name}</h3>
                    <div className="text-amber-600 font-extrabold text-lg mt-0.5">
                      {new Intl.NumberFormat('vi-VN').format(p.price)}
                      <span className="text-[10px] ml-1 text-amber-700/40">VND</span>
                    </div>
                 </div>
                 {/* Nút thêm vào giỏ hàng */}
                 <button 
                  onClick={() => onAddToCart(p)}
                  className="bg-zinc-900 text-white p-3 rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-90 flex-shrink-0"
                 >
                   <ShoppingCart className="size-5" />
                 </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}