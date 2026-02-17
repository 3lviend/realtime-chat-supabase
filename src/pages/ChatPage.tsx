import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to be ready, then redirect if not authenticated
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Only set up realtime if user is authenticated
    if (!user) return;

    let mounted = true;

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        setLoading(false);
        console.error('Failed to load messages', error);
      } else if (mounted) {
        setLoading(false);
        setMessages(data ?? []);
      }
    }

    loadMessages();

    const channel = supabase
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
      .subscribe();

    return () => {
      mounted = false;
      try {
        (channel as any).unsubscribe();
      } catch (e) {
        // ignore unsubscribe errors during unmount
      }
    };
  }, [user]);

  async function handleSend(content: string) {
    const payload = { content, user_id: user?.id ?? null };
    const { error } = await supabase.from('messages').insert([payload]);
    if (error) {
      console.error('Failed to send message', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h2>Chat</h2>
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}

