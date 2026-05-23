import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Props = {
  label: string;
  value: number;
  delta?: number;
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
  delta,
  suffix,
  format = defaultFormat,
}: Props) {
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value > prevRef.current) setPulse('up');
    else if (value < prevRef.current) setPulse('down');
    prevRef.current = value;
    const id = setTimeout(() => setPulse(null), 700);
    return () => clearTimeout(id);
  }, [value]);

  const showDelta = delta !== undefined && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;

  return (
    <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3.5 py-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.08em] truncate">
          {label}
        </span>
        {pulse === 'up' && (
          <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={2.6} />
        )}
        {pulse === 'down' && (
          <TrendingDown className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2.6} />
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <motion.div
          key={value}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-[34px] font-bold text-white tabular tracking-[-0.03em] leading-none vl-display"
        >
          {format(value)}
        </motion.div>
        {suffix && (
          <span className="text-[12px] font-semibold text-white/50 tracking-tight">
            {suffix}
          </span>
        )}
      </div>
      {showDelta ? (
        <div
          className={`inline-flex items-center gap-1 text-[10.5px] font-bold tracking-tight ${
            deltaPositive ? 'text-success' : 'text-accent'
          }`}
        >
          {deltaPositive ? '+' : ''}
          {delta} último min
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-white/40">
          <Minus className="w-3 h-3" strokeWidth={2.4} />
          sin cambios
        </div>
      )}
    </div>
  );
}
