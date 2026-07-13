# Roadmap Kalkulasi MOORA

## 1. Tujuan

Mengganti implementasi mock pada `/admin/moora-calculation` dengan kalkulasi MOORA yang membaca
data aktif dari database, memvalidasi kesiapan decision matrix, menghitung hasil, dan menyimpannya
secara atomik.

Panduan rumus dan contoh langkah demi langkah tersedia di
[`moora-calculation-guide.md`](./moora-calculation-guide.md).

Roadmap ini hanya mencakup halaman kalkulasi utama. Daftar dan detail riwayat kalkulasi akan dibahas
dalam roadmap terpisah setelah kontrak kalkulasi utama stabil.

## 2. Ruang Lingkup

Termasuk:

- Schema snapshot untuk calculation results dan details.
- Migration schema dan foreign key.
- Validasi kesiapan decision matrix.
- Service kalkulasi MOORA.
- Transaction persistence untuk run, results, dan details.
- `load()` dan action `calculate` pada halaman kalkulasi utama.
- Penggantian mock UI dengan data backend nyata.
- Guard penghapusan alternative yang sudah digunakan.
- Test minimum untuk rumus, validasi, transaction boundary, dan delete guard.

Tidak termasuk:

- Route `/admin/moora-calculation/history`.
- Route `/admin/moora-calculation/history/[id]`.
- Pagination calculation runs.
- UI daftar dan detail riwayat.
- Perbandingan antar-run.
- Export, chart, penjadwalan, atau metode SPK lain.

Walaupun UI riwayat belum dibuat, snapshot tetap disimpan sekarang agar setiap run tidak bergantung
pada nama atau metadata master yang dapat berubah.

## 3. Prasyarat Kalkulasi

Kalkulasi hanya dapat dijalankan jika:

- Minimal satu alternative aktif tersedia.
- Minimal satu criterion aktif tersedia.
- Semua alternative aktif memiliki nilai untuk semua criteria aktif.
- Total normalized weight criteria aktif sama dengan `1.0` dalam toleransi precision database.
- Tidak ada normalized weight bernilai nol.
- Criterion bertipe scale memiliki opsi aktif dan nilai yang dipilih masih valid.
- Seluruh raw value finite dan nonnegatif.
- Nilai pembagi normalisasi setiap criterion lebih besar dari nol.

Gunakan kembali `checkDecisionMatrixCompleteness()` dari
`src/lib/server/services/decision-matrix.ts`. Kalkulasi harus ditolak sebelum penyimpanan jika salah
satu prasyarat tidak terpenuhi.

## 4. Schema dan Migration

Schema diselesaikan sebelum service, route, dan UI dihubungkan ke database.

### 4.1 Calculation Runs

`calculation_runs` tetap menyimpan:

- Identitas run.
- Nama run yang dibuat dari waktu kalkulasi.
- Admin pembuat run.
- Jumlah alternative.
- Jumlah criteria.
- Waktu pembuatan.

Tidak perlu menambah metadata atau catatan wajib pada tahap ini.

### 4.2 Calculation Results

Tambahkan snapshot berikut pada `calculation_results`:

- `alternative_code` sebagai `text not null`.
- `alternative_name` sebagai `text not null`.

Tetap simpan `alternative_id` untuk integritas referensial. Snapshot category tidak diperlukan karena
tidak digunakan dalam rumus atau identitas utama hasil.

### 4.3 Calculation Details

Tambahkan snapshot berikut pada `calculation_details`:

- `criterion_code` sebagai `text not null`.
- `criterion_name` sebagai `text not null`.
- `criterion_unit` sebagai `text not null`.
- `criterion_order_index` sebagai `integer not null`.
- `criterion_input_type` menggunakan enum input type yang sudah tersedia.
- `label_value` sebagai `text` nullable.

Kolom perhitungan yang sudah ada tetap digunakan:

- Raw value.
- Denominator atau nilai pembagi normalisasi.
- Normalized value.
- Weight.
- Weighted value.
- Criterion type benefit/cost.

Kolom database `criterionType` dirapikan menjadi `criterion_type` pada migration yang sama agar
konsisten dengan penamaan `snake_case` schema lainnya.

Snapshot alternative tidak perlu diduplikasi pada setiap detail karena tersedia pada result dalam run
yang sama.

### 4.4 Foreign Key

Aturan foreign key:

- Result dan detail ke calculation run tetap `ON DELETE CASCADE`.
- Result dan detail ke alternative menjadi `ON DELETE RESTRICT`.
- Detail ke criterion menjadi `ON DELETE RESTRICT`.

Dengan aturan ini, satu run dapat dihapus secara utuh, tetapi master yang sudah dipakai tidak dapat
menghapus histori secara tidak sengaja.

### 4.5 Urutan Migration

1. Perbarui file schema Drizzle.
2. Jalankan `bun run db:generate`.
3. Periksa SQL agar hanya melakukan rename `criterion_type`, menambah kolom snapshot, dan mengganti
   foreign key terkait.
4. Jalankan `bun run db:migrate`.
5. Verifikasi kolom, constraint, dan foreign key pada database.
6. Jalankan Supabase security dan performance advisors.

Tidak perlu membuat table baru, trigger, function, atau dependency database tambahan.

## 5. Service Kalkulasi

Buat `src/lib/server/services/moora.ts`. Tidak perlu repository layer, class calculator, queue,
cache, RPC, atau dependency decimal baru.

### 5.1 Input

Service menerima:

- Active alternatives beserta id, kode, dan nama.
- Active criteria beserta kode, nama, unit, urutan, tipe, input type, dan normalized weight.
- Alternative criterion values beserta raw value dan label value.
- Active criterion scales untuk validasi nilai scale.

### 5.2 Output

Service menghasilkan:

- Decision matrix.
- Nilai pembagi normalisasi setiap criterion.
- Normalized matrix.
- Weighted matrix.
- Total benefit, total cost, optimization score, dan ranking setiap alternative.
- Result rows dan detail rows yang sudah memuat snapshot serta siap disimpan.

### 5.3 Perhitungan

Gunakan `Number` dan `Math.sqrt`. Pertahankan precision penuh selama kalkulasi dan format nilai
persistensi sampai 9 angka desimal.

Urutan rumus:

1. `x*_{ij} = x_{ij} / sqrt(sum_{k=1}^{m} x_{kj}^2)`.
2. `v_{ij} = w_j * x*_{ij}`.
3. `B_i = sum(v_{ij})` untuk criteria benefit.
4. `K_i = sum(v_{ij})` untuk criteria cost.
5. `Y_i = B_i - K_i`.
6. Urutkan score 9 desimal secara menurun.
7. Gunakan kode alternative secara ascending sebagai tie-breaker.

### 5.4 Snapshot Label

- Nilai number tidak memerlukan label.
- Nilai scale menggunakan label scale yang tersimpan pada value.
- Nilai `tech_features` diubah dari JSON feature ids menjadi nama fitur yang dapat dibaca.
- Label disimpan pada detail agar tampilan hasil tidak perlu membaca ulang metadata input saat ini.

## 6. Transaction dan Persistence

Pembacaan input, validasi, kalkulasi, dan penyimpanan dijalankan dalam satu Drizzle transaction
dengan isolation level `repeatable read`.

Urutan transaction:

1. Ambil active alternatives.
2. Ambil active criteria.
3. Ambil alternative criterion values.
4. Ambil active criterion scales.
5. Validasi dan hitung hasil MOORA.
6. Insert satu calculation run dan ambil id-nya.
7. Bulk insert seluruh calculation results.
8. Bulk insert seluruh calculation details.
9. Commit hanya jika seluruh operasi berhasil.

Jangan insert result atau detail satu per satu. Error pada result atau detail harus membatalkan seluruh
run.

## 7. Route Server Utama

`/admin/moora-calculation/+page.server.ts` menangani dua kebutuhan.

### 7.1 Load

`load()` mengembalikan:

- Status readiness dan daftar masalah.
- Run terbaru jika tersedia.
- Results dan details dari run terbaru.
- Data matrix yang sudah dipetakan ke kontrak UI.

Numeric dari Drizzle dikonversi ke `number` sebelum dikirim ke UI.

### 7.2 Action Calculate

Action `calculate`:

- Mengambil user tervalidasi dari `safeGetSession()` untuk `created_by`.
- Menjalankan transaction service.
- Mengembalikan run id saat berhasil.
- Mengembalikan `fail(400, ...)` untuk data yang belum siap.
- Mengembalikan pesan generik untuk database error.

Admin authorization tetap ditangani oleh RBAC hook yang sudah melindungi seluruh route `/admin`.

## 8. UI Halaman Utama

Pertahankan struktur mock UI yang sudah tersedia, lalu ganti sumber datanya.

### 8.1 Perubahan Wajib

- Hapus fixture server statis.
- Hapus simulasi timeout kalkulasi.
- Ubah tombol menjadi enhanced form action `calculate`.
- Hapus badge `Mock data`.
- Hapus tampilan category alternative karena bukan bagian snapshot hasil.
- Ganti label `Denominator` menjadi `Nilai pembagi normalisasi`.
- Buat caption matrix berdasarkan jumlah data nyata.

### 8.2 State Halaman

Halaman mendukung:

1. Belum siap: tampilkan masalah dan nonaktifkan tombol kalkulasi.
2. Siap tanpa run: tampilkan empty state dan tombol aktif.
3. Sedang menghitung: nonaktifkan tombol dan tampilkan spinner.
4. Berhasil: tampilkan run terbaru, ranking, dan rincian perhitungan.
5. Gagal: tampilkan toast tanpa menghilangkan hasil run sebelumnya.

### 8.3 Tampilan Hasil

Gunakan komponen yang sudah tersedia:

- `Alert` untuk masalah readiness.
- `Empty` untuk kondisi tanpa run.
- `Tabs` untuk hasil dan rincian.
- `Stepper` untuk empat tahap perhitungan.
- `Table` untuk ranking dan matrix.
- `Card`, `Badge`, `Button`, dan `Spinner` untuk metadata serta action.
- `svelte-sonner` untuk feedback.

Tidak perlu menambah chart, dialog metadata, data table interaktif, atau dependency UI baru.

## 9. Guard Penghapusan Alternative

Perbarui endpoint delete alternative agar:

1. Validasi UUID.
2. Lock alternative dengan `FOR UPDATE` di dalam transaction.
3. Return `404` jika alternative tidak ditemukan.
4. Return `409` jika alternative memiliki values.
5. Return `409` jika alternative memiliki calculation results.
6. Hapus row database jika tidak digunakan.
7. Bersihkan gambar Storage hanya setelah database berhasil dihapus.

FK `RESTRICT` menjadi perlindungan terakhir jika penghapusan tidak melewati endpoint aplikasi.

## 10. Tests

Tambahkan test minimum berikut.

### 10.1 Pure Calculation

Gunakan satu fixture kecil berisi 2-3 alternatives dan 2 criteria, satu benefit dan satu cost.

Test mencakup:

- Matrix tidak lengkap.
- Bobot tidak valid atau nol.
- Raw value tidak finite atau negatif.
- Nilai pembagi normalisasi nol.
- Normalisasi dan pembobotan.
- Total benefit dan cost.
- Optimization score.
- Ranking.
- Score seri dengan tie-breaker kode.

### 10.2 Persistence Contract

Test route/service dengan mock Drizzle untuk memastikan:

- Transaction menggunakan `repeatable read`.
- Run diinsert satu kali.
- Results diinsert secara bulk.
- Details diinsert secara bulk.
- Validation failure tidak melakukan insert.
- Result atau detail insert failure tidak menghasilkan response sukses.
- Snapshot berasal dari input saat kalkulasi.

Tidak perlu menambah test database infrastructure hanya untuk membuktikan rollback bawaan PostgreSQL.

### 10.3 Delete Guard

Test mencakup:

- Alternative dengan values menghasilkan `409`.
- Alternative dengan calculation results menghasilkan `409`.
- Database dihapus sebelum Storage cleanup.
- Database failure tidak membersihkan gambar.

## 11. Urutan Implementasi

1. [x] Buat mock UI menggunakan bentuk data hasil akhir.
2. [x] Perbarui schema calculation results dan details.
3. [x] Generate, periksa, dan jalankan migration.
4. [x] Implement pure calculation service.
5. [x] Tambahkan unit test rumus dan validasi.
6. [x] Implement transaction persistence dan bulk insert.
7. [x] Tambahkan test persistence contract.
8. [x] Implement `load()` dan action `calculate`.
9. [x] Hubungkan data nyata ke Tabs dan Stepper.
10. [x] Implement state readiness, empty, loading, success, dan error.
11. [ ] Implement guard penghapusan alternative beserta test.
12. [ ] Jalankan type check, lint, test, dan pemeriksaan responsive UI.

## 12. Kriteria Selesai

- Kalkulasi ditolak saat decision matrix belum lengkap atau tidak valid.
- Criteria benefit menambah score dan criteria cost mengurangi score.
- Score seri menghasilkan ranking deterministik berdasarkan kode alternative.
- Run, results, dan details tersimpan dalam satu transaction.
- Results dan details disimpan secara bulk.
- Setiap result menyimpan snapshot kode dan nama alternative.
- Setiap detail menyimpan snapshot metadata criterion dan label value.
- Alternative atau criterion yang sudah digunakan tidak dapat dihapus permanen.
- Halaman utama tidak lagi menggunakan fixture atau simulasi kalkulasi.
- Admin dapat menjalankan kalkulasi dan mengaudit empat tahap perhitungan.
- Halaman tetap dapat digunakan pada desktop dan mobile.

## 13. Pekerjaan Lanjutan

Route dan UI riwayat akan direncanakan dalam `moora-calculation-history-roadmap.md` setelah roadmap
ini selesai. Roadmap tersebut nantinya membahas backend list/detail run, pagination, snapshot detail,
status `404`, frontend daftar/detail, navigasi, dan ekstraksi komponen bersama.

### 13.1 Akses Sales dan Retensi

- Akses sales dirancang melalui route terpisah karena `/admin` tetap khusus admin.
- Kalkulasi sales secara default hanya preview dan tidak disimpan.
- Penyimpanan ke riwayat menjadi aksi eksplisit, bukan efek otomatis setiap kalkulasi.
- Admin tetap dapat membuat run resmi yang selalu tersimpan.
- Gunakan kembali run terbaru ketika input belum berubah agar tidak menyimpan snapshot identik.
- Sebelum mengaktifkan penyimpanan untuk sales, tentukan retention policy. Pada worst case 100 run
  maksimal per hari, estimasi Free Tier hanya sekitar 39-65 hari.
