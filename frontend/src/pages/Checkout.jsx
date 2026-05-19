// src/pages/Checkout.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle2, ChevronLeft, Loader2, CreditCard, Gift, Ticket, X, QrCode, Banknote, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";


export default function Checkout({ cart, cartTotal, cartOriginalTotal, onCompleteOrder, currentUser }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRewards, setUserRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [fetchingRewards, setFetchingRewards] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // VNPay states
  const [showQR, setShowQR] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [vnpayOrderId, setVnpayOrderId] = useState(null);
  const [vnpTxnRef, setVnpTxnRef] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const pollingRef = useRef(null);
  const [countdown, setCountdown] = useState(900); // 15 phút = 900 giây
  const countdownRef = useRef(null);

  useEffect(() => {
    if (currentUser?.id) {
      setFetchingRewards(true);
      axios.get(`http://127.0.0.1:8000/api/user-rewards/my-rewards/${currentUser.id}`)
        .then(res => setUserRewards(res.data || []))
        .catch(err => console.error("Lỗi fetch quà:", err))
        .finally(() => setFetchingRewards(false));
    }
  }, [currentUser]);

  // Cleanup polling & countdown on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // cartTotal ĐÃ bao gồm giảm giá hạng/nhân viên từ App.jsx
  // cartOriginalTotal là giá gốc chưa giảm
  const appliedDiscount = cartOriginalTotal - cartTotal; // Phần giảm giá hạng/NV đã tính

  const discountAmount = selectedReward && selectedReward.reward?.reward_type_id === 2 
    ? parseFloat(selectedReward.reward.discount_value || 0) 
    : 0;
  
  // Chỉ trừ thêm voucher, KHÔNG trừ tier discount lần nữa
  const finalTotal = Math.max(cartTotal - discountAmount, 0);

  // Bắt đầu polling trạng thái thanh toán
  const startPolling = useCallback((orderId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    const token = localStorage.getItem("access_token");
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/vnpay/payment-status/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.data.is_paid) {
          // Thanh toán thành công!
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          pollingRef.current = null;
          countdownRef.current = null;
          setPaymentSuccess(true);
          
          // Phát âm thanh thông báo thành công
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
            audio.volume = 0.4;
            audio.play().catch(e => console.log("Lỗi phát âm thanh:", e));
          } catch (soundError) {
            console.error("Không thể khởi tạo âm thanh:", soundError);
          }
          
          // Chờ 2 giây rồi chuyển trang
          setTimeout(() => {
            onCompleteOrder();
            toast.success("Thanh toán VNPay thành công! Đơn hàng đang được quán xử lý.");
            navigate("/cart");
          }, 2500);
        }
        
        // Kiểm tra nếu đơn bị hủy
        if (res.data.status_id === 5) {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          pollingRef.current = null;
          countdownRef.current = null;
          setShowQR(false);
          toast.error("Thanh toán thất bại hoặc bạn đã hủy giao dịch. Vui lòng thử lại.");
        }
      } catch (err) {
        console.error("Lỗi polling:", err);
      }
    }, 3000);
  }, [navigate, onCompleteOrder]);

  // Bắt đầu đếm ngược
  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(900);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          clearInterval(pollingRef.current);
          countdownRef.current = null;
          pollingRef.current = null;
          setShowQR(false);
          toast.error("Mã QR đã hết hạn. Vui lòng thử lại.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle đặt hàng
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

    if (paymentMethod === "VNPAY") {
      // Thanh toán VNPay
      try {
        const token = localStorage.getItem("access_token");
        const payload = {
          user_id: currentUser.id,
          items: cart.filter(item => !item.is_combo).map(item => ({
            product_id: item.id,
            quantity: item.qty
          })),
          combo_items: cart.filter(item => item.is_combo).map(item => ({
            combo_id: item.combo_id,
            quantity: item.qty
          })),
          user_reward_id: selectedReward ? selectedReward.id : null,
        };

        const res = await axios.post(
          "http://127.0.0.1:8000/api/vnpay/create-payment",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setPaymentUrl(res.data.payment_url);
        setVnpayOrderId(res.data.order_id);
        setVnpTxnRef(res.data.vnp_txn_ref);
        setShowQR(true);
        setPaymentSuccess(false);

        // Bắt đầu polling & countdown
        startPolling(res.data.order_id);
        startCountdown();
        
      } catch (error) {
        console.error("Lỗi tạo thanh toán VNPay:", error);
        toast.error(error.response?.data?.detail || "Không thể tạo thanh toán VNPay.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Thanh toán tiền mặt (giữ nguyên logic cũ)
      try {
        const orderPayload = {
          user_id: currentUser.id, 
          items: cart.filter(item => !item.is_combo).map(item => ({
            product_id: item.id,
            quantity: item.qty
          })),
          combo_items: cart.filter(item => item.is_combo).map(item => ({
            combo_id: item.combo_id,
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
    }
  };

  // Hủy QR thanh toán
  const handleCancelQR = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollingRef.current = null;
    countdownRef.current = null;
    setShowQR(false);
    setPaymentUrl("");
    setVnpayOrderId(null);
    setVnpTxnRef("");
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 font-bold mb-4">Giỏ hàng trống, không thể thanh toán.</p>
        <button onClick={() => navigate("/menu")} className="text-[#00704A] font-black hover:underline">Quay lại Thực đơn</button>
      </div>
    );
  }

  // ============ MODAL QR VNPAY ============
  if (showQR) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-gradient-to-br from-[#005a3a] via-[#00704A] to-[#008f5e] rounded-[2.5rem] border border-white/10 p-10 relative overflow-hidden">
          {/* Hiệu ứng nền */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {paymentSuccess ? (
            // ============ THÀNH CÔNG ============
            <div className="relative z-10 text-center py-8 animate-in">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/30">
                <CheckCircle2 className="size-12 text-emerald-400 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Thanh toán thành công!</h2>
              <p className="text-white/60 text-sm font-medium mb-2">Đơn hàng #{vnpayOrderId} đã được xác nhận</p>
              <p className="text-white/40 text-xs">Đang chuyển hướng...</p>
              
              <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/40">Số tiền đã thanh toán</span>
                  <span className="text-emerald-400">{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
                </div>
              </div>
            </div>
          ) : (
            // ============ HIỂN THỊ QR ============
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-sky-500/20 p-2.5 rounded-xl">
                    <QrCode className="size-5 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Quét mã QR để thanh toán</h2>
                    <p className="text-white/40 text-[10px] font-bold mt-0.5 uppercase tracking-widest">Powered by VNPay</p>
                  </div>
                </div>
                <button 
                  onClick={handleCancelQR}
                  className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="size-4 text-white/40" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-8">
                <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-black/20 mb-5 flex items-center justify-center">
                  <img
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(paymentUrl)}&size=220&margin=2`}
                    alt="VNPay QR Code"
                    className="w-[220px] h-[220px] object-contain rounded-xl"
                  />
                </div>
                
                {/* Countdown timer */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className={`w-2 h-2 rounded-full ${countdown > 60 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                  <span className={countdown > 60 ? 'text-white/60' : 'text-amber-400'}>
                    Mã QR hết hạn sau {formatCountdown(countdown)}
                  </span>
                </div>
              </div>

              {/* Hướng dẫn */}
              <div className="space-y-3 mb-8">
                {[
                  { step: "1", text: "Mở ứng dụng Ngân hàng hoặc Ví điện tử" },
                  { step: "2", text: "Quét mã QR ở trên" },
                  { step: "3", text: "Xác nhận thanh toán trên điện thoại" },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-black flex-shrink-0">
                      {item.step}
                    </div>
                    <span className="text-white/70 text-xs font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Thông tin đơn hàng */}
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 mb-6">
                <div className="flex justify-between text-xs font-bold mb-3">
                  <span className="text-white/40">Mã đơn hàng</span>
                  <span className="text-white">#{vnpayOrderId}</span>
                </div>
                <div className="flex justify-between text-xs font-bold mb-3">
                  <span className="text-white/40">Mã giao dịch</span>
                  <span className="text-white font-mono text-[10px]">{vnpTxnRef}</span>
                </div>
                <div className="h-px bg-white/10 my-3" />
                <div className="flex justify-between text-sm font-black">
                  <span className="text-white">Tổng thanh toán</span>
                  <span className="text-amber-300">{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
                </div>
              </div>

              {/* Trạng thái chờ */}
              <div className="flex items-center justify-center gap-3 text-white/40">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Đang chờ thanh toán...</span>
              </div>

              {/* Link mở trực tiếp (mobile) */}
              <div className="mt-6 text-center">
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sky-400 text-[10px] font-bold uppercase tracking-widest hover:text-sky-300 transition-colors"
                >
                  <Smartphone className="size-3" />
                  Hoặc bấm vào đây để thanh toán trực tiếp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ TRANG CHECKOUT CHÍNH ============
  return (
    <div className="max-w-xl mx-auto">
      <button 
        onClick={() => navigate(-1)} 
        disabled={isSubmitting}
        className="flex items-center gap-2 text-white/40 font-bold text-[10px] mb-6 hover:text-white transition-colors uppercase tracking-widest disabled:opacity-50"
      >
        <ChevronLeft className="size-4" /> QUAY LẠI GIỎ HÀNG
      </button>

      <div className="bg-[#00704A] rounded-[2.5rem] border border-white/10 p-10">
        <div className="flex items-center gap-3 mb-8">
           <div className="bg-white/10 p-2.5 rounded-xl"><CreditCard className="size-5 text-white" /></div>
           <h2 className="text-2xl font-black text-white tracking-tight">Thanh toán</h2>
        </div>
        
        {/* User Rewards Section */}
        <div className="mb-8">
          <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Gift className="size-4 text-emerald-400" /> Ưu đãi của bạn</h3>
          
          {fetchingRewards ? (
             <div className="flex items-center gap-2 text-white/40 text-xs font-bold"><Loader2 className="size-4 animate-spin" /> Đang tải ưu đãi...</div>
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
                    className={`cursor-pointer p-4 border rounded-2xl transition-all flex justify-between items-center ${isSelected ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isDiscount ? 'bg-sky-500/20 text-sky-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {isDiscount ? <Ticket className="size-5" /> : <Gift className="size-5" />}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${isSelected ? 'text-emerald-400' : 'text-white'}`}>{rw.name}</div>
                          {isDiscount && rw.discount_value && (
                            <div className="text-[10px] text-white/40 mt-1 font-bold">Giảm {new Intl.NumberFormat('vi-VN').format(rw.discount_value)} đ</div>
                          )}
                        </div>
                     </div>
                     <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/20'}`}>
                        {isSelected && <CheckCircle2 className="size-4" />}
                     </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-xs text-white/40 italic">Bạn chưa có ưu đãi nào khả dụng trong kho quà.</div>
          )}
        </div>

        {/* Price Summary */}
        <div className="space-y-4 mb-10 bg-white/5 p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between text-xs font-bold gap-4">
            <span className="text-white/40 uppercase tracking-wider flex-shrink-0">Tạm tính:</span>
            <span className="text-white min-w-0 text-right">
              {new Intl.NumberFormat('vi-VN').format(cartOriginalTotal)} đ
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold gap-4">
            <span className="text-white/40 uppercase tracking-wider flex-shrink-0">Phí dịch vụ:</span>
            <span className="text-white">MIỄN PHÍ</span>
          </div>
          {appliedDiscount > 0 && (
            <div className="flex justify-between text-xs font-bold gap-4">
              <span className="text-emerald-400 uppercase tracking-wider flex-shrink-0">
                {currentUser?.role_id === 2 ? 'Ưu đãi nhân viên (-20%):' : `Ưu đãi hạng ${currentUser?.tier?.tier_name} (-${currentUser?.tier?.discount_percent}%):`}
              </span>
              <span className="text-emerald-400">- {new Intl.NumberFormat('vi-VN').format(appliedDiscount)} đ</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-xs font-bold gap-4">
              <span className="text-emerald-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5"><Ticket className="size-3" /> Ưu đãi áp dụng:</span>
              <span className="text-emerald-400">- {new Intl.NumberFormat('vi-VN').format(discountAmount)} đ</span>
            </div>
          )}
          {selectedReward && selectedReward.reward?.reward_type_id === 1 && (
             <div className="flex justify-between text-xs font-bold gap-4">
               <span className="text-purple-400 uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5"><Gift className="size-3" /> Quà tặng vật phẩm:</span>
               <span className="text-purple-400 text-right capitalize line-clamp-1">{selectedReward.reward.name}</span>
             </div>
          )}
          <div className="h-px bg-white/10" />
          <div className="flex justify-between text-xl font-black pt-2 gap-4">
            <span className="text-white flex-shrink-0">Tổng tiền:</span>
            <span className="text-amber-300 min-w-0 truncate text-right block max-w-[200px]">{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-10">
          <h3 className="text-[10px] font-black text-white/60 mb-4 uppercase tracking-widest">Phương thức thanh toán</h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Tiền mặt */}
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === "CASH"
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${paymentMethod === "CASH" ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                <Banknote className={`size-5 ${paymentMethod === "CASH" ? 'text-emerald-400' : 'text-white/40'}`} />
              </div>
              <div className={`text-xs font-black ${paymentMethod === "CASH" ? 'text-emerald-400' : 'text-white/60'}`}>Tiền mặt</div>
              <div className="text-[10px] text-white/30 mt-1 font-medium">Thanh toán tại quầy</div>
            </button>

            {/* VNPay */}
            <button
              onClick={() => setPaymentMethod("VNPAY")}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                paymentMethod === "VNPAY"
                  ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl w-fit mb-3 ${paymentMethod === "VNPAY" ? 'bg-sky-500/20' : 'bg-white/10'}`}>
                <QrCode className={`size-5 ${paymentMethod === "VNPAY" ? 'text-sky-400' : 'text-white/40'}`} />
              </div>
              <div className={`text-xs font-black ${paymentMethod === "VNPAY" ? 'text-sky-400' : 'text-white/60'}`}>VNPay QR</div>
              <div className="text-[10px] text-white/30 mt-1 font-medium">Quét mã thanh toán</div>
            </button>
          </div>
        </div>

        <button 
          onClick={handleOrder}
          disabled={isSubmitting}
          className={`w-full py-4.5 rounded-2xl font-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50 ${
            paymentMethod === "VNPAY"
              ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white hover:from-sky-500 hover:to-blue-600'
              : 'bg-white text-[#00704A] hover:bg-white/90'
          }`}
        >
          {isSubmitting ? (
            <> <Loader2 className="size-5 animate-spin" /> ĐANG XỬ LÝ... </>
          ) : paymentMethod === "VNPAY" ? (
            <> <QrCode className="size-5" /> THANH TOÁN VNPAY </>
          ) : (
            "XÁC NHẬN ĐẶT MÓN"
          )}
        </button>
      </div>
    </div>
  );
}