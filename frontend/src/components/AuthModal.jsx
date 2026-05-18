// src/components/AuthModal.jsx
import { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Mail, Lock, User, Loader2, Phone, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const recaptchaRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    otp: ''
  });

  const [otpArray, setOtpArray] = useState(Array(6).fill(''));
  const inputRefs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = value;
    setOtpArray(newOtp);
    setFormData({ ...formData, otp: newOtp.join('') });
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtpArray(newOtp);
    setFormData({ ...formData, otp: pastedData });
    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', full_name: '', email: '', otp: '' });
    setShowOtpStep(false);
    setConfirmationResult(null);
    setError("");
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      const container = document.getElementById('recaptcha-container');
      if (!container) return;

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'normal', // Chuyển sang normal để dễ debug
        'callback': (response) => {
          console.log("reCAPTCHA solved");
        },
        'expired-callback': () => {
          window.recaptchaVerifier.reset();
        }
      });
    }
  };

  const handleRequestOtp = async () => {
    if (!formData.username) {
        toast.error("Vui lòng nhập số điện thoại");
        return;
    }
    setLoading(true);
    try {
        // Đảm bảo reCAPTCHA đã sẵn sàng
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        
        // Normalize phone for Firebase (+84...)
        let phone = formData.username;
        if (phone.startsWith("0")) phone = "+84" + phone.substring(1);
        else if (!phone.startsWith("+")) phone = "+84" + phone;

        console.log("Attempting sign in with:", phone);
        const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(confirmation);
        toast.success("Mã OTP đã được gửi!");
        
        // Xóa reCAPTCHA sau khi đã gửi mã thành công để không bị thừa trên giao diện
        if (window.recaptchaVerifier && window.recaptchaVerifier.clear) {
            window.recaptchaVerifier.clear();
        }
        
        setShowOtpStep(true);
    } catch (err) {
        console.error("Firebase Auth Error:", err);
        setError(`Lỗi Firebase: ${err.code || err.message}`);
        // Chỉ reset khi có lỗi để người dùng tích lại
        if (window.recaptchaVerifier && window.recaptchaVerifier.reset) {
          window.recaptchaVerifier.reset();
        }
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isForgotPassword && !showOtpStep) {
        setLoading(true);
        setError("");
        try {
            await axios.post(`${API_BASE}/auth/check-phone`, { username: formData.username, password: "dummy_password" });
            handleRequestOtp();
        } catch (err) {
            setError(err.response?.data?.detail || "Số điện thoại chưa được đăng ký");
            setLoading(false);
        }
        return;
    }
    
    if (!isLogin && !isForgotPassword && !showOtpStep) {
        handleRequestOtp();
        return;
    }

    setLoading(true);
    setError("");
    
    try {
      if (isLogin && !isForgotPassword) {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          username: formData.username,
          password: formData.password
        });
        handleSuccess(res.data);
      } else if (isForgotPassword) {
        // 1. Verify OTP with Firebase
        const result = await confirmationResult.confirm(formData.otp);
        const idToken = await result.user.getIdToken();

        // 2. Reset Password on Backend
        await axios.post(`${API_BASE}/auth/reset-password`, {
          username: formData.username,
          password: formData.password, 
          firebase_token: idToken
        });

        toast.success("Đặt lại mật khẩu thành công!");
        setIsForgotPassword(false);
        setIsLogin(true);
        setShowOtpStep(false);
        setFormData({ ...formData, password: '', otp: '' });
      } else {
        // 1. Verify OTP with Firebase
        const result = await confirmationResult.confirm(formData.otp);
        const idToken = await result.user.getIdToken();

        // 2. Register on Backend with Firebase Token
        const res = await axios.post(`${API_BASE}/auth/register`, {
          ...formData,
          firebase_token: idToken
        });
        handleSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Thông tin không chính xác.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (data) => {
    const userData = data.user || data; 
    localStorage.setItem("user", JSON.stringify(userData));
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }
    toast.success(isLogin ? "Đăng nhập thành công!" : "Đăng ký thành công!");
    onLoginSuccess(userData); 
    onClose();
    resetForm();
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (!isLogin && !showOtpStep) {
      // Đợi một chút để DOM render xong container
      setTimeout(() => {
        setupRecaptcha();
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.render();
        }
      }, 500);
    }
  }, [isOpen, isLogin, showOtpStep]);

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
                    {isForgotPassword ? (showOtpStep ? 'Đặt lại mật khẩu' : 'Quên mật khẩu') : isLogin ? 'Chào mừng trở lại' : showOtpStep ? 'Xác thực mã OTP' : 'Đăng ký thành viên'}
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="size-5 text-white/40" />
                  </button>
                </div>
                {error && <div className="mb-4 p-3 bg-rose-500/15 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!showOtpStep ? (
                    <>
                      {!isLogin && !isForgotPassword && (
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                          <input name="full_name" type="text" value={formData.full_name} onChange={handleChange} placeholder="Họ và tên" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required={!isLogin} />
                        </div>
                      )}
                      
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                        <input name="username" type="tel" value={formData.username} onChange={handleChange} placeholder="Số điện thoại" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required />
                      </div>
                      
                      {!isLogin && !isForgotPassword && (
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email (tùy chọn)" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" />
                        </div>
                      )}
                      
                      {!isForgotPassword && (
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required={!isForgotPassword} />
                        </div>
                      )}
                      
                      {isLogin && !isForgotPassword && (
                        <div className="flex justify-end mt-1">
                          <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-[#00704A] font-bold hover:underline">Quên mật khẩu?</button>
                        </div>
                      )}

                      {(!isLogin || isForgotPassword) && (
                        <div className="flex justify-center my-4">
                          <div id="recaptcha-container"></div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                        <p className="text-white/60 text-xs text-center px-4">Firebase đã gửi mã OTP đến số <span className="text-white font-bold">{formData.username}</span></p>
                        <div className="flex justify-center gap-2 my-6">
                          {[...Array(6)].map((_, index) => (
                            <input
                              key={index}
                              ref={el => inputRefs.current[index] = el}
                              type="text"
                              maxLength={1}
                              value={otpArray[index] || ''}
                              onChange={e => handleOtpChange(index, e.target.value)}
                              onKeyDown={e => handleOtpKeyDown(index, e)}
                              onPaste={handleOtpPaste}
                              className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all"
                              required
                            />
                          ))}
                        </div>
                        
                        {isForgotPassword && (
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-white/30" />
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Mật khẩu mới" className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-[#00704A]/50 focus:border-[#00704A] transition-all" required />
                          </div>
                        )}
                        
                        <button type="button" onClick={handleRequestOtp} className="w-full text-xs text-[#00704A] font-bold hover:underline">Gửi lại mã OTP</button>
                    </div>
                  )}

                  <button disabled={loading} type="submit" className="w-full py-3 bg-[#00704A] hover:bg-[#00804f] text-white rounded-xl font-bold shadow-lg shadow-[#00704A]/20 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="size-5 animate-spin" /> : (isForgotPassword ? (showOtpStep ? 'Đặt lại mật khẩu' : 'Nhận mã OTP') : isLogin ? 'Đăng nhập' : showOtpStep ? 'Xác nhận & Đăng ký' : 'Nhận mã OTP')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-white/40 text-sm">
                    {isForgotPassword ? (
                      <button type="button" onClick={() => { setIsForgotPassword(false); setIsLogin(true); setShowOtpStep(false); }} className="text-[#00704A] font-bold hover:underline">
                        Quay lại Đăng nhập
                      </button>
                    ) : (
                      <>
                        {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                        <button type="button" onClick={() => { setIsLogin(!isLogin); setShowOtpStep(false); }} className="ml-2 text-[#00704A] font-bold hover:underline">
                          {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                        </button>
                      </>
                    )}
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