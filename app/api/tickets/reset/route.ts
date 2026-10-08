import { NextResponse } from "next/server";
import { mutate } from "@/lib/store";
import { jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  let scope = "all";
  try {
    const body = (await request.json()) as { queueTypeId?: unknown };
    if (typeof body?.queueTypeId === "string" && body.queueTypeId) {
      scope = body.queueTypeId;
    }
  } catch {
    // no body: reset everything
  }

  const result = await mutate<{ removed: number; scope: string }>((state) => {
    if (scope === "all") {
      return {
        state: { ...state, tickets: [] },
        result: { removed: state.tickets.length, scope: "all" },
      };
    }

    const exists = state.queueTypes.some((q) => q.id === scope);
    if (!exists) {
      return { state, result: { removed: -1, scope } };
    }
    const removed = state.tickets.filter(
      (t) => t.queueTypeId === scope,
    ).length;
    return {
      state: {
        ...state,
        tickets: state.tickets.filter((t) => t.queueTypeId !== scope),
      },
      result: { removed, scope },
    };
  });

  if (result.removed === -1) {
    return jsonError("Jenis antrian tidak ditemukan", 404);
  }

  return NextResponse.json({ ok: true, ...result });
}
