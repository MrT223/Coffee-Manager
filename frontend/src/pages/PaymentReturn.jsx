// src/pages/PaymentReturn.jsx
/**
 * Trang này được VNPay redirect khách hàng đến sau khi thanh toán.
 * Nó đọc query params từ URL và hiển thị kết quả.
 */
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Home, ShoppingBag } from "lucide-react";

const getVNPayErrorMessage = (code) => {
  const errorMap = {
    "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ gian lận.",
    "09": "Giao dịch thất bại: Thẻ/Tài khoản chưa đăng ký Internet Banking.",
    "10": "Giao dịch thất bại: Xác thực thông tin thẻ/tài khoản sai quá 3 lần.",
    "11": "Giao dịch thất bại: Đã hết hạn chờ thanh toán.",
    "12": "Giao dịch thất bại: Thẻ/Tài khoản của bạn đang bị khóa.",
    "13": "Giao dịch thất bại: Nhập sai mật khẩu OTP.",
    "24": "Thanh toán không thành công: Bạn đã hủy giao dịch.",
    "51": "Giao dịch thất bại: Số dư tài khoản không đủ.",
    "65": "Giao dịch thất bại: Vượt quá hạn mức giao dịch trong ngày.",
    "75": "Ngân hàng thanh toán đang bảo trì, vui lòng thử lại sau.",
    "79": "Giao dịch thất bại: Nhập sai mật khẩu thanh toán quá số lần quy định.",
    "99": "Thanh toán thất bại: Lỗi hệ thống VNPay."
  };
  return errorMap[code] || "Thanh toán thất bại hoặc có lỗi xảy ra.";
};

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, failed, error

  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TxnRef = searchParams.get("vnp_TxnRef");
  const vnp_Amount = searchParams.get("vnp_Amount");
  const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
  const vnp_BankCode = searchParams.get("vnp_BankCode");
  const vnp_PayDate = searchParams.get("vnp_PayDate");

  useEffect(() => {
    // Xác định trạng thái từ response code
    if (vnp_ResponseCode === "00") {
      setStatus("success");
      // Phát âm thanh thông báo thành công
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav");
        audio.volume = 0.4;
        audio.play().catch(e => console.log("Lỗi phát âm thanh:", e));
      } catch (soundError) {
        console.error("Không thể khởi tạo âm thanh:", soundError);
      }
    } else if (vnp_ResponseCode) {
      setStatus("failed");
    } else {
      setStatus("error");
    }
  }, [vnp_ResponseCode]);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length < 14) return dateStr;
    return `${dateStr.slice(6, 8)}/${dateStr.slice(4, 6)}/${dateStr.slice(0, 4)} ${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}`;
  };

  const formatAmount = (amountStr) => {
    if (!amountStr) return "0";
    const amount = parseInt(amountStr) / 100;
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-12 text-white/40 animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm font-bold">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-10">
      <div className="bg-gradient-to-br from-[#005a3a] via-[#00704A] to-[#008f5e] rounded-[2.5rem] border border-white/10 p-10 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Status Icon */}
          <div className="text-center mb-8">
            {status === "success" ? (
              <>
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/30">
                  <CheckCircle2 className="size-12 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Thanh toán thành công!</h2>
                <p className="text-white/50 text-sm font-medium">Đơn hàng của bạn đã được xác nhận</p>
              </>
            ) : (
              <>
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-500/30">
                  <XCircle className="size-12 text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">
                  {status === "failed" ? "Thanh toán thất bại" : "Có lỗi xảy ra"}
                </h2>
                <p className="text-white/80 text-sm font-bold px-4 mb-4">
                  {status === "failed" ? getVNPayErrorMessage(vnp_ResponseCode) : "Không nhận được dữ liệu thanh toán"}
                </p>
                {status === "failed" && (
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                    Mã lỗi từ VNPay: {vnp_ResponseCode}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Transaction Details */}
          {vnp_TxnRef && (
            <div className="space-y-3 p-5 bg-white/5 rounded-2xl border border-white/10 mb-8">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white/40">Mã giao dịch</span>
                <span className="text-white font-mono">{vnp_TxnRef}</span>
              </div>
              {vnp_TransactionNo && (
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/40">Mã GD VNPay</span>
                  <span className="text-white">{vnp_TransactionNo}</span>
                </div>
              )}
              {vnp_BankCode && (
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/40">Ngân hàng</span>
                  <span className="text-white">{vnp_BankCode}</span>
                </div>
              )}
              {vnp_PayDate && (
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-white/40">Thời gian</span>
                  <span className="text-white">{formatDate(vnp_PayDate)}</span>
                </div>
              )}
              {vnp_Amount && (
                <>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between text-sm font-black pt-1">
                    <span className="text-white">Số tiền</span>
                    <span className="text-amber-300">{formatAmount(vnp_Amount)} đ</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              <Home className="size-4" /> Trang chủ
            </button>
            <button
              onClick={() => navigate("/menu")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-[#00704A] text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all"
            >
              <ShoppingBag className="size-4" /> Đặt thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
