# PRD — Website Antrian Priority Queue

## 1. Ringkasan

Website manajemen antrian tiket berbasis **Priority Queue** dengan lebih dari satu jenis antrian (jenis antrian). Setiap tiket terikat pada satu jenis antrian dan memiliki prioritas yang menentukan urutan pemanggilan. Wajib menggunakan **TypeScript**.

## 2. Tujuan

- Mengelola banyak jenis antrian dalam satu aplikasi.
- Nomor antrian dipanggil berdasarkan prioritas (bukan sekadar FIFO).
- Menyediakan tampilan publik untuk menampilkan nomor antrian yang sedang aktif.

## 3. Peran

| Peran | Akses | Tanggung jawab |
|---|---|---|
| Admin | Login (protected) | Mengatur jenis antrian, menerbitkan tiket, mengatur prioritas, reset antrian harian |
| Operator | Login (protected) | Melihat tiket berikutnya dan memanggil nomor antrian |
| Pengunjung | Publik | Melihat tampilan kiosk dan mengambil nomor sendiri (self-service) |

## 4. Halaman (minimal 3)

### 4.1 `/dashboard` — Dashboard Admin (protected)

- Login wajib sebelum mengakses.
- CRUD **jenis antrian** (mis. `Teller`, `CS`, `Farmasi`): kode/prefix, nama, status aktif.
- Menerbitkan (issue) **tiket** baru ke salah satu jenis antrian.
- Mengatur **prioritas** tiket (mis. normal, lansia, disabilitas, VIP).
- Melihat daftar tiket per jenis antrian beserta statusnya (menunggu, dipanggil, selesai, dilewati).
- **Reset antrian (harian)**: satu tombol menghapus semua tiket sehingga penomoran kembali dari awal; wajib konfirmasi karena merusak data.

### 4.2 `/kiosk` — Kiosk (publik)

Dua mode dalam satu halaman (toggle in-page):

- **Mode Display (`Layar Antrian`)**:
  - Menampilkan nomor antrian yang **sedang aktif (dipanggil)** untuk **setiap jenis antrian**, berdampingan: N jenis → N panel.
  - Auto-refresh (polling 3 detik) dan **otomatis menampilkan jenis antrian baru** (mis. C) begitu ditambahkan admin.
  - Tombol **Layar Penuh** (juga klik ganda): masuk fullscreen API; **navbar disembunyikan** selama fullscreen agar tampilan bersih.
- **Mode Ambil Nomor (self-service)**:
  - Pengunjung menekan tombol untuk **menerbitkan tiket sendiri**, termasuk opsi prioritas (lansia/disabilitas/VIP).
  - Menampilkan nomor yang baru didapat sebagai konfirmasi.
  - Tidak perlu login.

### 4.3 `/operator` — Panel Operator (protected)

- Login wajib. Hanya pengguna yang login boleh memanggil nomor.
- Menampilkan tiket berikutnya (next) per jenis antrian sesuai urutan prioritas.
- Tombol **"Panggil Berikutnya"** per jenis antrian: menandai tiket aktif, memajukan nomor yang tampil di kiosk.
- Opsional: tandai selesai / lewati.

## 5. Autentikasi

- Sumber pengguna: `https://dummyjson.com/users` (daftar user & kredensial uji tersedia di sana).
- Login: `POST https://dummyjson.com/auth/login` (username + password) → mengembalikan `accessToken` + data user.
- Login hanya menjadi gerbang untuk `/dashboard` dan `/operator`.
- Token dummyjson punya masa kedaluwarsa — jangan disimpan permanen dan jangan di-commit.

## 6. Model Data (draft)

```ts
type Priority = 'normal' | 'tinggi' | 'kritis' | string

interface QueueType {
  id: string
  code: string      // prefix nomor, mis. "A", "B"
  name: string
  active: boolean
}

interface Ticket {
  id: string
  queueTypeId: string
  number: string    // mis. "A-012"
  priority: Priority
  status: 'waiting' | 'called' | 'done' | 'skipped'
  createdAt: string
}

interface AppState {
  queueTypes: QueueType[]
  tickets: Ticket[]
}
```

**Aturan pemanggilan:** tiket berikutnya = tiket berstatus `waiting` pada jenis antrian tsb dengan prioritas tertinggi; bila seri, yang dibuat lebih dulu (FIFO dalam prioritas).

## 7. Kebutuhan Fungsional

1. Admin dapat membuat, mengubah, menghapus, dan menonaktifkan jenis antrian.
2. Admin dapat menerbitkan tiket ke jenis antrian tertentu dengan prioritas tertentu.
3. Admin dapat melihat daftar tiket per jenis antrian.
4. Operator dapat melihat tiket berikutnya per jenis antrian.
5. Operator dapat memanggil tiket berikutnya; nomor aktif ter-update di kiosk.
6. Kiosk menampilkan nomor aktif untuk semua jenis antrian secara berdampingan.
7. Pengguna dapat login via dummyjson; halaman terlindungi menolak akses tanpa login.

## 8. Kebutuhan Non-Fungsional

- Seluruh kode dalam **TypeScript** (`.ts`/`.tsx`); dilarang `.js`/`.jsx`.
- UI responsif; kiosk dioptimalkan untuk layar besar.
- Kiosk menyegarkan tampilan otomatis tanpa reload manual.

## 9. Di Luar Cakupan & Keputusan Terbuka

- **Persistensi**: server-side JSON store (`.data/state.json`) — sudah diputuskan.
- **Transport refresh kiosk**: polling `/api/state` tiap 3 detik — sudah diputuskan.
- **State management**: tanpa library, `fetch` di komponen — sudah diputuskan.
- Printer tiket fisik, suara panggilan (text-to-speech), integrasi backend produksi.

## 10. Kriteria Penerimaan

- [ ] Terdapat 3 halaman: `/dashboard`, `/kiosk`, `/operator`.
- [ ] Dapat membuat ≥ 2 jenis antrian; kiosk menampilkan keduanya berdampingan.
- [ ] Tiket dengan prioritas lebih tinggi dipanggil lebih dulu.
- [ ] `/dashboard` dan `/operator` menolak akses tanpa login; `/kiosk` terbuka.
- [ ] Login sukses menggunakan kredensial dummyjson.
- [ ] Operator memanggil nomor → nomor aktif berubah di kiosk tanpa reload.
- [ ] Admin dapat **reset seluruh antrian**; penomoran kembali ke awal.
- [ ] Kiosk mode **Ambil Nomor** dapat menerbitkan tiket secara self-service.
- [ ] Kiosk mode **Display** tetap read-only (tidak menerbitkan tiket).
- [ ] Jenis antrian baru (mis. C) muncul otomatis di kiosk tanpa reload.
- [ ] Kiosk punya tombol **Layar Penuh**, dan navbar hilang saat fullscreen.
- [ ] Build lolos lint, typecheck (`tsc --noEmit`), dan build tanpa error.
