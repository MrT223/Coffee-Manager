import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, X, Save, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomSelect from "./CustomSelect";

const API = "/api";
const EMPTY_COMBO = { name: "", description: "", image_url: "", discount_type: "FIXED", discount_value: 0, is_active: true, items: [] };

export default function ComboTab({ products }) {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [comboForm, setComboForm] = useState(EMPTY_COMBO);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/combos/`);
      setCombos(res.data || []);
    } catch (err) {
      console.error("Lỗi API combos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

  const openCreate = () => { setEditingCombo(null); setComboForm(EMPTY_COMBO); setShowForm(true); };
  const openEdit = (c) => { 
    setEditingCombo(c); 
    setComboForm({
      name: c.name,
      description: c.description || "",
      image_url: c.image_url || "",
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      is_active: c.is_active,
      items: c.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
    }); 
    setShowForm(true); 
  };

  const addItem = () => {
    if (comboForm.items.length >= 10) { toast.error("Tối đa 10 sản phẩm trong 1 combo"); return; }
    setComboForm({ ...comboForm, items: [...comboForm.items, { product_id: "", quantity: 1 }] });
  };
  const removeItem = (idx) => {
    const newItems = [...comboForm.items];
    newItems.splice(idx, 1);
    setComboForm({ ...comboForm, items: newItems });
  };
  const updateItem = (idx, field, val) => {
    const newItems = [...comboForm.items];
    newItems[idx][field] = val;
    setComboForm({ ...comboForm, items: newItems });
  };

  const saveCombo = async () => {
    if (!comboForm.name) { toast.error("Vui lòng nhập tên combo"); return; }
    if (comboForm.items.length < 2) { toast.error("Combo phải có ít nhất 2 sản phẩm"); return; }
    for (let i of comboForm.items) {
      if (!i.product_id) { toast.error("Vui lòng chọn sản phẩm cho tất cả các dòng"); return; }
      if (i.quantity <= 0) { toast.error("Số lượng phải lớn hơn 0"); return; }
    }
    
    setSaving(true);
    try {
      const payload = { ...comboForm, discount_value: parseFloat(comboForm.discount_value || 0) };
      if (editingCombo) { await axios.put(`${API}/combos/${editingCombo.id}`, payload); } 
      else { await axios.post(`${API}/combos/`, payload); }
      setShowForm(false);
      toast.success(editingCombo ? "Cập nhật combo thành công" : "Thêm combo thành công");
      await fetchData();
    } catch (err) { toast.error(err.response?.data?.detail || "Lỗi lưu combo"); } 
    finally { setSaving(false); }
  };

  const deleteCombo = async (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-white">Xác nhận xóa combo này?</p>
        <div className="flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white">Hủy</button>
          <button onClick={async () => {
              toast.dismiss(t.id);
              try { await axios.delete(`${API}/combos/${id}`); toast.success("Đã xóa combo"); await fetchData(); } 
              catch (err) { toast.error(err.response?.data?.detail || "Lỗi xóa"); }
            }} className="px-3 py-1.5 bg-rose-500 rounded-lg text-xs font-bold text-white hover:bg-rose-600">Xóa</button>
        </div>
      </div>
    ), { id: 'confirm-combo', duration: Infinity, style: { background: '#1E3932', border: '1px solid rgba(255,255,255,0.1)' } });
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="size-8 text-[#00704A] animate-spin" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#00704A] text-white rounded-xl text-xs font-black hover:bg-[#00804f] transition-all flex items-center gap-2 shadow-lg shadow-[#00704A]/20">
          <Plus className="size-4" /> Tạo Combo mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map(c => (
          <div key={c.id} className={`bg-white/5 rounded-2xl border ${c.is_active ? 'border-white/10' : 'border-rose-500/30'} p-5 flex flex-col gap-3 relative overflow-hidden`}>
            {!c.is_active && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg">Tạm ẩn</div>}
            <div className="flex items-start gap-3">
              <img src={c.image_url || "https://via.placeholder.com/80"} className="size-16 rounded-xl object-cover" alt="combo" />
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">{c.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/50 line-through">{fmt(c.original_price)}đ</span>
                  <span className="text-sm font-black text-amber-300">{fmt(c.final_price)}đ</span>
                </div>
              </div>
            </div>
            
            <div className="bg-black/20 p-3 rounded-xl">
              <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Sản phẩm bao gồm:</p>
              <ul className="space-y-1.5">
                {c.items.map((item, idx) => (
                  <li key={idx} className="text-xs text-white/80 flex justify-between">
                    <span>{item.quantity}x {item.product_name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 mt-auto pt-2">
              <button onClick={() => openEdit(c)} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5">
                <Pencil className="size-3.5" /> Sửa
              </button>
              <button onClick={() => deleteCombo(c.id)} className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl text-xs font-bold text-rose-400 transition-colors flex items-center justify-center gap-1.5">
                <Trash2 className="size-3.5" /> Xóa
              </button>
            </div>
          </div>
        ))}
        {combos.length === 0 && <div className="col-span-full py-10 text-center text-white/50 text-sm font-bold">Chưa có combo nào</div>}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1E3932] rounded-3xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 z-10 custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">{editingCombo ? "Sửa Combo" : "Thêm Combo mới"}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="size-5 text-white/40" /></button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Tên Combo</label>
                  <input value={comboForm.name} onChange={e => setComboForm({...comboForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]" placeholder="Ví dụ: Combo 2 ly trà sữa" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Loại giảm giá</label>
                    <CustomSelect value={comboForm.discount_type} onChange={v => setComboForm({...comboForm, discount_type: v})} options={[{value:"FIXED", label:"Giảm số tiền cố định"}, {value:"PERCENT", label:"Giảm theo %"}]} />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Mức giảm</label>
                    <input type="number" value={comboForm.discount_value} onChange={e => setComboForm({...comboForm, discount_value: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]" placeholder="20000" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Link Hình Ảnh Combo</label>
                  <input value={comboForm.image_url} onChange={e => setComboForm({...comboForm, image_url: e.target.value})} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#00704A]" placeholder="https://..." />
                </div>
                
                <div>
                  <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block mb-1.5">Trạng thái</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={comboForm.is_active} onChange={e => setComboForm({...comboForm, is_active: e.target.checked})} className="w-4 h-4 rounded accent-[#00704A]" />
                    <span className="text-sm text-white font-medium">Đang bán (Hiển thị trên Menu)</span>
                  </label>
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Sản phẩm trong Combo</label>
                    <button onClick={addItem} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white flex items-center gap-1"><Plus className="size-3" /> Thêm SP</button>
                  </div>
                  
                  <div className="space-y-3">
                    {comboForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <CustomSelect 
                            value={item.product_id.toString()} 
                            onChange={v => updateItem(idx, 'product_id', parseInt(v))}
                            placeholder="Chọn sản phẩm"
                            options={products.map(p => ({ value: p.id.toString(), label: `${p.name} - ${fmt(p.price)}đ` }))}
                          />
                        </div>
                        <div className="w-24">
                          <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-center text-white outline-none focus:border-[#00704A]" placeholder="SL" />
                        </div>
                        <button onClick={() => removeItem(idx)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl"><Trash2 className="size-4" /></button>
                      </div>
                    ))}
                    {comboForm.items.length === 0 && <p className="text-xs text-white/40 text-center py-2">Chưa thêm sản phẩm nào</p>}
                  </div>
                </div>

                <button onClick={saveCombo} disabled={saving} className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-[#00704A]/20">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {editingCombo ? "Cập nhật Combo" : "Tạo Combo"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
