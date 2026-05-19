// src/components/CreateCustomerModal.jsx
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Phone, User, Loader2, UserPlus, Check, Copy, KeyRound, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = "/api";

export default function CreateCustomerModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState({ username: false, password: false });

  const [formData, setFormData] = useState({
    phone: '',
    full_name: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const resetForm = () => {
    setFormData({ phone: '', full_name: '' });
    setError("");
    setResult(null);
    setCopied({ username: false, password: false });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [field]: true }));
    toast.success("Đã sao chép!");
    setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.full_name.trim()) {
      setError("Vui lòng nhập họ tên khách hàng");
      return;
    }

    // Validate phone format (Vietnamese)
    const phoneRegex = /^(0|\+84)\d{9,10}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      setError("Số điện thoại không hợp lệ (VD: 0901234567)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/auth/staff-create-customer`, {
        phone: formData.phone.trim(),
        full_name: formData.full_name.trim()
      });
      
      setResult(res.data);
      toast.success("Tạo tài khoản thành công!");
    } catch (err) {
      setError(err.response?.data?.detail || "Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#1E3932] p-8 text-left shadow-2xl transition-all border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-[#00704A]/30 rounded-xl">
                      <UserPlus className="size-5 text-[#00704A]" />
                    </div>
                    {result ? 'Tạo thành công!' : 'Tạo tài khoản khách'}
                  </Dialog.Title>
                  <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="size-5 text-white/40" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-rose-500/15 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20">
                    {error}
                  </div>
                )}

                {!result ? (
                  /* ═══════ FORM NHẬP LIỆU ═══════ */
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-white/50 text-xs mb-2">
                      Hỗ trợ tạo tài khoản nhanh cho khách hàng. Mật khẩu mặc định sẽ là <span className="text-amber-300 font-bold">123456</span>
                    </p>
                    
                    {/* Họ và Tên */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                      <input
                        id="create-customer-name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="Họ và tên khách hàng"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all placeholder-white/25"
                        autoFocus
                        required
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                      <input
                        id="create-customer-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại (VD: 0901234567)"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all placeholder-white/25"
                        required
                      />
                    </div>

                    {/* Thông tin quy tắc */}
                    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-white/30 font-medium leading-relaxed">
                        <span className="text-white/50 font-bold">Quy tắc tạo tài khoản:</span><br/>
                        • Tên đăng nhập = Tên + 3 số cuối SĐT<br/>
                        • Mật khẩu mặc định: 123456<br/>
                        • Tài khoản tự động kích hoạt
                      </p>
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl font-bold shadow-lg shadow-[#00704A]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      {loading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          Tạo tài khoản
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* ═══════ KẾT QUẢ THÀNH CÔNG ═══════ */
                  <div className="space-y-4">
                    {/* Success icon */}
                    <div className="flex justify-center mb-2">
                      <div className="p-4 bg-emerald-500/20 rounded-full">
                        <ShieldCheck className="size-10 text-emerald-400" />
                      </div>
                    </div>

                    <p className="text-center text-white/60 text-sm">
                      Đã tạo tài khoản cho <span className="text-white font-bold">{result.user.full_name}</span>
                    </p>

                    {/* Thông tin tài khoản */}
                    <div className="bg-white/5 rounded-2xl p-5 space-y-4 border border-white/10">
                      {/* Username */}
                      <div>
                        <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1.5">Tên đăng nhập</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                            <span className="text-sm font-black text-[#00704A]">{result.user.username}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(result.user.username, 'username')}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            title="Sao chép"
                          >
                            {copied.username ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-white/40" />}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1.5">Mật khẩu mặc định</label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 border border-white/10 flex items-center gap-2">
                            <KeyRound className="size-3.5 text-amber-300/50" />
                            <span className="text-sm font-black text-amber-300">{result.default_password}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(result.default_password, 'password')}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                            title="Sao chép"
                          >
                            {copied.password ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-white/40" />}
                          </button>
                        </div>
                      </div>

                      {/* SĐT */}
                      <div>
                        <label className="text-[9px] text-white/40 font-bold uppercase tracking-widest block mb-1.5">Số điện thoại</label>
                        <div className="bg-white/5 rounded-xl px-4 py-2.5 border border-white/10">
                          <span className="text-sm font-bold text-white/70">{result.user.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lưu ý */}
                    <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                      <p className="text-[10px] text-amber-300/80 font-medium leading-relaxed">
                        ⚠️ Vui lòng gửi thông tin tài khoản cho khách hàng và nhắc họ đổi mật khẩu sau khi đăng nhập lần đầu.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => { resetForm(); }}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all text-sm"
                      >
                        Tạo thêm
                      </button>
                      <button
                        onClick={handleClose}
                        className="flex-1 py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl font-bold shadow-lg shadow-[#00704A]/20 transition-all text-sm"
                      >
                        Hoàn tất
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
