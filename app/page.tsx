import Link from "next/link";

const surfaces = [
  {
    href: "/dashboard",
    title: "Dashboard Admin",
    detail:
      "Atur jenis antrian, terbitkan tiket, dan tetapkan prioritas. Perlu login.",
  },
  {
    href: "/kiosk",
    title: "Kiosk",
    detail:
      "Layar publik. Menampilkan nomor yang sedang dipanggil untuk setiap jenis antrian.",
  },
  {
    href: "/operator",
    title: "Operator",
    detail:
      "Panggil nomor berikutnya sesuai prioritas. Perlu login.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Antrian Tiket berprioritas
      </h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Satu antrian untuk setiap jenis layanan. Setiap tiket punya prioritas
        yang menentukan urutan pemanggilan, bukan sekadar urutan kedatangan.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {surfaces.map((surface) => (
          <Link
            key={surface.href}
            href={surface.href}
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <span className="text-base font-semibold text-slate-900">
              {surface.title}
            </span>
            <span className="mt-2 text-sm leading-relaxed text-slate-600">
              {surface.detail}
            </span>
            <span className="mt-4 text-sm font-medium text-amber-600 group-hover:text-amber-700">
              Buka {surface.title}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
