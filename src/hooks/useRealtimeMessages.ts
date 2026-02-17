import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types/message';

export function useRealtimeMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (!isMounted) return;
      setMessages((data as Message[]) ?? []);
    };

    fetchMessages();

    const channel = (supabase as any)
      .channel?.('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, []);

  return { messages };
}

