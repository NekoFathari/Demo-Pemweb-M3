export type TicketStatus = "waiting" | "called" | "done" | "skipped";

export type PriorityLevel = "normal" | "lansia" | "disabilitas" | "vip";

export interface QueueType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Ticket {
  id: string;
  queueTypeId: string;
  number: string;
  priority: PriorityLevel;
  status: TicketStatus;
  createdAt: string;
  calledAt: string | null;
}

export interface AppState {
  queueTypes: QueueType[];
  tickets: Ticket[];
}

export const PRIORITY_WEIGHT: Record<PriorityLevel, number> = {
  vip: 3,
  disabilitas: 2,
  lansia: 1,
  normal: 0,
};

export const PRIORITIES: PriorityLevel[] = [
  "normal",
  "lansia",
  "disabilitas",
  "vip",
];

export const PRIORITY_LABEL: Record<PriorityLevel, string> = {
  vip: "VIP",
  disabilitas: "Disabilitas",
  lansia: "Lansia",
  normal: "Normal",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  waiting: "Menunggu",
  called: "Dipanggil",
  done: "Selesai",
  skipped: "Dilewati",
};

export function nextTicketForType(
  state: AppState,
  queueTypeId: string,
): Ticket | null {
  const waiting = state.tickets.filter(
    (t) => t.queueTypeId === queueTypeId && t.status === "waiting",
  );
  if (waiting.length === 0) return null;
  return waiting.sort((a, b) => {
    const w = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (w !== 0) return w;
    return a.createdAt.localeCompare(b.createdAt);
  })[0];
}

export function activeTicketForType(
  state: AppState,
  queueTypeId: string,
): Ticket | null {
  return (
    state.tickets.find(
      (t) => t.queueTypeId === queueTypeId && t.status === "called",
    ) ?? null
  );
}
