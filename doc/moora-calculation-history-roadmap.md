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

Database remote saat perencanaan backend sudah memiliki calculation run beserta result dan detail.
Schema snapshot yang tersedia sudah cukup untuk kontrak UI sehingga implementasi backend tidak
memerlukan perubahan kolom atau table.

## 4. Halaman Daftar

`/admin/calculation-history` menampilkan:

- Run terbaru lebih dahulu.
- Nama dan waktu kalkulasi.
- Pembuat run, atau label netral jika profil sudah tidak tersedia.
- Jumlah alternative dan criteria.
- Link menuju detail run.
- Pagination menggunakan query parameter `page`.

Gunakan komponen yang sudah tersedia seperti `Card`, `Table`, `Badge`, `Button`, dan `Empty`.

### 4.1 Query dan Pagination

- Validasi query parameter `page` sebagai integer positif dan gunakan halaman pertama untuk nilai
  yang tidak valid.
- Gunakan page size tetap sebanyak 10 run.
- Hitung total run terlebih dahulu, lalu batasi halaman aktif agar tidak melebihi total halaman.
- Ambil data menggunakan `limit` dan `offset`.
- Urutkan secara deterministik dengan `created_at DESC` lalu `id DESC`.
- Gunakan `left join` ke profile agar run tetap tampil ketika profile pembuat tidak tersedia.
- Gunakan label netral ketika nama pembuat tidak tersedia.
- Pesan database error harus generik dan tidak boleh menyertakan detail internal.

## 5. Halaman Detail

`/admin/calculation-history/[id]`:

- Memvalidasi UUID route parameter.
- Mengembalikan `404` jika run tidak ditemukan.
- Membaca results dan details berdasarkan calculation run id.
- Mengonversi numeric Drizzle menjadi `number` sebelum dikirim ke UI.
- Menampilkan metadata, ranking, decision matrix, normalisasi, pembobotan, dan optimasi dari snapshot.

Detail tidak boleh membaca ulang nama alternative, metadata criterion, atau label dari master data
terbaru.

### 5.1 Read Service dan Snapshot Mapping

Buat satu read service sederhana di `src/lib/server/services/moora-history.ts`. Service menangani:

- Query daftar run dan metadata pagination.
- Query run terbaru untuk halaman kalkulasi utama.
- Query satu run berdasarkan id untuk halaman detail.
- Pembacaan calculation results dan calculation details berdasarkan run id.
- Konversi seluruh numeric Drizzle menjadi `number`.
- Mapping criteria, alternatives, matrix rows, dan ranking ke kontrak UI.

Mapping snapshot yang saat ini berada di `src/routes/admin/moora-calculation/+page.server.ts`
dipindahkan ke service tersebut agar halaman kalkulasi utama dan detail riwayat tidak memiliki dua
implementasi mapping. Tidak perlu menambah repository layer, class, RPC, view, atau dependency baru.

Route detail tetap bertanggung jawab untuk validasi UUID dan status HTTP:

- UUID tidak valid menghasilkan `404` tanpa menjalankan query database.
- Run yang tidak ditemukan menghasilkan `404`.
- Database error menghasilkan `500` dengan pesan generik.

### 5.2 Penggantian Mock

Setelah query backend siap:

- Ganti sumber data pada kedua `+page.server.ts` dengan read service.
- Hapus `mock-data.ts` dan query preview `?mock=empty`.
- Pertahankan kontrak props dan markup halaman yang sudah disetujui.
- Empty state berasal dari hasil query database yang tidak memiliki run.
- Ubah test mock menjadi test query, pagination, mapping, dan error handling.

## 6. UI dan Navigasi

- Pertahankan pola visual halaman kalkulasi utama.
- Tambahkan akses menuju riwayat dari halaman kalkulasi.
- Sediakan navigasi kembali dari detail menuju daftar riwayat.
- Ekstrak komponen bersama hanya jika halaman utama dan detail benar-benar memakai tampilan yang
  sama.
- Pastikan table dan kontrol navigasi tetap dapat digunakan pada desktop dan mobile.

### 6.1 Arah Tampilan

Halaman daftar menggunakan pola audit workspace yang ringkas, bukan dashboard baru:

- Header berisi judul, deskripsi, dan tombol menuju halaman kalkulasi MOORA.
- Satu `Card` berisi `Table` calculation run dengan kolom nama dan waktu, pembuat, jumlah data,
  serta aksi menuju detail.
- Nama dan waktu ditempatkan dalam satu kolom agar table tetap ringkas.
- Pagination ditempatkan di bawah table dan tetap menggunakan query parameter `page`.
- Pada mobile, table menggunakan horizontal scroll yang sudah disediakan oleh `Table.Root`.
- Empty state mengarahkan admin ke halaman kalkulasi untuk membuat run pertama.

Halaman detail mempertahankan pola hasil pada halaman kalkulasi utama:

- Navigasi kembali menuju daftar riwayat.
- Header dan `Card` metadata menampilkan nama run, waktu, pembuat, jumlah alternative, dan jumlah
  criteria.
- `Tabs` memisahkan hasil peringkat dan rincian perhitungan.
- `Stepper` menampilkan decision matrix, normalisasi, pembobotan, dan optimasi.
- Nilai perhitungan menggunakan angka tabular dan matrix mempertahankan kolom alternative yang
  sticky pada layar sempit.
- Ekstrak tampilan hasil bersama hanya ketika halaman kalkulasi utama dan detail memakai kontrak dan
  markup yang benar-benar sama.

Tidak perlu menambah chart, kartu terpisah untuk setiap run, pencarian, filter, dialog metadata, atau
animasi khusus.

### 6.2 Komponen UI

Komponen yang sudah tersedia dan digunakan:

- `Card` untuk metadata dan wadah table.
- `Table` untuk daftar run, ranking, dan matrix.
- `Badge` untuk rank, kode alternative, dan tipe criterion.
- `Button` untuk navigasi dan aksi.
- `Empty` untuk kondisi tanpa run dan `404`.
- `Alert` untuk database error dengan pesan generik.
- `Tabs` dan `Stepper` untuk audit tahapan perhitungan.
- `Pagination` untuk navigasi halaman daftar.
- `BackLinkButton` untuk kembali dari detail.
- `Breadcrumb` dan `Sidebar` untuk navigasi admin.

Loading navigasi sudah ditangani oleh `src/lib/components/loading-overlay.svelte`. Tidak perlu memakai
`DataTable` karena daftar tidak memiliki sorting, pencarian, filter, atau pagination client-side.

### 6.3 Implementasi Mock Terlebih Dahulu

UI daftar dan detail dibuat menggunakan mock data sebelum dihubungkan ke query database.

- Bentuk mock harus sama dengan kontrak data final dari `load()` daftar dan detail.
- Mock mencakup daftar berisi data, pagination lebih dari satu halaman, detail lengkap, dan empty
  state.
- Gunakan UUID stabil pada mock agar link daftar ke detail dapat diuji.
- Jangan menambahkan timeout buatan, repository mock, dependency, atau abstraction khusus mock.
- Setelah UI disetujui, ganti sumber mock dengan query server tanpa mengubah struktur utama UI.
- State `404` dan database error diterapkan saat route server dihubungkan ke database.

### 6.4 Keputusan Index

Index unik yang sudah tersedia pada calculation results dan calculation details telah mencakup kolom
awal `calculation_run_id`, sehingga lookup snapshot per run tidak memerlukan index baru.

Index pagination `calculation_runs(created_at, id)` belum ditambahkan karena jumlah run masih kecil
dan belum ada hasil `EXPLAIN` yang menunjukkan kebutuhan nyata. Evaluasi kembali index setelah volume
run bertambah atau query list menunjukkan sequential scan dan sort yang terukur.

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

1. [x] Tetapkan kontrak data daftar dan detail.
2. [x] Buat mock data yang mengikuti kontrak final.
3. [x] Implement UI daftar, pagination, dan empty state menggunakan mock data.
4. [x] Implement UI detail metadata, ranking, dan tahapan snapshot menggunakan mock data.
5. [x] Periksa responsive UI daftar dan detail.
6. [x] Buat read service dan pindahkan snapshot mapping dari halaman kalkulasi utama.
7. [x] Implement query daftar, count, pagination, dan fallback pembuat.
8. [x] Implement query detail dan penanganan UUID, `404`, serta database error.
9. [x] Ganti sumber mock pada route daftar dan detail lalu hapus fixture mock.
10. [x] Tambahkan tests untuk query, pagination, mapping, numeric conversion, dan error handling.
11. [x] Verifikasi dengan data database, type check, lint, test, build, dan database advisors.
12. [x] Evaluasi index pagination menggunakan volume data dan query plan.

Navigasi halaman kalkulasi dan riwayat sudah diselesaikan pada fase UI mock.

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
