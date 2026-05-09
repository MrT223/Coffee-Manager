import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, PartyPopper, Coffee } from 'lucide-react';

const Confetti = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#00704A', '#d4c9a8', '#ffffff', '#FFD700', '#FF69B4', '#00ffcc', '#ff3366'];
    const newParticles = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'square',
      sway: Math.random() * 20 - 10
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ 
            y: '110vh', 
            x: `${p.x + p.sway}vw`,
            rotate: p.rotation + 1440,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: p.duration, 
            delay: p.delay, 
            ease: "linear",
            repeat: Infinity 
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 10px ${p.color}44`,
          }}
        />
      ))}
    </div>
  );
};

export default function BirthdayModal({ isOpen, onClose, username }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />
        
        <Confetti />

        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-gradient-to-br from-[#1E3932] to-[#0d1f1b] w-full max-w-md rounded-[40px] p-8 overflow-hidden border border-white/10 shadow-2xl"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 size-40 bg-[#00704A]/20 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 size-40 bg-[#00704A]/10 rounded-full blur-3xl -ml-20 -mb-20" />

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
          >
            <X className="size-5 text-white/40" />
          </button>

          <div className="relative text-center">
            {/* Icon */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex p-5 bg-[#00704A] rounded-3xl shadow-2xl shadow-[#00704A]/40 mb-8"
            >
              <PartyPopper className="size-10 text-white" />
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-white mb-2"
            >
              Happy Birthday, <br/>
              <span className="text-[#00704A]">{username}!</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-sm mb-8 font-medium leading-relaxed"
            >
              Chúc mừng sinh nhật bạn! Cafe Sýbẩu gởi tặng bạn một món quà nhỏ để ngày đặc biệt thêm ngọt ngào.
            </motion.p>

            {/* Voucher Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 flex items-center gap-5 relative overflow-hidden group hover:border-[#00704A]/50 transition-all"
            >
              <div className="bg-[#00704A]/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Gift className="size-8 text-[#00704A]" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-[#00704A] uppercase tracking-[0.2em] mb-1">Voucher đặc biệt</div>
                <div className="text-xl font-black text-white">Giảm giá 50%</div>
                <div className="text-[10px] text-white/30 font-medium italic">Voucher đã được thêm vào kho của bạn</div>
              </div>
              
              {/* Decorative dash line */}
              <div className="absolute right-0 top-0 bottom-0 w-8 flex flex-col items-center justify-center gap-1 opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="size-1 bg-white rounded-full" />
                ))}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="w-full py-4 bg-[#00704A] hover:bg-[#00804f] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#00704A]/20 transition-all active:scale-95"
            >
              Cảm ơn Cafe Sýbẩu!
            </motion.button>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 flex items-center justify-center gap-2 text-white/20"
            >
              <Coffee className="size-3" />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Enjoy your day</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
