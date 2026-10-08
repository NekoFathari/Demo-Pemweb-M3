import { NextResponse } from "next/server";
import type { Ticket } from "@/lib/types";
import { mutate } from "@/lib/store";
import { jsonError } from "@/lib/api-helpers";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Context) {
  const { id } = await ctx.params;

  const result = await mutate<Ticket | null>((state) => {
    const target = state.tickets.find((t) => t.id === id);
    if (!target) return { state, result: null };

    const now = new Date().toISOString();
    const tickets = state.tickets.map((t) => {
      if (t.id === id) {
        return { ...t, status: "called" as const, calledAt: now };
      }
      if (t.queueTypeId === target.queueTypeId && t.status === "called") {
        return { ...t, status: "done" as const };
      }
      return t;
    });

    const updated = tickets.find((t) => t.id === id) as Ticket;
    return { state: { ...state, tickets }, result: updated };
  });

  if (!result) return jsonError("Tiket tidak ditemukan", 404);
  return NextResponse.json(result);
}
