// src/components/AuthModal.jsx
import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const url = isLogin 
        ? "http://127.0.0.1:8000/api/auth/login" 
        : "http://127.0.0.1:8000/api/auth/register";
      
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : { username: formData.username, password: formData.password, role_id: 1 };

      const res = await axios.post(url, payload);
      
      // Lấy dữ liệu user từ Backend trả về (sẽ được cấu hình ở bước 2 bên dưới)
      let userData = res.data.user || res.data; 

      // Lưu trữ an toàn ID thật
      localStorage.setItem("user", JSON.stringify(userData));
      if (res.data.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
      }
      
      onLoginSuccess(userData); 
      onClose();
      setFormData({ username: '', password: '', fullName: '' });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Thông tin đăng nhập không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-[#1E3932] p-8 text-left shadow-2xl transition-all border border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-bold text-white">
                    {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="size-5 text-white/40" />
                  </button>
                </div>

                {error && <div className="mb-4 p-3 bg-rose-500/15 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                      <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="Họ và tên" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required />
                    </div>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                    <input name="username" type="text" value={formData.username} onChange={handleChange} placeholder="Tên đăng nhập" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required />
                  </div>

                  <button disabled={loading} type="submit" className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl font-bold shadow-lg shadow-[#00704A]/20 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="size-5 animate-spin" /> : (isLogin ? 'Đăng nhập' : 'Đăng ký ngay')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-white/40 text-sm">
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-[#00704A] font-bold hover:underline">
                      {isLogin ? 'Đăng ký' : 'Đăng nhập'}
                    </button>
                  </p>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}