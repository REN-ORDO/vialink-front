import { ChevronRight } from 'lucide-react';
import type { Ruta } from '../../types';
import TimeBadge from './TimeBadge';

const estadoLabel: Record<Ruta['estado'], string> = {
  operando: 'Operando',
  frecuencia_baja: 'Frecuencia baja',
  ultimo_bus: 'Último bus',
};

const estadoColor: Record<Ruta['estado'], string> = {
  operando: 'text-success',
  frecuencia_baja: 'text-warning',
  ultimo_bus: 'text-accent',
};

type Props = {
  ruta: Ruta;
  onClick?: () => void;
  showChevron?: boolean;
};

export default function RouteCard({ ruta, onClick, showChevron = false }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-card border border-black/[0.06] active:bg-surface-raised transition-colors text-left"
    >
      <span className="inline-flex items-center justify-center min-w-[48px] h-9 px-2.5 rounded-full bg-brand text-white text-sm font-bold tabular-nums">
        {ruta.nombre}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-text-primary truncate">
          {ruta.destino}
        </div>
        <div className={`text-xs ${estadoColor[ruta.estado]} mt-0.5`}>
          {estadoLabel[ruta.estado]}
        </div>
      </div>
      <TimeBadge
        etaMinutos={ruta.etaMinutos}
        ultimoBus={ruta.estado === 'ultimo_bus'}
        size="md"
      />
      {showChevron && <ChevronRight className="w-4 h-4 text-text-secondary" />}
    </button>
  );
}
