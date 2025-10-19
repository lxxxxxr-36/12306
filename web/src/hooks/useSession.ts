import { useEffect, useState } from 'react';
import { getSession } from '../services/auth';

export function useSession(){
  const [username, setUsername] = useState<string | null>(() => getSession()?.username ?? null);

  useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ username: string | null }>;
      setUsername(evt.detail?.username ?? getSession()?.username ?? null);
    };
    window.addEventListener('sessionchange', handler as EventListener);
    // 同步不同标签页的变化
    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === 'session') {
        setUsername(getSession()?.username ?? null);
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('sessionchange', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  return { username };
}