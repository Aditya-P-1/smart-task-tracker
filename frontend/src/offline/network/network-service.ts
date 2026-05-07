import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

type NetworkSnapshot = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOnline: boolean;
};

const listeners = new Set<(snapshot: NetworkSnapshot) => void>();

let networkSnapshot: NetworkSnapshot = {
  isConnected: false,
  isInternetReachable: false,
  isOnline: false,
};

function mapStateToSnapshot(state: NetInfoState): NetworkSnapshot {
  const isConnected = Boolean(state.isConnected);
  const isInternetReachable = state.isInternetReachable ?? isConnected;

  return {
    isConnected,
    isInternetReachable,
    isOnline: isConnected && isInternetReachable,
  };
}

function updateNetworkSnapshot(nextSnapshot: NetworkSnapshot) {
  networkSnapshot = nextSnapshot;
  listeners.forEach((listener) => {
    listener(networkSnapshot);
  });
}

export function getNetworkSnapshot() {
  return networkSnapshot;
}

export function isNetworkOnline() {
  return networkSnapshot.isOnline;
}

export function subscribeToNetworkStatus(listener: (snapshot: NetworkSnapshot) => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function refreshNetworkSnapshot() {
  const state = await NetInfo.fetch();
  const nextSnapshot = mapStateToSnapshot(state);
  updateNetworkSnapshot(nextSnapshot);
  return nextSnapshot;
}

export function startNetworkStatusListener() {
  return NetInfo.addEventListener((state) => {
    updateNetworkSnapshot(mapStateToSnapshot(state));
  });
}
