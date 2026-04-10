// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from "react";
import {
  Users, Loader2, Shield, Crown, UserCheck, RefreshCw
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
        <span className="text-white/30 text-xs font-black uppercase tracking-widest">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Quản trị hệ thống</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Quản lý tài khoản và chương trình tích điểm</p>
        </div>
        <button onClick={fetchData} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          <RefreshCw className="size-4 text-white/50" />
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl w-fit gap-1 border border-white/5">
        <button onClick={() => setActiveTab("users")} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "users" ? "bg-[#00704A] text-white shadow-lg shadow-[#00704A]/20" : "text-white/40 hover:text-white/70"}`}>
          <Users className="size-3.5" />Tài khoản ({users.length})
        </button>
      </div>

      {/* TAB USERS */}
      {activeTab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-[#00704A] rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">ID</th>
                  <th className="text-left text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Username</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Điểm</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Vai trò</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-4">Trạng thái</th>
                  <th className="text-center text-[10px] font-bold text-white/40 uppercase tracking-wider py-4 px-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(user => {
                  const role = ROLE_MAP[user.role_id] || ROLE_MAP[1];
                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold text-white/50">#{user.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=00704A&color=ffffff&bold=true&size=32`} className="rounded-xl" alt="" />
                          </div>
                          <span className="text-sm font-bold text-white">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-black text-amber-300">{user.total_points}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <CustomSelect
                          value={user.role_id}
                          onChange={val => updateRole(user.id, parseInt(val))}
                          className="min-w-[105px]"
                          options={[
                            { value: 1, label: "Customer" },
                            { value: 2, label: "Staff" },
                            { value: 3, label: "Admin" }
                          ]}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full ${user.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                          {user.is_active ? "Hoạt động" : "Vô hiệu"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleActive(user.id)}
                          disabled={updating === user.id}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${
                            user.is_active
                              ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20"
                              : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20"
                          }`}
                        >
                          {updating === user.id ? "..." : user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
