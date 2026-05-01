// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  Users, Loader2, Shield, Crown, UserCheck, RefreshCw, User
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-hot-toast";
import CustomSelect from "../components/CustomSelect";

const API = "http://127.0.0.1:8000/api";

const ROLE_MAP = {
  1: { label: "Customer", icon: UserCheck, cls: "bg-sky-500/20 text-sky-300" },
  2: { label: "Staff",    icon: Shield,    cls: "bg-amber-500/20 text-amber-300" },
  3: { label: "Admin",    icon: Crown,     cls: "bg-violet-500/20 text-violet-300" },
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const usersRes = await axios.get(`${API}/users/`);
      setUsers(usersRes.data || []);
    } catch (err) { console.error("Lỗi tải dữ liệu:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateRole = async (userId, roleId) => {
    try { setUpdating(userId); await axios.put(`${API}/users/${userId}/role`, { role_id: roleId }); await fetchData(); toast.success("Phân quyền thành công"); } catch (err) { toast.error(err.response?.data?.detail || "Lỗi phân quyền"); } finally { setUpdating(null); }
  };

  const toggleActive = async (userId) => {
    try { setUpdating(userId); await axios.put(`${API}/users/${userId}/toggle-active`); await fetchData(); toast.success("Cập nhật trạng thái thành công"); } catch (err) { toast.error(err.response?.data?.detail || "Lỗi cập nhật trạng thái"); } finally { setUpdating(null); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-32 gap-4">
        <Loader2 className="size-10 text-[#00704A] animate-spin" />
        <span className="opacity-30 text-xs font-black uppercase tracking-widest">Đang xác thực quyền Admin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black  tracking-tight">Quản trị hệ thống</h1>
          <p className="opacity-40 text-sm font-medium mt-1">Quản lý tài khoản và phân quyền nhân viên</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
          <RefreshCw className="size-4 opacity-50" />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-black/5 dark:border-white/5">
        <button onClick={() => setActiveTab("users")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "users" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "opacity-40 hover:text-black dark:hover:text-white"}`}>
          <Users className="size-3.5" />Tài khoản ({users.length})
        </button>
      </div>

      {/* TAB USERS */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-[var(--bg-card)] rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-black/40 dark:text-white/60" />
                <h2 className="text-sm font-extrabold  uppercase tracking-wider">Danh sách nhân viên</h2>
              </div>
              <span className="text-[10px] opacity-40 font-bold">{users.length} tài khoản</span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/10">
                  <th className="text-left text-[10px] font-bold opacity-40 uppercase tracking-wider py-4 px-6">Nhân viên</th>
                  <th className="text-left text-[10px] font-bold opacity-40 uppercase tracking-wider py-4 px-4">Username</th>
                  <th className="text-left text-[10px] font-bold opacity-40 uppercase tracking-wider py-4 px-4">Vai trò</th>
                  <th className="text-center text-[10px] font-bold opacity-40 uppercase tracking-wider py-4 px-4">Trạng thái</th>
                  <th className="text-center text-[10px] font-bold opacity-40 uppercase tracking-wider py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
                          <User className="size-4 opacity-40" />
                        </div>
                        <span className="text-sm font-bold ">{u.full_name || u.username}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs opacity-40 font-medium">{u.username}</span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={u.role_id}
                        onChange={(e) => updateRole(u.id, parseInt(e.target.value))}
                        disabled={updating === u.id}
                        className="bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold  outline-none focus:ring-2 focus:ring-[#00704A] transition-all disabled:opacity-50"
                      >
                        <option value={1}>Customer</option>
                        <option value={2}>Staff</option>
                        <option value={3}>Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${u.is_active ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/20 text-rose-600 dark:text-rose-300"}`}>
                        {u.is_active ? "Hoạt động" : "Vô hiệu"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleActive(u.id)}
                        disabled={updating === u.id}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${
                          u.is_active
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20"
                        }`}
                      >
                        {updating === u.id ? "..." : u.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
