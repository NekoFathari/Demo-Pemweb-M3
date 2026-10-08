"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  callTicket,
  createQueueType,
  createTicket,
  deleteQueueType,
  doneTicket,
  logout,
  resetTickets,
  skipTicket,
  updateQueueType,
} from "@/lib/api-client";
import { usePollingState } from "@/lib/use-polling-state";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type AppState,
  type PriorityLevel,
  type Ticket,
} from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { state, error: loadError, reload } = usePollingState(5000);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const error = actionError ?? loadError;

  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [issueTypeId, setIssueTypeId] = useState("");
  const [issuePriority, setIssuePriority] = useState<PriorityLevel>("normal");

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

  function handleReset() {
    const total = state?.tickets.length ?? 0;
    if (total === 0) return;
    const ok = window.confirm(
      `Reset antrian hari ini? ${total} tiket akan dihapus dan nomor kembali ke urutan awal. Tindakan ini tidak bisa dibatalkan.`,
    );
    if (!ok) return;
    run(() => resetTickets());
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard Admin
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={busy || !state || state.tickets.length === 0}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Antrian
          </button>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            Keluar
          </button>
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Reset setiap hari agar penomoran antrian mulai dari awal.
      </p>

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

      {state && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Jenis antrian
            </h2>
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(async () => {
                  await createQueueType(newCode, newName);
                  setNewCode("");
                  setNewName("");
                });
              }}
            >
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Kode
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="C"
                  required
                  className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm uppercase text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
                Nama
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Farmasi"
                  required
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Tambah
              </button>
            </form>

            {state.queueTypes.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Belum ada jenis antrian. Tambahkan satu untuk mulai menerbitkan
                tiket.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-slate-100">
                {state.queueTypes.map((queueType) => {
                  const count = state.tickets.filter(
                    (t) =>
                      t.queueTypeId === queueType.id && t.status === "waiting",
                  ).length;
                  return (
                    <li
                      key={queueType.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {queueType.name}{" "}
                          <span className="tabular text-slate-400">
                            ({queueType.code})
                          </span>
                        </p>
                        <p className="tabular text-xs text-slate-500">
                          {count} menunggu
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              updateQueueType(queueType.id, {
                                active: !queueType.active,
                              }),
                            )
                          }
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          {queueType.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() => deleteQueueType(queueType.id))
                          }
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Hapus
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Terbitkan tiket
            </h2>
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!issueTypeId) return;
                run(() =>
                  createTicket(issueTypeId, issuePriority),
                );
              }}
            >
              <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
                Jenis antrian
                <select
                  value={issueTypeId}
                  onChange={(e) => setIssueTypeId(e.target.value)}
                  required
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  <option value="">Pilih jenis antrian</option>
                  {state.queueTypes
                    .filter((q) => q.active)
                    .map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} ({q.code})
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Prioritas
                <select
                  value={issuePriority}
                  onChange={(e) =>
                    setIssuePriority(e.target.value as PriorityLevel)
                  }
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={busy || !issueTypeId}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Terbitkan
              </button>
            </form>

            <TicketLists state={state} busy={busy} run={run} />
          </section>
        </div>
      )}
    </main>
  );
}

function TicketLists({
  state,
  busy,
  run,
}: {
  state: AppState;
  busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const withTickets = state.queueTypes.filter((q) =>
    state.tickets.some((t) => t.queueTypeId === q.id),
  );

  if (withTickets.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        Belum ada tiket. Terbitkan tiket di atas untuk melihatnya di sini.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {withTickets.map((queueType) => {
        const tickets = state.tickets
          .filter((t) => t.queueTypeId === queueType.id)
          .slice()
          .reverse();
        return (
          <div key={queueType.id}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {queueType.name}
            </h3>
            <ul className="mt-2 flex flex-col gap-1">
              {tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  busy={busy}
                  run={run}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function TicketRow({
  ticket,
  busy,
  run,
}: {
  ticket: Ticket;
  busy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="tabular text-sm font-semibold text-slate-900">
          {ticket.number}
        </span>
        <span className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200">
          {PRIORITY_LABEL[ticket.priority]}
        </span>
        <span className="text-xs text-slate-500">
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {ticket.status === "waiting" && (
          <button
            disabled={busy}
            onClick={() => run(() => callTicket(ticket.id))}
            className="rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            Panggil
          </button>
        )}
        {ticket.status === "called" && (
          <button
            disabled={busy}
            onClick={() => run(() => doneTicket(ticket.id))}
            className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            Selesai
          </button>
        )}
        {ticket.status === "waiting" && (
          <button
            disabled={busy}
            onClick={() => run(() => skipTicket(ticket.id))}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Lewati
          </button>
        )}
      </div>
    </li>
  );
}
