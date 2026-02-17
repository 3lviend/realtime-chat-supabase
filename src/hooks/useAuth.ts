import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const session = (supabase as any).auth?.session?.();
    setUser(session?.user ?? null);

    const listener = (supabase as any).auth?.onAuthStateChange?.((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    };
  }, []);

  return { user };
}

