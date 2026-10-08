import { NextResponse } from "next/server";
import { PRIORITIES } from "@/lib/types";
import type { AppState, PriorityLevel, QueueType, Ticket } from "@/lib/types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isPriority(value: unknown): value is PriorityLevel {
  return (
    typeof value === "string" && PRIORITIES.includes(value as PriorityLevel)
  );
}

export function nextNumber(state: AppState, queueType: QueueType): string {
  const seq =
    state.tickets.filter((t) => t.queueTypeId === queueType.id).length + 1;
  return `${queueType.code}-${String(seq).padStart(3, "0")}`;
}

export function makeTicket(
  state: AppState,
  queueType: QueueType,
  priority: PriorityLevel,
): Ticket {
  return {
    id: crypto.randomUUID(),
    queueTypeId: queueType.id,
    number: nextNumber(state, queueType),
    priority,
    status: "waiting",
    createdAt: new Date().toISOString(),
    calledAt: null,
  };
}
