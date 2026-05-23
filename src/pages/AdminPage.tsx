import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bot } from 'lucide-react';
import AgentMap from '../components/admin/AgentMap';
import ActivityFeed from '../components/admin/ActivityFeed';
import MetricCard from '../components/admin/MetricCard';
import InsightRotator from '../components/admin/InsightRotator';
import { useSimulator } from '../hooks/useSimulator';

export default function AdminPage() {
  const navigate = useNavigate();
  const { agents, feed, ripples, metrics, insights } = useSimulator();

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-text-primary min-h-0 overflow-hidden">
      <div className="relative flex-1 min-h-[55vh] lg:min-h-0">
        <AgentMap agents={agents} ripples={ripples} />

        <header className="absolute top-0 left-0 right-0 z-30 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="cursor-pointer w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center active:bg-white/15 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.4} />
          </button>
          <div className="flex-1 inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3.5 h-10">
            <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-white truncate tracking-tight vl-headline">
                Simulador · 500 agentes IA
              </div>
            </div>
            <span className="vl-status-dot text-success" />
          </div>
        </header>

        <div className="hidden lg:block absolute left-4 bottom-4 z-20">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-2.5 space-y-1.5">
            <div className="text-[10px] font-bold text-white/50 uppercase tracking-[0.08em] mb-1">
              Leyenda
            </div>
            <LegendItem color="#1E5EFF" label="Preguntó IA" />
            <LegendItem color="#00875A" label="Inició viaje" />
            <LegendItem color="#0A0A0A" label="Completó" border />
            <LegendItem color="#FF6B35" label="Incidente" />
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[400px] flex-1 lg:flex-none flex flex-col bg-text-primary border-t lg:border-t-0 lg:border-l border-white/[0.06] min-h-0">
        <div className="px-4 pt-4">
          <InsightRotator insights={insights} />
        </div>
        <div className="px-4 pt-3 pb-3 grid grid-cols-3 gap-2">
          <MetricCard
            label="Activos"
            value={metrics.activeUsers.value}
            delta={metrics.activeUsers.delta1m}
          />
          <MetricCard
            label="Viajes curso"
            value={metrics.activeTrips.value}
            delta={metrics.activeTrips.delta1m}
          />
          <MetricCard
            label="IA / min"
            value={metrics.aiPerMinute.value}
            delta={metrics.aiPerMinute.delta1m}
            format={(n) => n.toString()}
          />
        </div>
        <div className="flex-1 min-h-0 border-t border-white/[0.06]">
          <ActivityFeed feed={feed} />
        </div>
      </aside>
    </div>
  );
}

function LegendItem({
  color,
  label,
  border = false,
}: {
  color: string;
  label: string;
  border?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2.5 h-2.5 rounded-full"
        style={{
          backgroundColor: color,
          border: border ? '1px solid rgba(255,255,255,0.4)' : 'none',
        }}
      />
      <span className="text-[11px] text-white/80 font-medium">{label}</span>
    </div>
  );
}
