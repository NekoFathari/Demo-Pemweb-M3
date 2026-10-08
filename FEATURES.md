# SPESIFIKASI FITUR — Antrian Tiket (Priority Queue)

Dokumen ini merinci fitur yang **sudah diimplementasikan** di website ini. Setiap fitur
ditulis dengan lokasi kode sebagai bukti. Semua kode berbahasa **TypeScript**
(`.ts`/`.tsx`), tidak ada `.js`/`.jsx`.

---

## 1. Login Page (`/login`)

File: `app/login/page.tsx`, `app/api/auth/login/route.ts`, `lib/auth.ts`

- **Form Login**: field `username` dan `password` dengan atribut `required`, serta
  `autoComplete` yang benar (`username`, `current-password`).
- **Autentikasi API**: kredensial divalidasi lewat proxy server-side ke
  `POST https://dummyjson.com/auth/login` (bukan langsung dari browser, sehingga kredensial
  tidak terekspos). Sumber daftar user: `https://dummyjson.com/users`.
- **Loading State**: tombol berubah menjadi "Memproses..." dan `disabled` selama request
  (`pending`), mencegah submit ganda.
- **Error Handling**: `try...catch` menampilkan pesan informatif dari server (`role="alert"`),
  termasuk kasus password salah (401) dan server auth tidak terjangkau (502).
- **Session Persistence**: token disimpan di cookie **httpOnly** bernama `session`
  (`sameSite=lax`, `maxAge` 1 jam). Token tidak pernah disimpan di Local Storage, tidak
  di-log, dan tidak di-commit.
- **Auto Redirect**: setelah login sukses, pengguna diarahkan ke `?next=...` bila ada
  (hanya path internal yang diizinkan), jika tidak ke `/operator`.
- **Auth Guard (route protection)**: `proxy.ts` melindungi `/dashboard` dan `/operator`.
  Tanpa cookie `session`, request di-redirect ke `/login?next=<path>`. `/kiosk` tetap publik.
- **Fallback Suspense**: form dibungkus `<Suspense>` karena memakai `useSearchParams()`
  (wajib di Next.js 16 agar tidak memblokir prerender).

---

## 2. Dashboard Admin (`/dashboard`) — Protected

File: `app/dashboard/page.tsx`

- **Proteksi Halaman**: wajib login (dijaga `proxy.ts`).
- **Manajemen Jenis Antrian (CRUD)**:
  - **Create**: form kode + nama (mis. `C` / `Farmasi`); kode unik (409 bila duplikat).
  - **Update**: aktif/nonaktifkan jenis antrian (`PATCH`).
  - **Delete**: hapus jenis antrian beserta seluruh tiketnya.
- **Terbitkan Tiket**: pilih jenis antrian + prioritas
  (`normal`, `lansia`, `disabilitas`, `vip`). Nomor di-generate server.
- **Daftar Tiket per Jenis Antrian**: menampilkan nomor, prioritas, dan status
  (Menunggu / Dipanggil / Selesai / Dilewati) dengan data nyata.
- **Reset Antrian (Harian)**: tombol **"Reset Antrian"** menghapus semua tiket sehingga
  penomoran kembali ke awal. Dilindungi `window.confirm` karena destruktif; `disabled`
  saat tidak ada tiket.
- **Logout**: menghapus cookie sesi lalu kembali ke `/login`.
- **UI States**: memuat ("Memuat data..."), error (pesan + sebab), dan empty state yang
  jelas (mis. "Belum ada tiket. Terbitkan tiket di atas...").

---

## 3. Kiosk (`/kiosk`) — Public, dua mode

File: `app/kiosk/page.tsx`, `components/site-header.tsx`

### 3.1 Mode Display (`Layar Antrian`)

- **Tanpa login**, read-only (tidak menerbitkan tiket).
- **Panel per Jenis Antrian**: menampilkan nomor yang **sedang dipanggil** untuk setiap jenis
  antrian aktif, berdampingan (N jenis → N panel), plus jumlah tiket menunggu.
- **Auto-refresh**: polling `/api/state` setiap 3 detik (tanpa reload manual).
- **Auto-detect Jenis Antrian Baru**: jenis antrian baru (mis. `C`) otomatis muncul tanpa
  reload, karena daftar berasal dari data polling.
- **Empty State Jujur**: "Belum ada nomor dipanggil" + penjelasan kapan nomor muncul.
- **Status Dot**: indikator "DIPANGGIL" hanya dinyalakan saat ada tiket aktif (bukan dekorasi).

### 3.2 Mode Ambil Nomor (Self-Service)

- Pengunjung menekan tombol untuk **menerbitkan tiket sendiri** (`POST /api/tickets`).
- Tersedia opsi prioritas (Lansia / Disabilitas / VIP) di dalam `<details>`.
- Menampilkan kartu konfirmasi nomor besar + jenis layanan + tombol "Ambil nomor lagi".
- Tetap publik (tanpa login).

### 3.3 Fullscreen

- Tombol **"Layar Penuh"** (juga **klik ganda** pada area kiosk) memanggil Fullscreen API.
- **Navbar otomatis hilang** saat fullscreen: `components/site-header.tsx` mendengarkan
  event `fullscreenchange` dan tidak merender header ketika `document.fullscreenElement` ada.
- Tombol berganti menjadi "Keluar Layar Penuh" saat aktif.

---

## 4. Panel Operator (`/operator`) — Protected

File: `app/operator/page.tsx`

- **Proteksi Halaman**: wajib login.
- **Next Ticket per Jenis Antrian**: menampilkan tiket berikutnya sesuai aturan prioritas
  (prioritas lebih tinggi dipanggil lebih dulu; bila seri, yang lebih dulu dibuat).
- **Tombol "Panggil Berikutnya"**: memanggil tiket (`POST /api/tickets/[id]/call`).
  Tiket yang sebelumnya berstatus `called` pada jenis yang sama otomatis menjadi `done`.
- **Tombol "Selesai"**: menutup tiket yang sedang dipanggil.
- **Auto-refresh**: polling setiap 5 detik agar sinkron dengan kiosk.

---

## 5. API Backend (Route Handlers)

File: `app/api/**`, `lib/store.ts`, `lib/seed.ts`, `lib/api-helpers.ts`

- **Persistence**: JSON file store di `.data/state.json` (gitignored), single source of truth.
  Ditulis dengan mutex (antrean promise) agar aman dari write bersamaan.
- **Seed**: saat pertama dibaca, store diisi 2 jenis antrian: `A/Teller`, `B/CS`.

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/state` | Seluruh state (queueTypes + tickets) |
| POST | `/api/queue-types` | Buat jenis antrian |
| PATCH | `/api/queue-types/[id]` | Ubah nama / aktif |
| DELETE | `/api/queue-types/[id]` | Hapus jenis antrian + tiketnya |
| POST | `/api/tickets` | Terbitkan tiket (nomor otomatis) |
| POST | `/api/tickets/[id]/call` | Panggil tiket |
| POST | `/api/tickets/[id]/done` | Tandai selesai |
| POST | `/api/tickets/[id]/skip` | Lewati tiket |
| POST | `/api/tickets/reset` | **Reset** semua / satu jenis antrian |
| POST | `/api/auth/login` | Proxy login dummyjson + set cookie sesi |
| POST | `/api/auth/logout` | Hapus cookie sesi |

- **Aturan Prioritas**: `nextTicketForType()` di `lib/types.ts` mengurutkan tiket `waiting`
  berdasarkan bobot prioritas (vip 3 > disabilitas 2 > lansia 1 > normal 0), lalu FIFO.
- **Penomoran**: `${code}-${seq}` dengan `seq` = jumlah tiket jenis tsb + 1, di-pad 3 digit
  (mis. `A-001`).

---

## 6. Fitur Lintas Halaman

- **Navigasi**: header dengan link Beranda / Kiosk / Operator / Dashboard; semua tujuan nyata.
- **Empty / Loading / Error State**: setiap tampilan data punya ketiganya dengan sebab +
  aksi berikutnya (tidak ada "No data" tanpa penjelasan).
- **Tanpa data palsu**: tidak ada angka statistik atau nama fiktif; semua data nyata atau
  placeholder yang jelas.
- **Aksesibilitas**: label form, `role="alert"` untuk error, fokus terlihat, navigasi keyboard.
- **Responsif**: layout reflow dari mobile ke desktop.

---

## 7. Cara Menjalankan

```bash
npm install     # sekali saja
npm run dev     # http://localhost:3000
```

Login uji: `emilys` / `emilyspass` (daftar lengkap di `https://dummyjson.com/users`).

Verifikasi: `npm run lint` → `npm run build` → `npm run typecheck`.
