// src/pages/Checkout.jsx
import React, { useState } from "react";
import { CheckCircle2, ChevronLeft, Loader2, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Checkout({ cart, cartTotal, onCompleteOrder, currentUser }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrder = async () => {
    // FIX: Kiểm tra nghiêm ngặt currentUser trước khi gọi API
    if (!currentUser || !currentUser.id) {
      alert("Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Chuẩn bị dữ liệu gửi lên Backend - Đảm bảo có user_id
      const orderPayload = {
        user_id: currentUser.id, 
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty
        }))
      };

      // 2. Gọi API tạo đơn hàng thật
      await axios.post("http://127.0.0.1:8000/api/orders/", orderPayload);
      
      // 3. Hoàn tất trên Frontend
      onCompleteOrder(); 
      alert("Đặt hàng thành công! Đơn hàng đang được quán xử lý.");
      navigate("/cart"); // Chuyển về trang theo dõi đơn hàng
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      alert(error.response?.data?.detail || "Không thể tạo đơn hàng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400 font-bold mb-4">Giỏ hàng trống, không thể thanh toán.</p>
        <button onClick={() => navigate("/menu")} className="text-amber-600 font-black hover:underline">Quay lại Thực đơn</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        disabled={isSubmitting}
        className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] mb-6 hover:text-zinc-900 transition-colors uppercase tracking-widest disabled:opacity-50"
      >
        <ChevronLeft className="size-4" /> QUAY LẠI GIỎ HÀNG
      </button>

      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-10">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-amber-600 p-2 rounded-xl text-white"><CreditCard className="size-5" /></div>
           <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Thanh toán</h2>
        </div>
        
        <div className="space-y-4 mb-10 bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-400 uppercase tracking-wider">Tạm tính:</span>
            <span className="text-zinc-900">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-400 uppercase tracking-wider">Phí dịch vụ:</span>
            <span className="text-zinc-900">MIỄN PHÍ</span>
          </div>
          <div className="h-px bg-zinc-200" />
          <div className="flex justify-between text-xl font-black pt-2">
            <span className="text-zinc-900">Tổng tiền:</span>
            <span className="text-amber-600">{new Intl.NumberFormat('vi-VN').format(cartTotal)} đ</span>
          </div>
        </div>

        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 mb-10 flex items-start gap-4">
          <CheckCircle2 className="size-5 text-emerald-600 mt-0.5" />
          <div>
            <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-1">Phương thức thanh toán</p>
            <p className="text-xs font-bold text-emerald-900">Thanh toán tại quầy khi nhận món</p>
          </div>
        </div>

        <button 
          onClick={handleOrder}
          disabled={isSubmitting}
          className="w-full bg-zinc-900 text-white py-4.5 rounded-2xl font-black hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-200 flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:bg-zinc-400"
        >
          {isSubmitting ? (
            <> <Loader2 className="size-5 animate-spin" /> ĐANG XỬ LÝ... </>
          ) : (
            "XÁC NHẬN ĐẶT MÓN"
          )}
        </button>
      </div>
    </div>
  );
}