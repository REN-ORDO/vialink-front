import { useState, type FormEvent } from 'react';
import { ArrowUp } from 'lucide-react';

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  const hasText = value.trim().length > 0;

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-white border-t border-black/[0.05]"
    >
      <div className="flex-1 flex items-center bg-surface-raised rounded-full px-5 h-12 border border-black/[0.05]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Pregúntale al asistente"
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-text-secondary disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        aria-label="Enviar"
        disabled={!hasText || disabled}
        className="cursor-pointer w-12 h-12 rounded-full bg-text-primary text-white flex items-center justify-center active:scale-[0.95] transition-all shrink-0 disabled:opacity-30 disabled:active:scale-100"
      >
        <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.6} />
      </button>
    </form>
  );
}
