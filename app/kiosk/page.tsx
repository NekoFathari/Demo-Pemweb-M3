"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createTicket } from "@/lib/api-client";
import { usePollingState } from "@/lib/use-polling-state";
import {
  activeTicketForType,
  PRIORITY_LABEL,
  type PriorityLevel,
  type QueueType,
  type Ticket,
} from "@/lib/types";

type Mode = "display" | "ambil";

export default function KioskPage() {
  const { state, error, lastSync, reload } = usePollingState(3000);
  const [mode, setMode] = useState<Mode>("display");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const activeTypes = state?.queueTypes.filter((q) => q.active) ?? [];

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await (containerRef.current ?? document.documentElement).requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked; the button stays honest either way.
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col bg-slate-50"
      onDoubleClick={toggleFullscreen}
    >
      <main className="flex flex-1 flex-col px-4 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {mode === "display" ? "Nomor sedang dipanggil" : "Ambil nomor antrian"}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-slate-300 p-0.5">
                <button
                  onClick={() => setMode("display")}
                  aria-pressed={mode === "display"}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    mode === "display"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Layar Antrian
                </button>
                <button
                  onClick={() => setMode("ambil")}
                  aria-pressed={mode === "ambil"}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    mode === "ambil"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Ambil Nomor
                </button>
              </div>
              <button
                onClick={toggleFullscreen}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                {isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              </button>
            </div>
          </div>

          {mode === "display" && (
            <p className="tabular mt-1 text-sm text-slate-500">
              {lastSync
                ? `Diperbarui ${lastSync.toLocaleTimeString("id-ID")}`
                : "Menghubungkan..."}
            </p>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-medium">Gagal memuat antrian.</p>
              <p className="mt-1">
                {error}. Koneksi ke server bermasalah; halaman akan mencoba lagi
                setiap 3 detik.
              </p>
            </div>
          )}

          {!state && !error && (
            <p className="mt-6 text-sm text-slate-500" role="status">
              Memuat data antrian dari server...
            </p>
          )}

          {state && activeTypes.length === 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-medium text-slate-700">
                Belum ada jenis antrian aktif.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Buka Dashboard Admin untuk menambahkan jenis antrian.
              </p>
            </div>
          )}

          {state && activeTypes.length > 0 && mode === "display" && (
            <DisplayBoard state={state} activeTypes={activeTypes} />
          )}

          {state && activeTypes.length > 0 && mode === "ambil" && (
            <AmbilNomor
              activeTypes={activeTypes}
              onCreated={reload}
              lastSync={lastSync}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function DisplayBoard({
  state,
  activeTypes,
}: {
  state: NonNullable<ReturnType<typeof usePollingState>["state"]>;
  activeTypes: QueueType[];
}) {
  return (
    <div
      className="mt-6 grid flex-1 gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${
          activeTypes.length <= 2 ? "20rem" : "16rem"
        }, 1fr))`,
      }}
    >
      {activeTypes.map((queueType) => (
        <QueuePanel
          key={queueType.id}
          name={queueType.name}
          code={queueType.code}
          active={activeTicketForType(state, queueType.id)}
          waiting={
            state.tickets.filter(
              (t) => t.queueTypeId === queueType.id && t.status === "waiting",
            ).length
          }
        />
      ))}
    </div>
  );
}

function AmbilNomor({
  activeTypes,
  onCreated,
  lastSync,
}: {
  activeTypes: QueueType[];
  onCreated: () => Promise<void>;
  lastSync: Date | null;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ type: QueueType; ticket: Ticket } | null>(
    null,
  );

  async function ambil(queueType: QueueType, priority: PriorityLevel) {
    setBusyId(queueType.id);
    setError(null);
    try {
      const ticket = await createTicket(queueType.id, priority);
      setIssued({ type: queueType, ticket });
      await onCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil nomor, coba lagi.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (issued) {
    return (
      <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Nomor Anda
        </p>
        <p className="tabular mt-2 text-7xl font-bold text-amber-600">
          {issued.ticket.number}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {issued.type.name} &middot; Prioritas{" "}
          {PRIORITY_LABEL[issued.ticket.priority]}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Simpan nomor ini. Pantau layar untuk memantau panggilan.
        </p>
        <button
          onClick={() => setIssued(null)}
          className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          Ambil nomor lagi
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex-1">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <p className="text-sm text-slate-600">
        Pilih jenis layanan untuk mengambil nomor antrian.
      </p>
      <div
        className="mt-4 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${
            activeTypes.length <= 2 ? "20rem" : "16rem"
          }, 1fr))`,
        }}
      >
        {activeTypes.map((queueType) => (
          <div
            key={queueType.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {queueType.name}
              </h2>
              <span className="tabular rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {queueType.code}
              </span>
            </div>

            <button
              disabled={busyId !== null}
              onClick={() => ambil(queueType, "normal")}
              className="mt-4 rounded-md bg-amber-500 px-4 py-3 text-base font-semibold text-slate-900 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyId === queueType.id ? "Memproses..." : "Ambil Nomor"}
            </button>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                Ambil dengan prioritas
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["lansia", "disabilitas", "vip"] as PriorityLevel[]).map(
                  (priority) => (
                    <button
                      key={priority}
                      disabled={busyId !== null}
                      onClick={() => ambil(queueType, priority)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                    >
                      {PRIORITY_LABEL[priority]}
                    </button>
                  ),
                )}
              </div>
            </details>
          </div>
        ))}
      </div>
      <p className="tabular mt-4 text-xs text-slate-400">
        Jenis antrian baru muncul otomatis.{" "}
        {lastSync ? `Data ${lastSync.toLocaleTimeString("id-ID")}` : ""}
      </p>
    </div>
  );
}

function QueuePanel({
  name,
  code,
  active,
  waiting,
}: {
  name: string;
  code: string;
  active: Ticket | null;
  waiting: number;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
        <span className="tabular rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {code}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10">
        {active ? (
          <>
            <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
              Dipanggil
            </span>
            <span className="tabular mt-3 text-6xl font-bold leading-none text-slate-900 sm:text-7xl">
              {active.number}
            </span>
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">
              Belum ada nomor dipanggil
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Nomor akan muncul setelah operator memanggil tiket.
            </p>
          </div>
        )}
      </div>

      <p className="tabular border-t border-slate-100 pt-3 text-center text-sm text-slate-500">
        {waiting} tiket menunggu
      </p>
    </section>
  );
}
