export type OrderLifecycleState =
  | "NEW"
  | "RESTING"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

const VALID_TRANSITIONS: Record<OrderLifecycleState, readonly OrderLifecycleState[]> = {
  NEW: ["RESTING", "PARTIALLY_FILLED", "FILLED", "REJECTED"],
  RESTING: ["PARTIALLY_FILLED", "FILLED", "CANCELLED"],
  PARTIALLY_FILLED: ["PARTIALLY_FILLED", "FILLED", "CANCELLED"],
  FILLED: [],
  CANCELLED: [],
  REJECTED: [],
};

export function canTransitionOrder(
  fromState: OrderLifecycleState,
  toState: OrderLifecycleState,
): boolean {
  const allowed = VALID_TRANSITIONS[fromState];
  if (!allowed) {
    return false;
  }
  return allowed.includes(toState);
}

export function transitionOrderState(
  fromState: OrderLifecycleState,
  toState: OrderLifecycleState,
): OrderLifecycleState {
  if (!canTransitionOrder(fromState, toState)) {
    throw new Error(`Illegal order state transition from ${fromState} to ${toState}`);
  }
  return toState;
}

export function isTerminalOrderState(state: OrderLifecycleState): boolean {
  return state === "FILLED" || state === "CANCELLED" || state === "REJECTED";
}
