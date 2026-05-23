import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { AdminInsight } from '../../hooks/useSimulator';

type Props = { insights: AdminInsight[]; intervalMs?: number };

export default function InsightRotator({ insights, intervalMs = 4500 }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (insights.length === 0) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % insights.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [insights.length, intervalMs]);

  const current = insights[idx];
  if (!current) return null;

  return (
    <div className="relative bg-gradient-to-r from-brand/[0.18] via-brand/[0.10] to-transparent border border-brand/15 rounded-2xl px-3.5 py-2.5 overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brand/10 to-transparent pointer-events-none" />
      <div className="flex items-center gap-2.5 relative">
        <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-bold text-white/55 uppercase tracking-[0.08em] truncate">
            {current.label}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${idx}-${current.value}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="text-[18px] font-bold text-white tracking-tight vl-display tabular truncate"
            >
              {current.value}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex gap-1 shrink-0">
          {insights.map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full transition-colors ${
                i === idx ? 'bg-brand' : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
