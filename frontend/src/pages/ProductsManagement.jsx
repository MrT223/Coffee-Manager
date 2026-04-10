// src/pages/ProductsManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Loader2, Plus, Pencil, Trash2, X, Coffee,
  Tag, Package, RefreshCw, Save, FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomSelect from "../components/CustomSelect";

const API = "http://127.0.0.1:8000/api";

const EMPTY_PRODUCT = { name: "", price: "", quantity: null, category_id: "", image_url: "" };
const EMPTY_CATEGORY = { category_name: "" };

export default function ProductsManagement() {
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/products/`),
        axios.get(`${API}/categories/`),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error("Lỗi API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

  const openCreateProduct = () => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setShowProductForm(true); };
  const openEditProduct = (p) => { setEditingProduct(p); setProductForm({ name: p.name, price: p.price, quantity: p.quantity, category_id: p.category_id, image_url: p.image_url || "" }); setShowProductForm(true); };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 5MB"); return; }
    
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingImage(true);
      const res = await axios.post(`${API}/products/upload-image`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setProductForm({ ...productForm, image_url: res.data.url });
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi tải ảnh"); } finally { setUploadingImage(false); }
  };

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.category_id) { toast.error("Vui lòng điền đầy đủ: Tên, Giá, Danh mục"); return; }
    setSaving(true);
    try {
      const parsedQty = productForm.quantity === "" || productForm.quantity === null ? null : parseInt(productForm.quantity);
      const payload = { ...productForm, price: parseFloat(productForm.price), quantity: parsedQty, category_id: parseInt(productForm.category_id) };
      if (editingProduct) { await axios.put(`${API}/products/${editingProduct.id}`, payload); } else { await axios.post(`${API}/products/`, payload); }
      setShowProductForm(false);
      toast.success(editingProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
      await fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi lưu sản phẩm"); } finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Xác nhận xóa sản phẩm này?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors">Hủy</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try { await axios.delete(`${API}/products/${id}`); toast.success("Đã xóa sản phẩm"); await fetchData(); } 
              catch (err) { toast.error(err.response?.data?.detail || "Lỗi xóa"); }
            }} 
            className="px-3 py-1.5 bg-rose-500 rounded-lg text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >Xóa</button>
        </div>
      </div>
    ), { id: 'confirm-toast', duration: Infinity, style: { background: '#1E3932', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const openCreateCategory = () => { setEditingCategory(null); setCategoryForm(EMPTY_CATEGORY); setShowCategoryForm(true); };
  const openEditCategory = (c) => { setEditingCategory(c); setCategoryForm({ category_name: c.category_name }); setShowCategoryForm(true); };

  const saveCategory = async () => {
    if (!categoryForm.category_name) { toast.error("Vui lòng nhập tên danh mục"); return; }
    setSaving(true);
    try {
      if (editingCategory) { await axios.put(`${API}/categories/${editingCategory.id}`, categoryForm); } else { await axios.post(`${API}/categories/`, categoryForm); }
      setShowCategoryForm(false);
      toast.success(editingCategory ? "Cập nhật danh mục thành công" : "Thêm danh mục thành công");
      await fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi lưu danh mục"); } finally { setSaving(false); }
  };

  const deleteCategory = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Xác nhận xóa danh mục này?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors">Hủy</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try { await axios.delete(`${API}/categories/${id}`); toast.success("Đã xóa danh mục"); await fetchData(); } 
              catch (err) { toast.error(err.response?.data?.detail || "Lỗi xóa danh mục"); }
            }} 
            className="px-3 py-1.5 bg-rose-500 rounded-lg text-xs font-bold text-white hover:bg-rose-600 transition-colors"
          >Xóa</button>
        </div>
      </div>
    ), { id: 'confirm-toast', duration: Infinity, style: { background: '#1E3932', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.category_name || "—";

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="text-white/30 text-xs font-black uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản lý sản phẩm</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Thêm, sửa, xóa sản phẩm và danh mục</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw className="size-4 text-white/50" />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5">
        <button onClick={() => setActiveTab("products")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "products" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Coffee className="size-3.5" />Sản phẩm ({products.length})
        </button>
        <button onClick={() => setActiveTab("categories")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "categories" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <FolderOpen className="size-3.5" />Danh mục ({categories.length})
        </button>
      </div>

      {/* TAB SẢN PHẨM */}
      {activeTab === "products" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateProduct} className="px-5 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all flex items-center gap-2 shadow-lg shadow-[#00704A]/20">
              <Plus className="size-4" /> Thêm sản phẩm
            </button>
          </div>

          <div className="bg-[#00704A] rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Sản phẩm</th>
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Danh mục</th>
                  <th className="text-right text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Giá</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Tồn kho</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Trạng thái</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img src={p.image_url || "https://via.placeholder.com/40"} className="size-10 rounded-xl object-cover" />
                        <span className="text-sm font-bold text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-white/60 font-medium bg-white/10 px-2.5 py-1 rounded-lg">{getCategoryName(p.category_id)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-black text-amber-300">{fmt(p.price)} đ</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs font-bold ${p.quantity === null ? "text-emerald-400" : p.quantity > 0 ? "text-emerald-300" : "text-rose-300"}`}>{p.quantity === null ? "—" : p.quantity}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${p.quantity === null ? "bg-emerald-500/10 text-emerald-400" : p.quantity > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {p.quantity === null ? "Luôn có sẵn" : p.quantity > 0 ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditProduct(p)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                          <Pencil className="size-3.5 text-white/50" />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors">
                          <Trash2 className="size-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* TAB DANH MỤC */}
      {activeTab === "categories" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <button onClick={openCreateCategory} className="px-5 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all flex items-center gap-2 shadow-lg shadow-[#00704A]/20">
              <Plus className="size-4" /> Thêm danh mục
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => {
              const productCount = products.filter(p => p.category_id === c.id).length;
              return (
                <div key={c.id} className="bg-[#00704A] rounded-2xl border border-white/10 p-5 flex items-center justify-between hover:border-white/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2.5 rounded-xl">
                      <Tag className="size-4 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.category_name}</h3>
                      <p className="text-[10px] text-white/40 font-medium">{productCount} sản phẩm</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEditCategory(c)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <Pencil className="size-3.5 text-white/40" />
                    </button>
                    <button onClick={() => deleteCategory(c.id)} className="p-2 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <Trash2 className="size-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* MODAL FORM SẢN PHẨM */}
      <AnimatePresence>
        {showProductForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProductForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/10 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
                <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="size-5 text-white/40" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Tên sản phẩm</label>
                  <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Cà phê sữa đá..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Giá (VND)</label>
                    <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="25000" />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Quản lý tồn kho</label>
                    <CustomSelect 
                      value={productForm.quantity === null || productForm.quantity === "" ? "unlimited" : "limited"} 
                      onChange={val => setProductForm({...productForm, quantity: val === "unlimited" ? null : 0})} 
                      options={[
                        { value: "unlimited", label: "Luôn có sẵn" },
                        { value: "limited", label: "Có quản lý số lượng" }
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Danh mục</label>
                    <CustomSelect 
                      value={productForm.category_id} 
                      onChange={val => setProductForm({...productForm, category_id: val})} 
                      placeholder="Chọn danh mục"
                      options={categories.map(c => ({ value: c.id.toString(), label: c.category_name }))}
                    />
                  </div>
                  <AnimatePresence>
                    {(productForm.quantity !== null && productForm.quantity !== "") && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Số lượng hiện có</label>
                        <input type="number" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="100" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Hình ảnh</label>
                  <div className="flex gap-2">
                    <input value={productForm.image_url} onChange={e => setProductForm({...productForm, image_url: e.target.value})} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Nhập Link URL hoặc Tải lên..." />
                    <label className="flex-shrink-0 cursor-pointer px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors flex items-center justify-center">
                      {uploadingImage ? <Loader2 className="size-4 animate-spin text-white/40" /> : <span className="text-xs font-bold text-white/80">Tải ảnh lên</span>}
                      <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
                <button onClick={saveProduct} disabled={saving} className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00704A]/20">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {editingProduct ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL FORM DANH MỤC */}
      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/10 z-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</h2>
                <button onClick={() => setShowCategoryForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="size-5 text-white/40" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Tên danh mục</label>
                  <input value={categoryForm.category_name} onChange={e => setCategoryForm({...categoryForm, category_name: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A]" placeholder="Trà sữa, Cà phê..." />
                </div>
                <button onClick={saveCategory} disabled={saving} className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00704A]/20">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {editingCategory ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
