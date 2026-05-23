import { AnimatePresence, motion } from 'framer-motion';
import {
  Bus,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import type { AgentAction, AgentEvent } from '../../types';

const ACTION_LABEL: Record<AgentAction, string> = {
  asked_ai: 'preguntó al asistente',
  started_trip: 'inició un viaje',
  completed_trip: 'completó un viaje',
  reported_incident: 'reportó incidente',
  boarded: 'subió al bus',
};

const ACTION_ICON: Record<AgentAction, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  asked_ai: Sparkles,
  started_trip: Bus,
  completed_trip: CheckCircle2,
  reported_incident: AlertTriangle,
  boarded: LogIn,
};

const ACTION_COLOR: Record<AgentAction, string> = {
  asked_ai: 'text-brand bg-brand/10',
  started_trip: 'text-success bg-success/10',
  completed_trip: 'text-text-primary bg-black/5',
  reported_incident: 'text-accent bg-accent/10',
  boarded: 'text-brand bg-brand/10',
};

const ACTION_BAR: Record<AgentAction, string> = {
  asked_ai: 'bg-brand',
  started_trip: 'bg-success',
  completed_trip: 'bg-white/40',
  reported_incident: 'bg-accent',
  boarded: 'bg-brand',
};

function relativeTime(iso: string): string {
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 1) return 'ahora';
  if (diff < 60) return `${Math.floor(diff)}s`;
  return `${Math.floor(diff / 60)} min`;
}

type Props = { feed: AgentEvent[] };

export default function ActivityFeed({ feed }: Props) {
  const [head, ...rest] = feed;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.06]">
        <div>
          <div className="text-[10.5px] font-bold text-white/50 uppercase tracking-[0.1em]">
            Actividad
          </div>
          <div className="text-[15px] font-bold text-white tracking-tight vl-headline">
            En vivo
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/15">
          <span className="vl-status-dot text-success" />
          <span className="pl-1.5 text-[10.5px] font-bold text-success uppercase tracking-wide">
            Stream
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3 space-y-1.5 scrollbar-none">
        <AnimatePresence initial={false}>
          {head && (
            <motion.div
              key={`pinned-${head.userId}_${head.timestamp}`}
              layout
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="relative bg-white/[0.06] border border-white/[0.10] rounded-xl pl-3.5 pr-3 py-2.5 overflow-hidden"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${ACTION_BAR[head.action]}`}
              />
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = ACTION_ICON[head.action];
                  const color = ACTION_COLOR[head.action];
                  return (
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2.4} />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-bold text-brand uppercase tracking-[0.08em]">
                      Ahora
                    </span>
                    <span className="vl-status-dot text-brand" />
                  </div>
                  <div className="text-[13.5px] text-white truncate leading-tight mt-0.5">
                    <span className="font-bold">{head.userName}</span>{' '}
                    <span className="text-white/70">
                      {ACTION_LABEL[head.action]}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {rest.map((event) => {
            const Icon = ACTION_ICON[event.action];
            const color = ACTION_COLOR[event.action];
            return (
              <motion.div
                key={`${event.userId}_${event.timestamp}`}
                layout
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
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
