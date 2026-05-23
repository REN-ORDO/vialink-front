type Props = { lines?: number };

export default function SkeletonCard({ lines = 2 }: Props) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-card border border-black/[0.06]">
      <div className="w-12 h-9 rounded-full bg-surface-raised animate-pulse" />
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-surface-raised animate-pulse"
            style={{ width: i === 0 ? '70%' : '45%' }}
          />
        ))}
      </div>
      <div className="w-14 h-7 rounded-full bg-surface-raised animate-pulse" />
    </div>
  );
}
