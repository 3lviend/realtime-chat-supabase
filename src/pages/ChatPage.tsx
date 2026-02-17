import { useEffect, useMemo, useRef, useState } from 'react';
// @ts-ignore - dev: router dependency may not be installed in this environment
import { useNavigate } from 'react-router-dom';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Message } from '../types/message';

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const messagesChannelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const typingReadyRef = useRef(false);
  const lastTypingSentAtRef = useRef(0);
  const typingTimersRef = useRef<Record<string, number>>({});
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Wait for auth to be ready, then redirect if not authenticated
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    // Only set up realtime if user is authenticated
    if (!user) return;

    let mounted = true;
    setLoadingMessages(true);

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        setLoadingMessages(false);
        console.error('Failed to load messages', error);
      } else if (mounted) {
        setLoadingMessages(false);
        setMessages(data ?? []);
      }
    }

    loadMessages();

    // 1) Messages channel: postgres changes
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload: any) => {
          if (mounted) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe((status: string) => {
        // Useful for debugging; keeps noise low in prod
        if (status === 'CHANNEL_ERROR') console.error('Messages realtime channel error');
      });

    // 2) Typing channel: broadcast only
    const typingChannel = supabase
      .channel('typing:global', {
        config: { broadcast: { self: true } },
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        const typingUserId = payload?.user_id as string | undefined;
        if (!typingUserId) return;
        if (typingUserId === user.id) return;

        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.add(typingUserId);
          return next;
        });

        const existing = typingTimersRef.current[typingUserId];
        if (existing) window.clearTimeout(existing);
        typingTimersRef.current[typingUserId] = window.setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev);
            next.delete(typingUserId);
            return next;
          });
          delete typingTimersRef.current[typingUserId];
        }, 2500);
      })
      .subscribe((status: string) => {
        typingReadyRef.current = status === 'SUBSCRIBED';
        if (status === 'CHANNEL_ERROR') console.error('Typing realtime channel error');
      });

    messagesChannelRef.current = messagesChannel;
    typingChannelRef.current = typingChannel;

    return () => {
      mounted = false;
      for (const id of Object.keys(typingTimersRef.current)) {
        window.clearTimeout(typingTimersRef.current[id]);
      }
      typingTimersRef.current = {};
      setTypingUserIds(new Set());
      typingReadyRef.current = false;
      messagesChannelRef.current = null;
      typingChannelRef.current = null;

      // IMPORTANT: in React 19 dev/StrictMode, effects mount/unmount rapidly.
      // Using `unsubscribe()` avoids the "WebSocket closed before established" flakiness we saw with removeChannel().
      try {
        messagesChannel.unsubscribe();
      } catch {
        // ignore
      }
      try {
        typingChannel.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, [user?.id]);

  async function handleSend(content: string) {
    if (!user) return;
    setSendError('');
    setSending(true);
    const payload = { content, user_id: user?.id ?? null };
    const { error } = await supabase.from('messages').insert([payload]);
    if (error) {
      setSendError(error.message);
      console.error('Failed to send message', error);
    }
    setSending(false);
  }

  const someoneTypingLabel = useMemo(() => {
    if (typingUserIds.size === 0) return '';
    return typingUserIds.size === 1 ? 'Someone is typing' : 'Multiple people are typing';
  }, [typingUserIds]);

  function handleTyping() {
    if (!user) return;
    const now = Date.now();
    if (now - lastTypingSentAtRef.current < 800) return;
    lastTypingSentAtRef.current = now;
    if (!typingReadyRef.current) return;
    try {
      typingChannelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: user.id },
      });
    } catch {
      // ignore send errors (channel may be reconnecting)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }

  return (
    <div className="page">
      <div className="surface">
        <div className="chatShell">
          <header className="chatHeader">
            <div className="chatHeaderTitle">
              <strong>Chat</strong>
              <span>{user?.email ?? '…'}</span>
            </div>
            <button onClick={handleSignOut} disabled={!user}>
              Sign out
            </button>
          </header>

          <MessageList
            messages={messages}
            currentUserId={user?.id ?? null}
            loading={authLoading || loadingMessages}
            showTyping={typingUserIds.size > 0}
            typingLabel={someoneTypingLabel}
          />

          <div className="composer">
            {sendError ? (
              <div className="subtle" style={{ color: 'rgba(248, 113, 113, 0.95)', marginBottom: 8 }}>
                {sendError}
              </div>
            ) : null}
            <MessageInput onSend={handleSend} onTyping={handleTyping} disabled={!user || authLoading || loadingMessages || sending} />
            <div className="subtle" style={{ marginTop: 8 }}>
              Enter to send • Shift+Enter for a new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

