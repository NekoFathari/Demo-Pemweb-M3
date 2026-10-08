"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { callTicket, doneTicket, logout } from "@/lib/api-client";
import { usePollingState } from "@/lib/use-polling-state";
import {
  activeTicketForType,
  nextTicketForType,
  PRIORITY_LABEL,
} from "@/lib/types";

export default function OperatorPage() {
  const router = useRouter();
  const { state, error: loadError, reload } = usePollingState(5000);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const error = actionError ?? loadError;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Aksi gagal");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try { await logout(); } catch {}
    router.push("/login");
    router.refresh();
  }

  const activeTypes = state?.queueTypes.filter((q) => q.active) ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel Operator
        </h1>
        <button
          onClick={handleLogout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          Keluar
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!state && !error && (
        <p role="status" className="mt-6 text-sm text-slate-500">
          Memuat data...
        </p>
      )}

      {state && activeTypes.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">
          Tidak ada jenis antrian aktif. Aktifkan di Dashboard Admin.
        </p>
      )}

      {state && activeTypes.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {activeTypes.map((queueType) => {
            const active = activeTicketForType(state, queueType.id);
            const next = nextTicketForType(state, queueType.id);
            const waiting = state.tickets.filter(
              (t) =>
                t.queueTypeId === queueType.id && t.status === "waiting",
            ).length;

            return (
              <section
                key={queueType.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {queueType.name}
                  </h2>
                  <span className="tabular text-xs text-slate-500">
                    {waiting} menunggu
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Sedang dipanggil
                    </p>
                    <p className="tabular mt-1 text-3xl font-bold text-amber-600">
                      {active ? active.number : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Berikutnya
                    </p>
                    <p className="tabular mt-1 text-3xl font-bold text-slate-900">
                      {next ? next.number : "-"}
                    </p>
                    {next && (
                      <p className="mt-1 text-xs text-slate-500">
                        Prioritas {PRIORITY_LABEL[next.priority]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    disabled={busy || !next}
                    onClick={() => next && run(() => callTicket(next.id))}
                    className="flex-1 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Panggil Berikutnya
                  </button>
                  <button
                    disabled={busy || !active}
                    onClick={() => active && run(() => doneTicket(active.id))}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Selesai
                  </button>
                </div>

                {!next && (
                  <p className="mt-3 text-xs text-slate-500">
                    Tidak ada tiket menunggu untuk jenis antrian ini.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
