type Props = {
  etaMinutos: number;
  ultimoBus?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

function colorFor(eta: number, ultimoBus: boolean): string {
  if (ultimoBus) return 'bg-accent text-white';
  if (eta <= 5) return 'bg-success text-white';
  if (eta <= 15) return 'bg-brand text-white';
  if (eta <= 30) return 'bg-warning text-white';
  return 'bg-text-secondary text-white';
}

const sizeMap = {
  sm: 'text-xs px-2 h-6 min-w-[44px]',
  md: 'text-sm px-2.5 h-7 min-w-[52px]',
  lg: 'text-base px-3 h-9 min-w-[64px] font-bold',
};

export default function TimeBadge({ etaMinutos, ultimoBus = false, size = 'md' }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold tabular-nums ${sizeMap[size]} ${colorFor(etaMinutos, ultimoBus)}`}
    >
      {etaMinutos} min
    </span>
  );
}
