// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, Loader2, CreditCard, Gift, Ticket, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Checkout({ cart, cartTotal, onCompleteOrder, currentUser }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRewards, setUserRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [fetchingRewards, setFetchingRewards] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      setFetchingRewards(true);
      axios.get(`http://127.0.0.1:8000/api/user-rewards/my-rewards/${currentUser.id}`)
        .then(res => setUserRewards(res.data || []))
        .catch(err => console.error("Lỗi fetch quà:", err))
        .finally(() => setFetchingRewards(false));
    }
  }, [currentUser]);

  const discountAmount = selectedReward && selectedReward.reward?.reward_type_id === 2 
    ? parseFloat(selectedReward.reward.discount_value || 0) 
    : 0;
  
  const finalTotal = Math.max(cartTotal - discountAmount, 0);

  const handleOrder = async () => {
    if (!currentUser || !currentUser.id) {
      toast.error("Lỗi: Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      toast.error("Tài khoản của bạn không có quyền đặt hàng!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const orderPayload = {
        user_id: currentUser.id, 
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.qty
        })),
        user_reward_id: selectedReward ? selectedReward.id : null
      };
      await axios.post("http://127.0.0.1:8000/api/orders/", orderPayload);
      onCompleteOrder(); 
      toast.success("Đặt hàng thành công! Đơn hàng đang được quán xử lý.");
      navigate("/cart");
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      toast.error(error.response?.data?.detail || "Không thể tạo đơn hàng. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 font-bold mb-4">Giỏ hàng trống, không thể thanh toán.</p>
        <button onClick={() => navigate("/menu")} className="text-[#00704A] font-black hover:underline">Quay lại Thực đơn</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        disabled={isSubmitting}
        className="flex items-center gap-2 opacity-40 font-bold text-[10px] mb-6 hover:text-black dark:hover:text-white transition-colors uppercase tracking-widest disabled:opacity-50"
      >
        <ChevronLeft className="size-4" /> QUAY LẠI GIỎ HÀNG
      </button>

      <div className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 p-8 shadow-sm flex flex-col">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-10 text-[#00704A] dark:text-white animate-spin" />
            <span className="opacity-30 text-xs font-black uppercase tracking-widest">Đang khởi tạo thanh toán...</span>
          </div>
        ) : (
        <>
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-black/5 dark:bg-white/10 p-2.5 rounded-xl"><CreditCard className="size-5 text-[#00704A] dark:text-white" /></div>
           <h2 className="text-2xl font-black  tracking-tight">Thanh toán</h2>
        </div>
        
        {/* User Rewards Section */}
        <div className="mb-8">
          <h3 className="text-sm font-black  mb-4 flex items-center gap-2"><Gift className="size-4 text-emerald-500" /> Ưu đãi của bạn</h3>
          
          {fetchingRewards ? (
             <div className="flex items-center gap-2 opacity-40 text-xs font-bold"><Loader2 className="size-4 animate-spin" /> Đang tải ưu đãi...</div>
          ) : userRewards.length > 0 ? (
            <div className="space-y-3">
              {userRewards.map(ur => {
                const isSelected = selectedReward?.id === ur.id;
                const rw = ur.reward;
                if (!rw) return null;
                const isDiscount = rw.reward_type_id === 2;
                
                return (
                  <div 
                    key={ur.id}
                    onClick={() => setSelectedReward(isSelected ? null : ur)}
                    className={`cursor-pointer p-4 border rounded-2xl transition-all flex justify-between items-center ${isSelected ? 'bg-emerald-500/20 border-emerald-500' : 'bg-black/5 dark:bg-white/5 border-transparent hover:border-black/10 dark:hover:border-white/10'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isDiscount ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'}`}>
                          {isDiscount ? <Ticket className="size-5" /> : <Gift className="size-5" />}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{rw.name}</div>
                          {isDiscount && rw.discount_value && (
                            <div className="text-[10px] opacity-40 mt-1 font-bold">Giảm {new Intl.NumberFormat('vi-VN').format(rw.discount_value)} đ</div>
                          )}
                        </div>
                     </div>
                     <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-black/20 dark:border-white/20'}`}>
                        {isSelected && <CheckCircle2 className="size-4" />}
                     </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-xs opacity-40 italic">Bạn chưa có ưu đãi nào khả dụng trong kho quà.</div>
          )}
        </div>

        <div className="space-y-4 mb-10 bg-black/5 dark:bg-[#1E3932] rounded-3xl p-6 border border-black/5 dark:border-white/5">
          <div className="flex justify-between items-center opacity-40 text-[11px] font-bold uppercase tracking-widest mb-1.5">
            <span>Tổng cộng</span>
            <span>{cart.length} món</span>
          </div>
          <div className="text-3xl font-black  tracking-tighter mb-4">
            {new Intl.NumberFormat('vi-VN').format(finalTotal)} đ
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold gap-4">
              <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5"><Ticket className="size-3" /> Ưu đãi áp dụng:</span>
              <span className="text-emerald-600 dark:text-emerald-400">- {new Intl.NumberFormat('vi-VN').format(discountAmount)} đ</span>
            </div>
          )}
          {selectedReward && selectedReward.reward?.reward_type_id === 1 && (
             <div className="flex justify-between text-xs font-bold gap-4">
               <span className="text-purple-600 dark:text-purple-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5"><Gift className="size-3" /> Quà tặng vật phẩm:</span>
               <span className="text-purple-600 dark:text-purple-400 text-right capitalize line-clamp-1">{selectedReward.reward.name}</span>
             </div>
          )}
        </div>

        <div className="p-5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/20 mb-10 flex items-start gap-4">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div>
            <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1">Phương thức thanh toán</p>
            <p className="text-xs font-bold text-emerald-200">Thanh toán tại quầy khi nhận món</p>
          </div>
        </div>

        <button 
          onClick={handleOrder}
          disabled={isSubmitting}
          className="w-full bg-white text-[#00704A] py-4.5 rounded-2xl font-black hover:bg-white/90 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:bg-white/50"
        >
          {isSubmitting ? (
            <> <Loader2 className="size-5 animate-spin" /> ĐANG XỬ LÝ... </>
          ) : (
            "XÁC NHẬN ĐẶT MÓN"
          )}
        </button>
        </>
        )}
      </div>
    </div>
  );
}