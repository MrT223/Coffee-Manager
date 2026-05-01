import React from "react";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, CircleUser } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black  tracking-tight">Cài đặt</h1>
        <p className="opacity-40 text-sm font-medium mt-1">Quản lý tùy chọn cá nhân và hệ thống</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CircleUser className="size-4 text-[#00704A] dark:text-white/60" />
            <h3 className="text-sm font-extrabold ">Tài khoản</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-bold opacity-60">Tên hiển thị</span>
              <span className="text-xs font-black ">Admin User</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
              <span className="text-xs font-bold opacity-60">Email</span>
              <span className="text-xs font-black ">admin@cafe67.com</span>
            </div>
          </div>
        </section>

        <section className="bg-[var(--bg-card)] rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="size-4 text-[#00704A] dark:text-white/60" />
            <h3 className="text-sm font-extrabold ">Thông báo</h3>
          </div>
          <div className="space-y-3">
             <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold opacity-60 group-hover:text-black dark:group-hover:text-white transition-colors">Thông báo đơn hàng mới</span>
                <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative">
                   <div className="absolute right-1 top-1 size-3 bg-emerald-500 rounded-full" />
                </div>
             </label>
             <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs font-bold opacity-60 group-hover:text-black dark:group-hover:text-white transition-colors">Âm thanh thông báo</span>
                <div className="w-10 h-5 bg-black/10 dark:bg-white/10 rounded-full relative">
                   <div className="absolute left-1 top-1 size-3 bg-white/40 rounded-full" />
                </div>
             </label>
          </div>
        </section>
      </div>

      <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-black/5 dark:border-white/10 shadow-sm flex flex-col items-center text-center">
        <div className="bg-black/5 dark:bg-white/10 p-4 rounded-2xl mb-4">
          <Shield className="size-8 text-[#00704A] dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-black  mb-2">Bảo mật hệ thống</h3>
        <p className="text-xs opacity-40 max-w-sm mb-6">Phiên bản 2.1.0-dark-gold. Mọi dữ liệu giao dịch đều được mã hóa theo tiêu chuẩn quân đội.</p>
        <button className="px-8 py-3 bg-[#00704A] text-white rounded-xl text-xs font-black shadow-lg shadow-[#00704A]/20 hover:scale-105 transition-transform active:scale-95">ĐỔI MẬT KHẨU</button>
      </div>
    </div>
  );
}
