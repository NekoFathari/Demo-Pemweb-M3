import { NextResponse } from "next/server";
import type { QueueType } from "@/lib/types";
import { mutate } from "@/lib/store";
import { jsonError } from "@/lib/api-helpers";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Context) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body JSON tidak valid", 400);
  }

  const { name, active } = (body ?? {}) as {
    name?: unknown;
    active?: unknown;
  };

  const result = await mutate<QueueType | null>((state) => {
    const index = state.queueTypes.findIndex((q) => q.id === id);
    if (index === -1) return { state, result: null };

    const current = state.queueTypes[index];
    const updated: QueueType = {
      ...current,
      name: typeof name === "string" && name.trim() ? name.trim() : current.name,
      active: typeof active === "boolean" ? active : current.active,
    };
    const queueTypes = state.queueTypes.slice();
    queueTypes[index] = updated;
    return { state: { ...state, queueTypes }, result: updated };
  });

  if (!result) return jsonError("Jenis antrian tidak ditemukan", 404);
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;

  const found = await mutate<boolean>((state) => {
    const exists = state.queueTypes.some((q) => q.id === id);
    if (!exists) return { state, result: false };
    return {
      state: {
        queueTypes: state.queueTypes.filter((q) => q.id !== id),
        tickets: state.tickets.filter((t) => t.queueTypeId !== id),
      },
      result: true,
    };
  });

  if (!found) return jsonError("Jenis antrian tidak ditemukan", 404);
  return NextResponse.json({ ok: true });
}
