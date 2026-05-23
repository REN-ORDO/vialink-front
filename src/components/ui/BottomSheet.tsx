import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type SnapKey = 'collapsed' | 'half' | 'full';

type Props = {
  children: ReactNode;
  initial?: SnapKey;
  collapsedHeight?: number;
  halfHeight?: number;
};

export default function BottomSheet({
  children,
  initial = 'half',
  collapsedHeight = 120,
  halfHeight,
}: Props) {
  const [viewportH, setViewportH] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight,
  );

  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fullTop = 80;
  const halfTop = halfHeight ? viewportH - halfHeight : Math.round(viewportH * 0.5);
  const collapsedTop = viewportH - collapsedHeight;

  const snaps: Record<SnapKey, number> = {
    full: fullTop,
    half: halfTop,
    collapsed: collapsedTop,
  };

  const y = useMotionValue(snaps[initial]);
  const currentSnap = useRef<SnapKey>(initial);

  useEffect(() => {
    y.set(snaps[currentSnap.current]);
  }, [viewportH]);

  function nearestSnap(target: number, velocity: number): SnapKey {
    const projected = target + velocity * 0.2;
    const entries = Object.entries(snaps) as [SnapKey, number][];
    let best: SnapKey = 'half';
    let bestDist = Infinity;
    for (const [key, val] of entries) {
      const d = Math.abs(val - projected);
      if (d < bestDist) {
        bestDist = d;
        best = key;
      }
    }
    return best;
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: fullTop, bottom: collapsedTop }}
      dragElastic={0.05}
      dragMomentum={false}
      style={{ y, height: viewportH - fullTop }}
      onDragEnd={(_, info) => {
        const snap = nearestSnap(y.get(), info.velocity.y);
        currentSnap.current = snap;
        animate(y, snaps[snap], { type: 'spring', stiffness: 380, damping: 38 });
      }}
      className="absolute left-0 right-0 top-0 z-20 bg-white rounded-t-[20px] shadow-[0_-8px_28px_rgba(10,10,10,0.12)] touch-none"
    >
      <div className="flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing">
        <div className="w-9 h-1.5 rounded-full bg-black/15" />
      </div>
      <div className="overflow-y-auto h-[calc(100%-28px)] overscroll-contain touch-pan-y">
        {children}
      </div>
    </motion.div>
  );
}
