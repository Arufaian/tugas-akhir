# Roadmap Riwayat Kalkulasi MOORA

## 1. Tujuan

Menyediakan halaman admin untuk melihat daftar calculation run dan mengaudit kembali hasil serta
tahapan perhitungan berdasarkan snapshot yang tersimpan.

Roadmap ini melanjutkan [`moora-calculation-roadmap.md`](./moora-calculation-roadmap.md) dan akan
dibahas lebih rinci pada sesi berikutnya.

Implementasi ditempatkan di `src/routes/admin/calculation-history/` sebagai modul terpisah dari
halaman kalkulasi utama.

## 2. Ruang Lingkup

Termasuk:

- Route daftar `/admin/calculation-history`.
- Route detail `/admin/calculation-history/[id]`.
- Pagination calculation runs.
- Tampilan metadata, ranking, dan rincian snapshot setiap run.
- Navigasi antara halaman kalkulasi, daftar riwayat, dan detail run.
- State loading, empty, `404`, dan database error.
- Test minimum untuk query, pagination, snapshot mapping, dan responsive UI.

Tidak termasuk:

- Perbandingan antar-run.
- Export, chart, pencarian, atau filter lanjutan.
- Penghapusan calculation run dari UI.
- Akses sales, retention policy, dan deduplikasi run.

## 3. Fondasi yang Tersedia

Versi awal menggunakan schema yang sudah ada:

- `calculation_runs` untuk metadata run.
- `calculation_results` untuk snapshot ranking alternative.
- `calculation_details` untuk snapshot criteria dan tahapan perhitungan.

Tidak perlu menambah table atau dependency baru. Kebutuhan index database dievaluasi setelah bentuk
query pagination ditetapkan.

## 4. Halaman Daftar

`/admin/calculation-history` menampilkan:

- Run terbaru lebih dahulu.
- Nama dan waktu kalkulasi.
- Pembuat run, atau label netral jika profil sudah tidak tersedia.
- Jumlah alternative dan criteria.
- Link menuju detail run.
- Pagination menggunakan query parameter `page`.

Gunakan komponen yang sudah tersedia seperti `Card`, `Table`, `Badge`, `Button`, dan `Empty`.

## 5. Halaman Detail

`/admin/calculation-history/[id]`:

- Memvalidasi UUID route parameter.
- Mengembalikan `404` jika run tidak ditemukan.
- Membaca results dan details berdasarkan calculation run id.
- Mengonversi numeric Drizzle menjadi `number` sebelum dikirim ke UI.
- Menampilkan metadata, ranking, decision matrix, normalisasi, pembobotan, dan optimasi dari snapshot.

Detail tidak boleh membaca ulang nama alternative, metadata criterion, atau label dari master data
terbaru.

## 6. UI dan Navigasi

- Pertahankan pola visual halaman kalkulasi utama.
- Tambahkan akses menuju riwayat dari halaman kalkulasi.
- Sediakan navigasi kembali dari detail menuju daftar riwayat.
- Ekstrak komponen bersama hanya jika halaman utama dan detail benar-benar memakai tampilan yang
  sama.
- Pastikan table dan kontrol navigasi tetap dapat digunakan pada desktop dan mobile.

## 7. Tests

Test minimum mencakup:

- Daftar diurutkan dari run terbaru.
- Pagination menghasilkan offset dan metadata halaman yang benar.
- Empty state saat belum ada run.
- Detail memetakan snapshot results dan details ke kontrak UI.
- Numeric database dikonversi menjadi `number`.
- UUID tidak valid dan run tidak ditemukan menghasilkan `404`.
- Database error tidak membocorkan detail sensitif.

## 8. Urutan Implementasi

1. [ ] Tetapkan kontrak data daftar dan detail.
2. [ ] Implement query daftar dan pagination.
3. [ ] Implement UI daftar riwayat.
4. [ ] Implement query detail dan penanganan `404`.
5. [ ] Implement UI detail snapshot.
6. [ ] Tambahkan navigasi halaman kalkulasi dan riwayat.
7. [ ] Tambahkan tests.
8. [ ] Jalankan type check, lint, test, dan pemeriksaan responsive UI.

## 9. Kriteria Selesai

- Admin dapat melihat daftar calculation run secara berhalaman.
- Admin dapat membuka detail satu run melalui URL yang stabil.
- Detail lama tetap menggunakan snapshot meskipun master data berubah.
- Invalid id dan run yang tidak tersedia ditangani dengan benar.
- Halaman dapat digunakan pada desktop dan mobile.

## 10. Pembahasan Lanjutan

Bahas pada sesi terpisah setelah versi admin stabil:

- Retention policy dan batas penyimpanan.
- Deduplikasi calculation run dengan input identik.
- Akses sales dan opsi menyimpan atau hanya preview.
- Perbandingan run, export, dan visualisasi.
