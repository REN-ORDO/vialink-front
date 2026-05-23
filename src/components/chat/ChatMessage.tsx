import { Sparkles } from 'lucide-react';
import type { ChatMessage as ChatMessageT } from '../../types';
import SuggestedActionCard from './SuggestedActionCard';
import RouteRecommendationCard from './RouteRecommendationCard';

type Props = { message: ChatMessageT };

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] bg-text-primary text-white rounded-[20px] rounded-br-md px-4 py-2.5 text-[15px] leading-snug">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-8 h-8 rounded-full bg-text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="bg-white border border-black/[0.05] rounded-[20px] rounded-tl-md px-4 py-2.5 text-[15px] leading-snug text-text-primary vl-elev-1">
          {message.content}
        </div>
        {message.suggestedAction ? (
          <SuggestedActionCard
            action={message.suggestedAction}
            recommendation={message.recommendation}
          />
        ) : message.recommendation ? (
          <RouteRecommendationCard recommendation={message.recommendation} />
        ) : null}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-8 h-8 rounded-full bg-text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="bg-white border border-black/[0.05] rounded-[20px] rounded-tl-md px-4 py-3 flex gap-1.5 vl-elev-1">
        <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-pulse" />
        <span
          className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-pulse"
          style={{ animationDelay: '160ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-text-secondary/60 animate-pulse"
          style={{ animationDelay: '320ms' }}
        />
      </div>
    </div>
  );
}
