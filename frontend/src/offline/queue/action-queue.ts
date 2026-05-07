import type { OfflineAction, OfflineQueueState, EnqueueOfflineActionResult } from '../types';
import { getOfflineQueueState, updateOfflineQueueState } from './queue-storage';

function isSameTargetAction(action: OfflineAction, targetId: string) {
  return action.targetId === targetId;
}

function createQueueActionId() {
  return `queue:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function assertNever(value: never) {
  throw new Error(`Unsupported offline action: ${JSON.stringify(value)}`);
}

function resetActionRetryState<TAction extends OfflineAction>(action: TAction): TAction {
  return {
    ...action,
    attemptCount: 0,
    lastErrorMessage: undefined,
    nextRetryAt: undefined,
  };
}

export function createOfflineAction<TAction extends Omit<OfflineAction, 'attemptCount' | 'createdAt' | 'id'>>(
  action: TAction,
): OfflineAction {
  return {
    ...action,
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    id: createQueueActionId(),
  } as OfflineAction;
}

function removeActionsForTarget(actions: OfflineAction[], targetId: string) {
  return actions.filter((action) => !isSameTargetAction(action, targetId));
}

function enqueueAction(state: OfflineQueueState, action: OfflineAction): {
  nextState: OfflineQueueState;
  result: EnqueueOfflineActionResult;
} {
  const nextState = {
    ...state,
    actions: [...state.actions],
  };

  switch (action.type) {
    case 'CREATE_TASK':
    case 'CREATE_HABIT': {
      nextState.actions.push(resetActionRetryState(action));

      return {
        nextState,
        result: {
          resolvedActionId: action.id,
          status: 'enqueued',
        },
      };
    }

    case 'UPDATE_TASK': {
      const createIndex = nextState.actions.findIndex(
        (queuedAction) =>
          queuedAction.type === 'CREATE_TASK' && isSameTargetAction(queuedAction, action.targetId),
      );

      if (createIndex >= 0) {
        const existingCreateAction = nextState.actions[createIndex];

        if (existingCreateAction.type === 'CREATE_TASK') {
          nextState.actions[createIndex] = {
            ...resetActionRetryState(existingCreateAction),
            payload: {
              ...existingCreateAction.payload,
              ...action.payload,
            },
          };
        }

        return {
          nextState,
          result: {
            resolvedActionId: nextState.actions[createIndex].id,
            status: 'merged',
          },
        };
      }

      const updateIndex = nextState.actions.findIndex(
        (queuedAction) =>
          queuedAction.type === 'UPDATE_TASK' && isSameTargetAction(queuedAction, action.targetId),
      );

      if (updateIndex >= 0) {
        const existingUpdateAction = nextState.actions[updateIndex];

        if (existingUpdateAction.type === 'UPDATE_TASK') {
          nextState.actions[updateIndex] = {
            ...resetActionRetryState(existingUpdateAction),
            payload: {
              ...existingUpdateAction.payload,
              ...action.payload,
            },
          };
        }

        return {
          nextState,
          result: {
            resolvedActionId: nextState.actions[updateIndex].id,
            status: 'merged',
          },
        };
      }

      nextState.actions.push(resetActionRetryState(action));

      return {
        nextState,
        result: {
          resolvedActionId: action.id,
          status: 'enqueued',
        },
      };
    }

    case 'DELETE_TASK': {
      const hasQueuedCreate = nextState.actions.some(
        (queuedAction) =>
          queuedAction.type === 'CREATE_TASK' && isSameTargetAction(queuedAction, action.targetId),
      );

      if (hasQueuedCreate) {
        nextState.actions = removeActionsForTarget(nextState.actions, action.targetId);

        return {
          nextState,
          result: {
            resolvedActionId: null,
            status: 'discarded',
          },
        };
      }

      nextState.actions = nextState.actions.filter(
        (queuedAction) =>
          !(
            isSameTargetAction(queuedAction, action.targetId) &&
            (queuedAction.type === 'DELETE_TASK' || queuedAction.type === 'UPDATE_TASK')
          ),
      );

      nextState.actions.push(resetActionRetryState(action));

      return {
        nextState,
        result: {
          resolvedActionId: action.id,
          status: 'enqueued',
        },
      };
    }

    case 'DELETE_HABIT': {
      const hasQueuedCreate = nextState.actions.some(
        (queuedAction) =>
          queuedAction.type === 'CREATE_HABIT' && isSameTargetAction(queuedAction, action.targetId),
      );

      if (hasQueuedCreate) {
        nextState.actions = removeActionsForTarget(nextState.actions, action.targetId);

        return {
          nextState,
          result: {
            resolvedActionId: null,
            status: 'discarded',
          },
        };
      }

      nextState.actions = nextState.actions.filter(
        (queuedAction) =>
          !(
            isSameTargetAction(queuedAction, action.targetId) &&
            (queuedAction.type === 'CHECKIN_HABIT' || queuedAction.type === 'DELETE_HABIT')
          ),
      );

      nextState.actions.push(resetActionRetryState(action));

      return {
        nextState,
        result: {
          resolvedActionId: action.id,
          status: 'enqueued',
        },
      };
    }

    case 'CHECKIN_HABIT': {
      const hasQueuedDelete = nextState.actions.some(
        (queuedAction) =>
          queuedAction.type === 'DELETE_HABIT' && isSameTargetAction(queuedAction, action.targetId),
      );

      if (hasQueuedDelete) {
        return {
          nextState,
          result: {
            resolvedActionId: null,
            status: 'discarded',
          },
        };
      }

      const existingCheckInAction = nextState.actions.find(
        (queuedAction) =>
          queuedAction.type === 'CHECKIN_HABIT' &&
          isSameTargetAction(queuedAction, action.targetId) &&
          queuedAction.dayKey === action.dayKey,
      );

      if (existingCheckInAction) {
        return {
          nextState,
          result: {
            resolvedActionId: existingCheckInAction.id,
            status: 'merged',
          },
        };
      }

      nextState.actions.push(resetActionRetryState(action));

      return {
        nextState,
        result: {
          resolvedActionId: action.id,
          status: 'enqueued',
        },
      };
    }

  }

  assertNever(action);
}

export function enqueueOfflineAction(action: OfflineAction) {
  let enqueueResult: EnqueueOfflineActionResult = {
    resolvedActionId: action.id,
    status: 'enqueued',
  };

  updateOfflineQueueState((state) => {
    const { nextState, result } = enqueueAction(state, action);
    enqueueResult = result;
    return nextState;
  });

  return enqueueResult;
}

export function getQueuedActions() {
  return getOfflineQueueState().actions;
}
