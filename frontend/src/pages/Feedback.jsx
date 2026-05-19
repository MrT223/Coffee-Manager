import React, { useState } from "react";
import { MessageSquare, Send, Loader2, Star } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";

const API = "/api";

export default function Feedback({ currentUser }) {
  const [feedbackCategory, setFeedbackCategory] = useState("Chất lượng đồ uống");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (feedbackContent.trim().length < 10) {
      toast.error("Vui lòng nhập nội dung chi tiết tối thiểu 10 ký tự!");
      return;
    }
    try {
      setSubmittingFeedback(true);
      await axios.post(`${API}/feedback/`, {
        category: feedbackCategory,
        content: feedbackContent.trim()
      });
      toast.success("Cảm ơn bạn! Ý kiến phản hồi đã được gửi đến Admin thành công.");
      setFeedbackContent("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gửi phản hồi thất bại!");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <Star className="size-12 text-white/10 mx-auto mb-3" />
        <p className="text-white/30 text-sm font-medium">Vui lòng đăng nhập để gửi phản hồi</p>
      </div>
    );
  }

  if (currentUser.role_id !== 1) {
    return (
      <div className="text-center py-20 max-w-md mx-auto space-y-4">
        <MessageSquare className="size-12 text-rose-400/20 mx-auto mb-3" />
        <h3 className="text-lg font-black text-white">Quyền truy cập bị hạn chế</h3>
        <p className="text-white/40 text-sm font-medium">
          Chức năng gửi ý kiến đóng góp/phản ánh về cửa hàng chỉ hỗ trợ dành riêng cho tài khoản Khách Hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-white tracking-tight">Gửi ý kiến đóng góp</h1>
        <p className="text-white/40 text-sm font-medium mt-1">Ý kiến đóng góp của bạn giúp chúng tôi cải thiện chất lượng phục vụ tốt hơn.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#00704A]/20 p-2.5 rounded-xl">
            <MessageSquare className="size-5 text-[#00704A]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Phản hồi của bạn</h3>
            <p className="text-white/40 text-xs mt-0.5">Chúng tôi trân trọng mọi chia sẻ từ quý khách hàng.</p>
          </div>
        </div>

        <form onSubmit={handleSendFeedback} className="space-y-5">
          {/* Category Selection Grid */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2.5">
              Danh mục phản ánh
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                "Chất lượng đồ uống",
                "Chất lượng dịch vụ",
                "Sự cố thanh toán",
                "Góp ý khác"
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFeedbackCategory(cat)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-center ${
                    feedbackCategory === cat
                      ? "bg-[#00704A]/20 border-[#00704A] text-white shadow-lg shadow-[#00704A]/10"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white/80 hover:bg-white/[0.08]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea content */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Nội dung chi tiết
              </label>
              <span className={`text-[10px] font-bold ${feedbackContent.length >= 500 ? "text-rose-400" : "text-white/40"}`}>
                {feedbackContent.length}/500 ký tự
              </span>
            </div>
            <textarea
              value={feedbackContent}
              onChange={(e) => setFeedbackContent(e.target.value.slice(0, 500))}
              placeholder="Nhập nội dung phản hồi của bạn tại đây (tối thiểu 10 ký tự)..."
              rows={6}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-[#00704A]/50 transition-all resize-none"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submittingFeedback || feedbackContent.trim().length < 10}
            className="w-full py-4 bg-[#00704A] hover:bg-[#00804f] disabled:bg-white/5 disabled:text-white/20 disabled:border-transparent disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-lg shadow-[#00704A]/30 flex items-center justify-center gap-2 transition-all uppercase tracking-widest border border-white/10"
          >
            {submittingFeedback ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Send className="size-4" />
                Gửi ý kiến phản hồi
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
