import { NextResponse } from "next/server";
import type { QueueType } from "@/lib/types";
import { mutate } from "@/lib/store";
import { jsonError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Body JSON tidak valid", 400);
  }

  const { code, name } = (body ?? {}) as { code?: unknown; name?: unknown };
  if (typeof code !== "string" || code.trim() === "") {
    return jsonError("Kode jenis antrian wajib diisi", 400);
  }
  if (typeof name !== "string" || name.trim() === "") {
    return jsonError("Nama jenis antrian wajib diisi", 400);
  }

  const trimmedCode = code.trim().toUpperCase();
  const trimmedName = name.trim();

  const result = await mutate<QueueType | { error: string }>((state) => {
    if (state.queueTypes.some((q) => q.code === trimmedCode)) {
      return { state, result: { error: `Kode "${trimmedCode}" sudah dipakai` } };
    }
    const queueType: QueueType = {
      id: trimmedCode,
      code: trimmedCode,
      name: trimmedName,
      active: true,
    };
    return {
      state: {
        ...state,
        queueTypes: [...state.queueTypes, queueType],
      },
      result: queueType,
    };
  });

  if ("error" in result) return jsonError(result.error, 409);
  return NextResponse.json(result, { status: 201 });
}
