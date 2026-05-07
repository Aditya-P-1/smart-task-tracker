import { useEffect } from 'react';

export function usePersistedQueryData<TData>(
  userId: string | null,
  data: TData | undefined,
  persist: (userId: string, data: TData) => void,
) {
  useEffect(() => {
    if (!userId || typeof data === 'undefined') {
      return;
    }

    persist(userId, data);
  }, [data, persist, userId]);
}
