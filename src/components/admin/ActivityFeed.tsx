import { AnimatePresence, motion } from 'framer-motion';
import {
  Bus,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { AgentAction, AgentEvent } from '../../types';

const ACTION_LABEL: Record<AgentAction, string> = {
  asked_ai: 'preguntó al asistente',
  started_trip: 'inició un viaje',
  completed_trip: 'completó un viaje',
  reported_incident: 'reportó incidente',
};

const ACTION_ICON: Record<AgentAction, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  asked_ai: Sparkles,
  started_trip: Bus,
  completed_trip: CheckCircle2,
  reported_incident: AlertTriangle,
};

const ACTION_COLOR: Record<AgentAction, string> = {
  asked_ai: 'text-brand bg-brand/10',
  started_trip: 'text-success bg-success/10',
  completed_trip: 'text-text-primary bg-black/5',
  reported_incident: 'text-accent bg-accent/10',
};

function relativeTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 1) return 'ahora';
  if (diff < 60) return `${Math.floor(diff)}s`;
  return `${Math.floor(diff / 60)} min`;
}

type Props = { feed: AgentEvent[] };

export default function ActivityFeed({ feed }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <div className="text-[11px] font-bold text-white/50 uppercase tracking-[0.1em]">
            Actividad
          </div>
          <div className="text-[15px] font-semibold text-white tracking-tight">
            En vivo
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/15">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-success/60 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-success" />
          </span>
          <span className="text-[10.5px] font-bold text-success uppercase tracking-wide">
            Stream
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-none">
        <AnimatePresence initial={false}>
          {feed.map((event) => {
            const Icon = ACTION_ICON[event.action];
            const color = ACTION_COLOR[event.action];
            return (
              <motion.div
                key={`${event.userId}_${event.timestamp}`}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.04]"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-white truncate leading-tight">
                    <span className="font-semibold">{event.userName}</span>{' '}
                    <span className="text-white/60">
                      {ACTION_LABEL[event.action]}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-white/40 mt-0.5">
                    {relativeTime(event.timestamp)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
