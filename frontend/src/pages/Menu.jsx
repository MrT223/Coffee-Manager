// src/pages/Menu.jsx
import React, { useMemo } from "react";
import { ShoppingCart, Loader2, Plus, SearchX } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

function normalizeVietnamese(str) {
  if (!str) return "";
  let s = str.toLowerCase().trim();
  // Bỏ dấu tiếng Việt (NFD decomposition + remove combining marks)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Xử lý đ/Đ -> d
  s = s.replace(/đ/g, "d").replace(/Đ/g, "D");
  return s;
}

function getSearchVariants(query) {
  const normalized = normalizeVietnamese(query);
  const variants = [normalized];

  // Map các biến thể phổ biến
  const aliasMap = {
    "cafe": ["ca phe", "caphe"],
    "ca phe": ["cafe", "caphe"],
    "caphe": ["cafe", "ca phe"],
    "ca fe": ["cafe", "ca phe"],
    "tra": ["tea"],
    "tea": ["tra"],
    "tra sua": ["milk tea"],
    "banh": ["cake", "bread"],
    "da xay": ["frappe", "blend"],
    "sua": ["milk"],
    "socola": ["chocolate", "socolate"],
    "chocolate": ["socola"],
  };

  // Kiểm tra nếu query khớp (hoặc chứa) bất kỳ alias nào
  for (const [key, aliases] of Object.entries(aliasMap)) {
    if (normalized.includes(key)) {
      for (const alias of aliases) {
        const variant = normalized.replace(key, alias);
        if (!variants.includes(variant)) variants.push(variant);
      }
    }
  }

  return variants;
}

export default function Menu({ currentUser, products, categories, loading, selectedCategory, setSelectedCategory, onAddToCart, searchQuery = "", setSearchQuery }) {

  // Lọc sản phẩm theo category VÀ search query
  const filteredProducts = useMemo(() => {
    let result = products;

    // Lọc theo category (nếu không phải "All")
    if (selectedCategory !== "All") {
      const cat = categories.find(c => c.category_name === selectedCategory);
      result = result.filter(p => cat ? p.category_id === cat.id : false);
    }

    // Lọc theo search query
    if (searchQuery.trim()) {
      const searchVariants = getSearchVariants(searchQuery);

      result = result.filter(p => {
        // Chuẩn hóa tên sản phẩm
        const normalizedName = normalizeVietnamese(p.name);

        // Tìm tên danh mục của sản phẩm
        const productCategory = categories.find(c => c.id === p.category_id);
        const normalizedCategoryName = productCategory
          ? normalizeVietnamese(productCategory.category_name)
          : "";

        // Kiểm tra mỗi biến thể search có match với tên SP hoặc tên danh mục không
        return searchVariants.some(variant =>
          normalizedName.includes(variant) || normalizedCategoryName.includes(variant)
        );
      });
    }

    return result;
  }, [products, categories, selectedCategory, searchQuery]);

  // Đếm số sản phẩm theo category (tính cả search filter)
  const categoryProductCounts = useMemo(() => {
    const counts = {};
    categories.forEach(cat => {
      if (cat.category_name === "All") {
        counts[cat.id] = products.length;
      } else {
        counts[cat.id] = products.filter(p => p.category_id === cat.id).length;
      }
    });
    return counts;
  }, [products, categories]);

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

  // Khi đang search, hiển thị badge danh mục nào match
  const isSearching = searchQuery.trim().length > 0;

  // Reset category về "All" khi bắt đầu search
  const handleSearch = (query) => {
    if (setSearchQuery) setSearchQuery(query);
    if (query.trim() && selectedCategory !== "All") {
      setSelectedCategory("All");
    }
  };

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
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#00704A]/10 border border-[#00704A]/20 rounded-2xl"
          >
            <span className="text-[11px] text-white/50 font-medium">Tìm kiếm:</span>
            <span className="text-[11px] text-[#00704A] font-bold">"{searchQuery}"</span>
            <span className="text-[11px] text-white/30 font-medium">• {filteredProducts.length} kết quả</span>
          </motion.div>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-fit mb-8 border border-white/5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.category_name);
              // Xóa search khi chọn category cụ thể
              if (cat.category_name !== "All" && isSearching && setSearchQuery) {
                setSearchQuery("");
              }
            }}
            className={`px-5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat.category_name
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
      ) : filteredProducts.length === 0 ? (
        /* Empty state khi không tìm thấy */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 flex flex-col items-center gap-4"
        >
          <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
            <SearchX className="size-10 text-white/20" />
          </div>
          <div className="text-center">
            <h3 className="text-white/60 font-bold text-sm mb-1">Không tìm thấy kết quả</h3>
            <p className="text-white/25 text-xs max-w-sm">
              {isSearching
                ? `Không có sản phẩm nào phù hợp với "${searchQuery}". Thử từ khóa khác nhé!`
                : "Danh mục này chưa có sản phẩm nào."
              }
            </p>
          </div>
          {isSearching && (
            <button
              onClick={() => { if (setSearchQuery) setSearchQuery(""); setSelectedCategory("All"); }}
              className="mt-2 px-5 py-2.5 bg-[#00704A]/20 text-[#00704A] text-[11px] font-bold rounded-xl hover:bg-[#00704A]/30 transition-all"
            >
              Xóa bộ lọc
            </button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategory}-${searchQuery}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredProducts.map(p => {
              // Tìm tên category cho badge
              const productCategory = categories.find(c => c.id === p.category_id);

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
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
                    {/* Category badge khi đang search */}
                    {isSearching && productCategory && (
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white/80 text-[10px] font-bold rounded-full border border-white/10">
                          {productCategory.category_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 pt-3">
                    <h3 className="font-bold text-white text-[15px] tracking-tight mb-1 line-clamp-1">{p.name}</h3>
                    {p.is_combo && p.combo_items && (
                      <p className="text-[10px] text-white/50 mb-2 line-clamp-2 leading-tight">
                        {p.combo_items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                      </p>
                    )}
                    <div className="flex items-end justify-between mt-3 gap-2">
                      <div className="min-w-0">
                        {currentUser?.role_id === 2 && !p.is_combo ? (
                          <div className="flex flex-col">
                            <span className="text-white/40 line-through text-xs font-semibold">{fmt(p.price)} đ</span>
                            <div className="text-emerald-400 font-black text-xl truncate">
                              {fmt(p.price * 0.8)}
                              <span className="text-[10px] ml-1 text-emerald-400/50 font-medium">VND</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {p.is_combo && p.original_price > p.price && (
                              <span className="text-white/40 line-through text-xs font-semibold">{fmt(p.original_price)} đ</span>
                            )}
                            <div className="text-[#00704A] font-black text-xl truncate">
                              {fmt(p.price)}
                              <span className="text-[10px] ml-1 text-white/20 font-medium">VND</span>
                            </div>
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
                        className={`p-3 rounded-2xl transition-all active:scale-90 flex-shrink-0 ${p.quantity === null || p.quantity > 0
                          ? "bg-[#00704A] text-white hover:bg-[#00804f] shadow-lg shadow-[#00704A]/30 hover:shadow-[#00704A]/50"
                          : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                      >
                        <Plus className="size-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Spacer để tránh overlap với minicart */}
      <div className="h-32 w-full flex-shrink-0"></div>
    </motion.section>
  );
}