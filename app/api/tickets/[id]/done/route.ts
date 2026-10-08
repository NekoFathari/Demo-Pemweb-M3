import { NextResponse } from "next/server";
import type { Ticket, TicketStatus } from "@/lib/types";
import { mutate } from "@/lib/store";
import { jsonError } from "@/lib/api-helpers";

type Context = { params: Promise<{ id: string }> };

function transition(id: string, status: TicketStatus) {
  return mutate<Ticket | null>((state) => {
    const index = state.tickets.findIndex((t) => t.id === id);
    if (index === -1) return { state, result: null };

    const updated: Ticket = { ...state.tickets[index], status };
    const tickets = state.tickets.slice();
    tickets[index] = updated;
    return { state: { ...state, tickets }, result: updated };
  });
}

export async function POST(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  const result = await transition(id, "done");
  if (!result) return jsonError("Tiket tidak ditemukan", 404);
  return NextResponse.json(result);
}
