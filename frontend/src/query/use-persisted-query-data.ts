import { useEffect, useRef } from 'react';

export function usePersistedQueryData<TData>(
  userId: string | null,
  data: TData | undefined,
  persist: (userId: string, data: TData) => void,
  createSnapshot?: (data: TData) => unknown,
) {
  const lastSnapshotRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || typeof data === 'undefined') {
      lastSnapshotRef.current = null;
      lastUserIdRef.current = userId;
      return;
    }

    const snapshot = JSON.stringify(
      typeof createSnapshot === 'function' ? createSnapshot(data) : data,
    );

    if (lastUserIdRef.current === userId && lastSnapshotRef.current === snapshot) {
      return;
    }

    persist(userId, data);
    lastSnapshotRef.current = snapshot;
    lastUserIdRef.current = userId;
  }, [createSnapshot, data, persist, userId]);
}
