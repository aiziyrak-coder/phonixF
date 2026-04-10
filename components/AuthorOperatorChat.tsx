import React, { useState, useEffect, useRef, useCallback } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { apiService } from '../services/apiService';
import { toast } from 'react-toastify';
import { MessageSquare, Send } from 'lucide-react';

export interface OperatorChatMessage {
  id: string;
  body: string;
  created_at: string;
  display_name: string;
  is_from_author: boolean;
}

const POLL_MS = 5000;

interface AuthorOperatorChatProps {
  articleId: string;
  viewerIsAuthor: boolean;
  authorDisplayName?: string;
}

/**
 * Har bir maqola uchun alohida thread. Muallif xabarlari ism-familya bilan;
 * operator javoblari muallifga «Operator» nomi bilan chiqadi (backend serializer).
 */
const AuthorOperatorChat: React.FC<AuthorOperatorChatProps> = ({
  articleId,
  viewerIsAuthor,
  authorDisplayName,
}) => {
  const [messages, setMessages] = useState<OperatorChatMessage[]>([]);
  const [text, setText] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        const data = await apiService.articles.getOperatorChatMessages(articleId);
        const list = Array.isArray(data) ? data : [];
        setMessages(list as OperatorChatMessage[]);
      } catch {
        if (!opts?.silent) {
          toast.error('Chat xabarlarini yuklashda xatolik.');
        }
      } finally {
        setInitialLoading(false);
      }
    },
    [articleId]
  );

  useEffect(() => {
    setInitialLoading(true);
    load();
  }, [articleId, load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      load({ silent: true });
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const b = text.trim();
    if (!b || sending) return;
    setSending(true);
    try {
      await apiService.articles.sendOperatorChatMessage(articleId, b);
      setText('');
      await load({ silent: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Yuborishda xatolik.';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const isOwn = (msg: OperatorChatMessage) =>
    viewerIsAuthor ? msg.is_from_author : !msg.is_from_author;

  const title = viewerIsAuthor ? 'Operatorlar bilan yozishma' : 'Muallif bilan chat';
  const hint = viewerIsAuthor
    ? 'Xabaringiz barcha faol operatorlarga yetadi. Javoblar «Operator» nomidan ko‘rinadi.'
    : `Muallif: ${authorDisplayName || '—'}. Barcha operatorlar ushbu yozishmani ko‘ra oladi; javoblar muallifga umumiy «Operator» sifatida chiqadi.`;

  return (
    <Card title={title}>
      <p className="text-sm text-gray-400 mb-4 flex items-start gap-2">
        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-blue-400" />
        {hint}
      </p>

      <div className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-1">
        {initialLoading ? (
          <p className="text-center text-gray-500 py-6 text-sm">Yuklanmoqda...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 py-6 text-sm">Hozircha xabar yo‘q. Birinchi xabarni yozing.</p>
        ) : (
          messages.map((msg) => {
            const own = isOwn(msg);
            return (
              <div
                key={msg.id}
                className={`flex ${own ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                    own
                      ? 'bg-blue-600/90 text-white rounded-br-md'
                      : 'bg-white/10 text-gray-100 rounded-bl-md border border-white/10'
                  }`}
                >
                  <div className="text-xs font-semibold opacity-90 mb-1">{msg.display_name}</div>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                  <div className={`text-[10px] mt-1.5 ${own ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(msg.created_at).toLocaleString('uz-UZ')}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Xabar yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
          rows={3}
          className="flex-1 rounded-xl bg-gray-900/80 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
          maxLength={10000}
        />
        <Button
          type="button"
          onClick={() => void send()}
          disabled={sending || !text.trim()}
          className="sm:self-end shrink-0 flex items-center justify-center gap-2"
          variant="primary"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Yuborilmoqda...' : 'Yuborish'}
        </Button>
      </div>
    </Card>
  );
};

export default AuthorOperatorChat;
