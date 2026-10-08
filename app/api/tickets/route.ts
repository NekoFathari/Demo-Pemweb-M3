import { NextResponse } from "next/server";
import type { Ticket } from "@/lib/types";
import { mutate } from "@/lib/store";
import { isPriority, jsonError, makeTicket } from "@/lib/api-helpers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body JSON tidak valid", 400);
  }

  const { queueTypeId, priority } = (body ?? {}) as {
    queueTypeId?: unknown;
    priority?: unknown;
  };

  if (typeof queueTypeId !== "string" || queueTypeId === "") {
    return jsonError("Jenis antrian wajib dipilih", 400);
  }
  if (!isPriority(priority)) {
    return jsonError(
      "Prioritas tidak valid (normal, lansia, disabilitas, vip)",
      400,
    );
  }

  const result = await mutate<Ticket | { notFound: string }>((state) => {
    const queueType = state.queueTypes.find((q) => q.id === queueTypeId);
    if (!queueType) {
      return { state, result: { notFound: queueTypeId } };
    }
    const ticket = makeTicket(state, queueType, priority);
    return {
      state: { ...state, tickets: [...state.tickets, ticket] },
      result: ticket,
    };
  });

  if ("notFound" in result) {
    return jsonError("Jenis antrian tidak ditemukan", 404);
  }
  return NextResponse.json(result, { status: 201 });
}
