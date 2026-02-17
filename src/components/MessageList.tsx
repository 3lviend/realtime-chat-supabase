import { useEffect, useMemo, useRef } from 'react';
import type { Message } from '../types/message';
import TypingIndicator from './TypingIndicator';

type MessageListProps = {
  messages: Message[];
  currentUserId?: string | null;
  loading?: boolean;
  showTyping?: boolean;
  typingLabel?: string;
};

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageList({
  messages,
  currentUserId,
  loading = false,
  showTyping = false,
  typingLabel = 'Someone is typing',
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  const skeletonRows = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      key: `sk-${i}`,
      me: i % 3 === 0,
      width: `${56 + ((i * 11) % 30)}%`,
    }));
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom on new messages / typing indicator changes
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, showTyping]);

  return (
    <div className="chatScroller">
      {loading ? (
        <ul className="messages" aria-label="Loading messages">
          {skeletonRows.map((r) => (
            <li key={r.key} className={`row ${r.me ? 'rowMe' : ''}`}>
              <div className={`bubble ${r.me ? 'bubbleMe' : ''} skeleton`} style={{ width: r.width }}>
                &nbsp;
              </div>
            </li>
          ))}
        </ul>
      ) : messages.length === 0 ? (
        <div className="emptyState" role="status" aria-live="polite">
          <div>
            <strong>No messages yet.</strong>
            <div className="subtle" style={{ marginTop: 6 }}>
              Say hello to start the conversation.
            </div>
          </div>
        </div>
      ) : (
        <ul className="messages" aria-label="Messages">
          {messages.map((m) => {
            const isMe = !!currentUserId && m.user_id === currentUserId;
            const time = formatTime(m.created_at);
            return (
              <li key={String(m.id)} className={`row ${isMe ? 'rowMe' : ''}`}>
                <div className={`bubble ${isMe ? 'bubbleMe' : ''}`}>
                  {m.content}
                  {time ? <div className="meta">{time}</div> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showTyping ? (
        <div style={{ marginTop: 10 }}>
          <TypingIndicator label={typingLabel} />
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}

