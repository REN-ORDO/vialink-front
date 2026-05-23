import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ChatMessage, { TypingIndicator } from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import { getSuggestions, mockAskAssistant } from '../lib/llmMock';
import type { ChatMessage as ChatMessageT } from '../types';

export default function AsistentePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageT[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, typing]);

  async function send(text: string) {
    const user: ChatMessageT = {
      id: `m_${Date.now()}_u`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, user]);
    setTyping(true);
    try {
      const reply = await mockAskAssistant(text);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setTyping(false);
    }
  }

  const empty = messages.length === 0;
  const suggestions = getSuggestions();

  return (
    <div className="flex-1 flex flex-col bg-surface-raised min-h-0">
      <header className="bg-white border-b border-black/[0.04]">
        <div className="flex items-center gap-2 px-2 pt-[max(10px,env(safe-area-inset-top))] pb-2.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="cursor-pointer w-10 h-10 rounded-full flex items-center justify-center active:bg-surface-raised transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-text-primary" strokeWidth={2.4} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
            </div>
            <div>
              <div className="text-[14.5px] font-bold text-text-primary leading-tight vl-headline">
                Asistente Vialink
              </div>
              <div className="vl-eyebrow text-success leading-tight mt-0.5">
                Conectado
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-3"
      >
        {empty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pt-4"
          >
            <div className="pb-6">
              <div className="vl-eyebrow text-text-secondary">
                Asistente IA
              </div>
              <h2 className="text-[28px] font-bold text-text-primary vl-display leading-[1.1] mt-1.5">
                Pregúntame cómo
                <br />
                moverte en BAQ<span className="text-brand">.</span>
              </h2>
              <p className="text-[14px] text-text-secondary mt-3 leading-snug max-w-[300px]">
                Conozco las rutas, frecuencias y atajos de la ciudad. En
                español natural, sin códigos raros.
              </p>
            </div>

            <div className="vl-eyebrow text-text-secondary mb-2.5 pl-1">
              Prueba con
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, idx) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 + idx * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => send(s)}
                  className="cursor-pointer group w-full text-left bg-white border border-black/[0.05] rounded-[14px] px-4 py-3.5 active:bg-surface-raised transition-colors vl-elev-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-brand" strokeWidth={2.4} />
                    </span>
                    <span className="flex-1 text-[14px] text-text-primary leading-snug">
                      {s}
                    </span>
                    <span className="vl-eyebrow text-brand opacity-0 group-active:opacity-100 transition-opacity">
                      Enviar
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {typing && <TypingIndicator />}
      </main>

      <ChatInput onSend={send} disabled={typing} />
    </div>
  );
}
