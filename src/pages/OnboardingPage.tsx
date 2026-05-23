import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Plus,
  Share,
  X,
  Download,
  Sparkles,
  Clock,
  Bus,
  Radar,
} from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const ONBOARDED_KEY = 'vl-onboarded';

export function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* storage bloqueado */
  }
}

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 360 240"
      className="w-full h-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="vl-grid-ob" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0 L0 0 0 24" fill="none" stroke="#0A0A0A" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
        <path
          id="vl-route-main"
          d="M -10 80 C 60 80, 90 140, 160 140 S 280 80, 380 80"
        />
      </defs>

      <rect width="360" height="240" fill="#F7F8FA" />
      <rect width="360" height="240" fill="url(#vl-grid-ob)" />

      <use
        href="#vl-route-main"
        stroke="#0A0A0A"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        opacity="0.12"
      />
      <use
        href="#vl-route-main"
        stroke="#1E5EFF"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M -10 170 C 80 170, 110 110, 200 110 S 320 200, 380 200"
        stroke="#1E5EFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 6"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M 40 -10 C 40 60, 110 80, 110 160 S 220 240, 220 260"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 8"
        fill="none"
        opacity="0.14"
      />

      <g>
        <circle cx="58" cy="92" r="5" fill="#fff" stroke="#1E5EFF" strokeWidth="3" />
        <circle cx="160" cy="140" r="5" fill="#fff" stroke="#1E5EFF" strokeWidth="3" />
        <circle cx="262" cy="98" r="5" fill="#fff" stroke="#1E5EFF" strokeWidth="3" />
        <circle cx="110" cy="160" r="4" fill="#fff" stroke="#1E5EFF" strokeWidth="2.5" opacity="0.7" />
        <circle cx="300" cy="180" r="4" fill="#fff" stroke="#1E5EFF" strokeWidth="2.5" opacity="0.7" />
      </g>

      <g transform="translate(218 150)">
        <rect width="48" height="22" rx="11" fill="#0A0A0A" />
        <text
          x="24"
          y="15"
          textAnchor="middle"
          fill="#fff"
          fontFamily="-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif"
          fontSize="11"
          fontWeight="700"
        >
          A8
        </text>
      </g>

      <g>
        <g transform="translate(-30,-12)">
          <rect width="60" height="24" rx="12" fill="#1E5EFF" />
          <text
            x="30"
            y="16"
            textAnchor="middle"
            fill="#fff"
            fontFamily="-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif"
            fontSize="12"
            fontWeight="700"
            letterSpacing="0.2"
          >
            C12
          </text>
        </g>
        <animateMotion dur="7s" repeatCount="indefinite" rotate="0" keyPoints="0;1" keyTimes="0;1">
          <mpath href="#vl-route-main" />
        </animateMotion>
      </g>

      <g transform="translate(36 36)">
        <circle r="4" fill="#FF6B35" />
        <circle r="9" fill="none" stroke="#FF6B35" strokeWidth="2" opacity="0.4">
          <animate attributeName="r" values="4;14;4" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-start">
      <div className="text-[26px] font-bold text-text-primary tabular leading-none vl-display">
        {value}
      </div>
      <div className="vl-eyebrow text-text-secondary mt-1.5">{label}</div>
    </div>
  );
}

function toneForEta(eta: number): 'success' | 'brand' | 'warning' {
  if (eta <= 5) return 'success';
  if (eta <= 15) return 'brand';
  return 'warning';
}

const COLOR_MAP = {
  success: 'text-success',
  brand: 'text-brand',
  warning: 'text-warning',
} as const;

function LiveParaderoPreview() {
  const [etas, setEtas] = useState({ c12: 3, a8: 9, r46: 22 });

  useEffect(() => {
    const id = setInterval(() => {
      setEtas((prev) => ({
        c12: prev.c12 <= 1 ? 5 : prev.c12 - 1,
        a8: prev.a8 <= 1 ? 11 : prev.a8 - 1,
        r46: prev.r46 <= 1 ? 24 : prev.r46 - 1,
      }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-[18px] bg-white border border-black/[0.05] overflow-hidden vl-elev-1">
      <div className="px-4 pt-3.5 pb-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="vl-eyebrow text-text-secondary">Paradero</div>
          <div className="text-[16px] font-bold text-text-primary truncate vl-headline mt-0.5">
            Buenavista
          </div>
          <div className="text-[12px] text-text-secondary truncate mt-0.5">
            Cra. 53 con Cl. 100
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-success vl-eyebrow shrink-0">
          <span className="vl-status-dot text-success" />
          <span className="pl-1.5">Live</span>
        </div>
      </div>
      <RouteLine eta={etas.c12} rutaNombre="C12" destino="Centro Histórico" />
      <RouteLine eta={etas.a8} rutaNombre="A8" destino="Universidad del Norte" />
      <RouteLine eta={etas.r46} rutaNombre="46" destino="Soledad" />
    </div>
  );
}

function RouteLine({
  eta,
  rutaNombre,
  destino,
}: {
  eta: number;
  rutaNombre: string;
  destino: string;
}) {
  const tone = toneForEta(eta);
  return (
    <div className="border-t border-black/[0.05] px-4 py-3 flex items-center gap-3.5">
      <div className="shrink-0 flex flex-col items-center w-10">
        <div className={`relative h-[24px] overflow-hidden`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={eta}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={`text-[22px] font-bold tabular leading-none vl-display ${COLOR_MAP[tone]}`}
            >
              {eta}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="text-[9.5px] font-semibold text-text-secondary mt-0.5 tracking-wide">
          MIN
        </div>
      </div>
      <div className="w-px self-stretch bg-black/[0.06]" />
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="inline-flex items-center justify-center min-w-[40px] h-6 px-2 rounded-full bg-text-primary text-white text-[11.5px] font-bold tabular tracking-wide">
          {rutaNombre}
        </span>
        <span className="text-[13.5px] font-semibold text-text-primary truncate vl-headline">
          {destino}
        </span>
      </div>
    </div>
  );
}

function AssistantTeaser() {
  return (
    <div className="rounded-[18px] bg-text-primary text-white p-4 relative overflow-hidden vl-elev-2">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-brand/30 blur-3xl pointer-events-none" />
      <div className="relative flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 vl-eyebrow text-white/60">
          <Sparkles className="w-3 h-3 text-brand" strokeWidth={2.6} />
          Asistente IA
        </div>
        <div className="inline-flex items-center gap-1.5 text-success vl-eyebrow">
          <span className="vl-status-dot text-success" />
          <span className="pl-1.5">Conectado</span>
        </div>
      </div>
      <div className="relative space-y-2.5">
        <div className="flex justify-end">
          <div className="max-w-[78%] bg-white text-text-primary rounded-[16px] rounded-br-md px-3.5 py-2 text-[13.5px] leading-snug font-medium">
            voy de afán al Centro
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[88%] bg-white/[0.08] border border-white/[0.06] rounded-[16px] rounded-tl-md px-3.5 py-2 text-[13.5px] leading-snug">
            Toma la <span className="font-bold text-white">C12</span> desde
            Buenavista. Te deja en 18 min, es la más directa.
          </div>
        </div>
      </div>
    </div>
  );
}

function IOSInstructions({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-[28px] px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))]"
      >
        <div className="flex justify-center pb-3">
          <div className="w-10 h-1.5 rounded-full bg-black/15" />
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="vl-eyebrow text-text-secondary">3 pasos</div>
            <div className="text-[22px] font-bold text-text-primary vl-display leading-tight mt-1">
              Instalar en iPhone
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer w-9 h-9 rounded-full bg-surface-raised flex items-center justify-center active:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4 text-text-primary" strokeWidth={2.4} />
          </button>
        </div>

        <ol className="mt-5 space-y-4">
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-text-primary text-white text-[13px] font-bold flex items-center justify-center shrink-0 tabular">
              1
            </span>
            <div className="text-[14px] text-text-primary flex-1 pt-0.5 leading-snug">
              Toca{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-raised border border-black/[0.08] mx-0.5 align-middle">
                <Share className="w-3.5 h-3.5 text-brand" strokeWidth={2.4} />
                <span className="text-[12px] font-semibold">Compartir</span>
              </span>{' '}
              en Safari.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-text-primary text-white text-[13px] font-bold flex items-center justify-center shrink-0 tabular">
              2
            </span>
            <div className="text-[14px] text-text-primary flex-1 pt-0.5 leading-snug">
              Selecciona{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-raised border border-black/[0.08] mx-0.5 align-middle">
                <Plus className="w-3.5 h-3.5 text-brand" strokeWidth={2.4} />
                <span className="text-[12px] font-semibold">Agregar a inicio</span>
              </span>
              .
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-text-primary text-white text-[13px] font-bold flex items-center justify-center shrink-0 tabular">
              3
            </span>
            <div className="text-[14px] text-text-primary flex-1 pt-0.5 leading-snug">
              Toca <strong>Agregar</strong>. Vialink aparecerá como app en tu
              pantalla de inicio.
            </div>
          </li>
        </ol>

        <button
          onClick={onClose}
          className="cursor-pointer w-full h-12 mt-6 rounded-full bg-text-primary text-white font-semibold active:scale-[0.99] transition-transform"
        >
          Entendido
        </button>
      </motion.div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2.5">
      <div className="vl-eyebrow text-text-secondary">{children}</div>
      <div className="flex-1 h-px bg-black/[0.06]" />
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { canPrompt, platform, installed, promptInstall } = useInstallPrompt();
  const [showIOS, setShowIOS] = useState(false);

  function enter() {
    markOnboarded();
    navigate('/', { replace: true });
  }

  async function install() {
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') markOnboarded();
      return;
    }
    setShowIOS(true);
  }

  const showInstallButton = !installed;
  const installLabel =
    platform === 'ios'
      ? 'Agregar al inicio de iPhone'
      : 'Agregar a pantalla de inicio';

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
          className="flex flex-col"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[260px] shrink-0 border-b border-black/[0.06]"
          >
            <HeroIllustration />
            <div className="absolute top-[max(16px,env(safe-area-inset-top))] left-5">
              <div className="inline-flex items-center gap-2 bg-white border border-black/[0.05] rounded-full pl-2.5 pr-3 py-1.5 vl-elev-2">
                <span className="vl-status-dot text-success" />
                <span className="pl-1.5 text-[12px] font-bold text-text-primary vl-headline">
                  Barranquilla · En vivo
                </span>
              </div>
            </div>
          </motion.div>

          <div className="px-6 pt-7 pb-4">
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="vl-eyebrow text-text-secondary mb-2"
            >
              Paradero virtual · Barranquilla
            </motion.div>
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[44px] leading-[0.98] font-bold text-text-primary vl-display"
            >
              Sabe qué bus
              <br />
              tomar<span className="text-brand">.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[15.5px] text-text-secondary mt-3 leading-[1.45] max-w-[340px]"
            >
              Paraderos en tiempo real, llegadas confiables y un asistente que
              entiende cómo se mueve la gente en Barranquilla.
            </motion.p>
          </div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-5 mt-1 mb-7 rounded-[20px] bg-surface-raised px-5 py-4 flex items-stretch gap-5"
          >
            <StatCell value="47" label="Rutas" />
            <div className="w-px bg-black/[0.08]" />
            <StatCell value="2.1k" label="Paraderos" />
            <div className="w-px bg-black/[0.08]" />
            <StatCell value="6 min" label="Espera" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 mb-6"
          >
            <SectionLabel>Llegadas ahora mismo</SectionLabel>
            <LiveParaderoPreview />
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 mb-6"
          >
            <SectionLabel>Pregúntale en lenguaje natural</SectionLabel>
            <AssistantTeaser />
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-5 mb-6 rounded-[18px] border border-black/[0.05] p-4 flex items-center gap-3 vl-elev-1"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-accent" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-text-primary leading-tight vl-headline">
                Nunca pierdas el último bus
              </div>
              <div className="text-[12.5px] text-text-secondary mt-0.5 leading-snug">
                Avisos en rojo cuando es el último de la noche por tu paradero.
              </div>
            </div>
            <Bus className="w-5 h-5 text-text-secondary/40 shrink-0" />
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 mb-8"
          >
            <div className="vl-eyebrow text-text-secondary">Bajo el capó</div>
            <div className="mt-1.5 text-[40px] leading-[0.98] font-bold text-text-primary vl-display tabular">
              1.2k<span className="text-brand">.</span>
            </div>
            <div className="text-[13.5px] text-text-secondary mt-1.5 leading-snug max-w-[300px]">
              Decisiones de ruta procesadas por minuto en Vialink. Cada bus, cada paradero, cada IA respondiendo en vivo.
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] bg-white border-t border-black/[0.05]"
      >
        <button
          onClick={enter}
          className="cursor-pointer w-full h-[58px] rounded-full bg-brand text-white text-[17px] font-semibold flex items-center justify-center gap-1.5 vl-elev-brand active:scale-[0.99] transition-transform"
        >
          Entrar a Vialink
          <ArrowUpRight className="w-[18px] h-[18px]" strokeWidth={2.6} />
        </button>

        <button
          onClick={() => {
            markOnboarded();
            navigate('/admin');
          }}
          className="cursor-pointer w-full h-12 mt-2.5 rounded-full bg-text-primary text-white text-[14.5px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <Radar className="w-[15px] h-[15px] text-brand" strokeWidth={2.6} />
          Ver simulador en vivo
          <span className="ml-1 inline-flex items-center gap-1 text-[10.5px] font-bold text-success vl-eyebrow">
            <span className="vl-status-dot text-success" />
            <span className="pl-1.5">500</span>
          </span>
        </button>

        {showInstallButton && (
          <button
            onClick={install}
            className="cursor-pointer w-full h-11 mt-2 rounded-full text-text-secondary text-[13.5px] font-semibold flex items-center justify-center gap-2 active:bg-surface-raised transition-colors"
          >
            <Download className="w-[14px] h-[14px] text-brand" strokeWidth={2.6} />
            {installLabel}
          </button>
        )}

        {installed && (
          <div className="text-center vl-eyebrow text-success mt-3">
            App instalada
          </div>
        )}

        <div className="text-center text-[11px] text-text-secondary/80 mt-3 tracking-tight">
          Hecho en Barranquilla
        </div>
      </motion.div>

      {showIOS && <IOSInstructions onClose={() => setShowIOS(false)} />}
    </div>
  );
}
