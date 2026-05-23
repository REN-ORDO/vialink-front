import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

type Props = {
  label: string;
  value: number;
  suffix?: string;
  format?: (n: number) => string;
};

function defaultFormat(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  }
  return n.toString();
}

export default function MetricCard({
  label,
  value,
  suffix,
  format = defaultFormat,
}: Props) {
  const prevRef = useRef(value);
  const [delta, setDelta] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value > prevRef.current) setDelta('up');
    else if (value < prevRef.current) setDelta('down');
    prevRef.current = value;
    const id = setTimeout(() => setDelta(null), 700);
    return () => clearTimeout(id);
  }, [value]);

  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3.5 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-white/50 uppercase tracking-[0.08em]">
          {label}
        </span>
        {delta === 'up' && (
          <TrendingUp className="w-3.5 h-3.5 text-success" strokeWidth={2.6} />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <motion.div
          key={value}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-[28px] font-bold text-white tabular-nums tracking-tight leading-none"
        >
          {format(value)}
        </motion.div>
        {suffix && (
          <span className="text-[12px] font-semibold text-white/50 tracking-tight">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
