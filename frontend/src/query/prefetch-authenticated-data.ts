import { appQueryClient } from '../providers/query-provider';
import { getStoredAuthUser } from '../features/auth/storage/auth-session';
import { prefetchHabitList } from '../features/habits/query-cache';
import { prefetchTaskList } from '../features/tasks/query-cache';
import { isNetworkOnline } from '../offline/network/network-service';

export async function prefetchAuthenticatedData() {
  const currentUser = getStoredAuthUser();

  if (!currentUser?.id || !isNetworkOnline()) {
    return;
  }

  await Promise.allSettled([
    prefetchTaskList(appQueryClient, currentUser.id),
    prefetchHabitList(appQueryClient, currentUser.id),
  ]);
}
