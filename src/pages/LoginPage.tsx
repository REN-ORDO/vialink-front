import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
} from 'lucide-react';
import { dataSource } from '../lib/dataSource';
import { setAuthTokens, ApiError } from '../lib/api';

type LocationState = { from?: { pathname: string } };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as LocationState | null)?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');
    try {
      const { tokens } = await dataSource.login({ email: email.trim(), password });
      setAuthTokens(tokens);
      navigate(fromPath ?? '/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401 || err.status === 400
            ? 'Correo o contraseña incorrectos'
            : err.message,
        );
      } else {
        setError('No se pudo conectar al servidor');
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0">
      <div className="flex-1 flex flex-col px-6 pt-[max(48px,env(safe-area-inset-top))] pb-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start"
        >
          <div className="w-14 h-14 rounded-2xl bg-text-primary flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-white" strokeWidth={2.4} />
          </div>
          <div className="vl-eyebrow text-text-secondary">Vialink · Acceso</div>
          <h1 className="text-[34px] leading-[1.02] font-bold text-text-primary vl-display mt-1.5">
            Inicia sesión<span className="text-brand">.</span>
          </h1>
          <p className="text-[15px] text-text-secondary mt-2.5 leading-snug max-w-[320px]">
            Conecta tu cuenta para preguntarle al asistente y guardar tus viajes.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={submit}
          className="mt-8 space-y-3"
        >
          <label className="block">
            <span className="vl-eyebrow text-text-secondary block mb-1.5">
              Correo
            </span>
            <div className="flex items-center gap-2.5 h-14 bg-surface-raised rounded-2xl px-4 border border-black/[0.06] focus-within:border-brand/40 focus-within:bg-white transition-colors">
              <Mail className="w-[18px] h-[18px] text-text-secondary shrink-0" strokeWidth={2.2} />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 bg-transparent outline-none text-[15.5px] text-text-primary placeholder:text-text-secondary/70 vl-headline"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="vl-eyebrow text-text-secondary block mb-1.5">
              Contraseña
            </span>
            <div className="flex items-center gap-2.5 h-14 bg-surface-raised rounded-2xl px-4 border border-black/[0.06] focus-within:border-brand/40 focus-within:bg-white transition-colors">
              <Lock className="w-[18px] h-[18px] text-text-secondary shrink-0" strokeWidth={2.2} />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="flex-1 bg-transparent outline-none text-[15.5px] text-text-primary placeholder:text-text-secondary/70 tracking-wider"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="cursor-pointer text-text-secondary p-1 rounded-md active:bg-black/5"
              >
                {showPassword ? (
                  <EyeOff className="w-[18px] h-[18px]" strokeWidth={2.2} />
                ) : (
                  <Eye className="w-[18px] h-[18px]" strokeWidth={2.2} />
                )}
              </button>
            </div>
          </label>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] text-danger font-semibold pl-1"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </motion.form>

        <div className="flex-1" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] bg-white border-t border-black/[0.05]"
      >
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="cursor-pointer w-full h-[58px] rounded-full bg-brand text-white text-[17px] font-semibold flex items-center justify-center gap-1.5 vl-elev-brand active:scale-[0.99] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Entrando…
            </span>
          ) : (
            <>
              Entrar
              <ArrowUpRight className="w-[18px] h-[18px]" strokeWidth={2.6} />
            </>
          )}
        </button>

        <div className="text-center text-[12px] text-text-secondary mt-3 leading-tight">
          Si no tienes cuenta, pídele a tu equipo que te dé acceso.
        </div>
      </motion.div>
    </div>
  );
}
