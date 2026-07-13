# Roadmap — Kalkulasi MOORA

## 1. Tujuan

Memetakan pekerjaan kalkulasi MOORA setelah data alternative values lengkap dan siap digunakan
sebagai decision matrix.

Panduan rumus dan contoh langkah demi langkah tersedia di
[`moora-calculation-guide.md`](./moora-calculation-guide.md).

## 2. Prasyarat

- Semua alternative aktif memiliki nilai untuk semua criteria aktif.
- Bobot criteria aktif sudah dinormalisasi dan berjumlah `1.0`.
- Criteria bertipe scale memiliki opsi yang valid.
- Tidak ada nilai scale yatim atau nilai criteria yang tidak sesuai tipe input.
- Completeness checker dari
  [`criteria-alternative-values-roadmap.md`](./criteria-alternative-values-roadmap.md) sudah tersedia.

Kalkulasi harus ditolak jika salah satu prasyarat belum terpenuhi.

## 3. Service Kalkulasi

Urutan minimal:

1. Ambil active alternatives.
2. Ambil active criteria.
3. Ambil `alternative_criterion_values`.
4. Bentuk decision matrix.
5. Normalisasi matrix menggunakan norma Euclidean setiap kolom criterion.
6. Kalikan nilai normal dengan bobot criteria.
7. Hitung total benefit dan total cost.
8. Hitung optimization score `benefit - cost`.
9. Tentukan ranking secara menurun berdasarkan optimization score. Jika score sama, gunakan kode
   alternative sebagai tie-breaker agar ranking tetap unik dan deterministik.
10. Simpan calculation run, results, dan details dalam satu transaction.

## 4. Penyimpanan Hasil

- `calculation_runs` menyimpan identitas run dan jumlah alternative/criteria.
- `calculation_results` menyimpan snapshot kode dan nama alternative, total benefit, total cost,
  optimization score, dan ranking.
- `calculation_details` menyimpan raw value, denominator, normalized value, weight, weighted value,
  criterion type, serta snapshot kode, nama, unit, urutan, input type, dan label value criterion
  untuk setiap cell.
- Satu run harus menyimpan snapshot hasil yang dapat dibaca kembali tanpa menghitung ulang data
  master saat ini.
- Alternative yang sudah digunakan dalam histori tidak dapat dihapus permanen.
- Run, results, dan details disimpan dalam satu transaction. Kegagalan insert result atau detail
  harus membatalkan seluruh run.

## 5. Implementasi Backend

### 5.1 Kontrak Service

Buat `src/lib/server/services/moora.ts` sebagai service kalkulasi. Tidak perlu repository layer,
class kalkulator, queue, cache, RPC, atau dependency decimal baru.

Input service memuat:

- Active alternatives beserta id, kode, dan nama.
- Active criteria beserta metadata snapshot, tipe benefit/cost, input type, urutan, dan normalized
  weight.
- Alternative criterion values beserta raw value dan label value.
- Active criterion scales untuk validasi nilai scale.

Output service memuat:

- Decision matrix.
- Nilai pembagi normalisasi setiap criterion.
- Normalized matrix.
- Weighted matrix.
- Total benefit, total cost, optimization score, dan ranking setiap alternative.
- Results dan details yang siap disimpan.

### 5.2 Validasi Kalkulasi

Gunakan kembali `checkDecisionMatrixCompleteness()` dari
`src/lib/server/services/decision-matrix.ts`, lalu validasi:

- Minimal satu active alternative dan satu active criterion.
- Seluruh cell matrix lengkap dan nilai scale masih valid.
- Total normalized weight criteria aktif sama dengan `1.0` dan tidak ada bobot nol.
- Seluruh raw value finite dan nonnegatif.
- Nilai pembagi normalisasi setiap criterion lebih besar dari nol.

Kalkulasi ditolak sebelum penyimpanan jika salah satu validasi gagal.

### 5.3 Perhitungan

Gunakan `Number` dan `Math.sqrt`; format nilai persistensi sampai 9 angka desimal sesuai precision
database.

Urutan rumus:

1. `x*_{ij} = x_{ij} / sqrt(sum_{k=1}^{m} x_{kj}^2)`.
2. `v_{ij} = w_j * x*_{ij}`.
3. `B_i = sum(v_{ij})` untuk benefit.
4. `K_i = sum(v_{ij})` untuk cost.
5. `Y_i = B_i - K_i`.
6. Urutkan score 9 desimal secara menurun dan gunakan kode alternative sebagai tie-breaker.

### 5.4 Transaction dan Persistence

Jalankan pembacaan input, validasi, kalkulasi, dan penyimpanan dalam satu Drizzle transaction dengan
isolation level `repeatable read`.

Urutan transaction:

1. Ambil active alternatives, criteria, values, dan scales.
2. Validasi readiness dan bentuk decision matrix.
3. Hitung seluruh hasil MOORA.
4. Insert satu calculation run dan ambil id-nya.
5. Bulk insert seluruh calculation results.
6. Bulk insert seluruh calculation details.
7. Commit hanya jika seluruh operasi berhasil.

Jangan melakukan insert result/detail satu per satu. Setiap error harus me-rollback seluruh run.

### 5.5 Route Server

`/admin/moora-calculation/+page.server.ts` menangani:

- `load()` untuk readiness, run terbaru, results, dan details terbaru.
- Action `calculate` untuk memvalidasi admin, menjalankan service, dan mengembalikan run id.
- Validation error sebagai `fail(400, ...)` dan database error tanpa membocorkan detail internal.

`/admin/moora-calculation/history/+page.server.ts` mengambil daftar run dengan pagination sederhana
20 row per halaman.

`/admin/moora-calculation/history/[id]/+page.server.ts` mengambil snapshot run, results, dan details,
serta return `404` jika run tidak ditemukan.

Halaman histori harus membaca label snapshot, bukan join nama terbaru dari master data.

### 5.6 Guard Penghapusan Alternative

Perbarui endpoint delete alternative agar:

1. Mengunci dan memastikan alternative masih ada.
2. Menolak hard delete dengan status `409` jika memiliki values atau calculation history.
3. Menghapus row database sebelum mencoba membersihkan gambar Storage.
4. Mempertahankan alternative dan gambar jika delete database gagal.

FK `RESTRICT` menjadi perlindungan terakhir jika penghapusan tidak melewati endpoint aplikasi.

### 5.7 Tests

Tambahkan test minimum untuk:

- Matrix tidak lengkap, bobot tidak valid, raw value tidak valid, dan nilai pembagi nol.
- Normalisasi, pembobotan, benefit/cost, optimization score, dan ranking.
- Score seri dengan tie-breaker kode alternative.
- Rollback run ketika insert result atau detail gagal.
- Alternative dengan values atau calculation history tidak dapat dihapus.
- Perubahan master tidak mengubah snapshot lama.
- Detail history yang tidak ditemukan menghasilkan `404`.

Gunakan satu fixture kecil berisi 2–3 alternatives dan 2 criteria (satu benefit dan satu cost) untuk
menguji rumus utama.

## 6. UI/UX Halaman Kalkulasi

Halaman memiliki satu tugas utama: menjalankan kalkulasi MOORA dan membuat hasilnya mudah diaudit
oleh admin.

### 6.1 Route

- `/admin/moora-calculation` untuk readiness, menjalankan kalkulasi, dan membaca hasil terbaru.
- `/admin/moora-calculation/history` untuk daftar calculation run.
- `/admin/moora-calculation/history/[id]` untuk membaca snapshot satu run.

Kalkulasi langsung dijalankan saat admin menekan `Hitung MOORA`. Tidak perlu dialog nama atau
catatan karena `runName` dan `note` bersifat opsional. Nama run dapat dibuat dari waktu kalkulasi.

### 6.2 Struktur Halaman Utama

Urutan tampilan:

1. Header halaman, status readiness, tombol `Hitung MOORA`, dan tautan ke riwayat.
2. Alert prasyarat jika data belum siap beserta tautan ke halaman yang perlu diperbaiki.
3. Metadata run terbaru: nama/waktu, jumlah alternative, dan jumlah criteria.
4. Tabs `Hasil & Peringkat` dan `Rincian Perhitungan`.

Tab default adalah `Hasil & Peringkat`. Status readiness dan tombol kalkulasi berada di luar Tabs
agar selalu terlihat.

### 6.3 Hasil dan Peringkat

Tampilkan satu table dengan kolom:

- Ranking.
- Kode dan nama alternative.
- Total benefit.
- Total cost.
- Optimization score (`Y_i`).

Hasil diurutkan dari optimization score terbesar. Ranking pertama diberi penekanan visual tanpa
menambah podium, chart, atau dekorasi lain yang tidak membantu pembacaan data.

### 6.4 Rincian Perhitungan

Gunakan Stepper sebagai navigasi tahapan matematis, bukan indikator proses asynchronous:

1. **Matriks Keputusan (`X`)**: raw value setiap alternative terhadap setiap criterion.
2. **Matriks Normalisasi (`X*`)**:
   `x*_{ij} = x_{ij} / sqrt(sum_{k=1}^{m} x_{kj}^2)`. Nilai pembagi normalisasi ditampilkan sebagai
   metadata pada kolom criterion, bukan sebagai matrix terpisah.
3. **Matriks Normalisasi Terbobot (`V`)**: `v_{ij} = w_j * x*_{ij}`.
4. **Nilai Optimasi (`Y_i`)**: total benefit, total cost, dan `Y_i = B_i - K_i`.

Setiap tahap dapat dipilih langsung dan menyediakan tombol `Sebelumnya` serta `Selanjutnya`.
Gunakan label pendek pada navigasi: `Keputusan`, `Normalisasi`, `Terbobot`, dan `Optimasi`.

Ketentuan table matrix:

- Baris merepresentasikan alternative dan kolom merepresentasikan criterion.
- Header criterion menampilkan kode, normalized weight, serta badge `Benefit` atau `Cost`.
- Angka rata kanan dengan `tabular-nums` dan ditampilkan konsisten sampai 6 angka desimal.
- Table menggunakan horizontal scroll pada viewport sempit; matrix tidak diubah menjadi cards.
- Kode/nama alternative tetap mudah dikenali selama table digulir.

### 6.5 State Halaman

1. **Belum siap**: tampilkan masalah readiness dan nonaktifkan tombol kalkulasi.
2. **Siap, belum ada run**: tampilkan empty state dan tombol kalkulasi aktif.
3. **Sedang menghitung**: nonaktifkan tombol dan tampilkan spinner untuk mencegah request ganda.
4. **Berhasil**: tampilkan hasil terbaru, ranking, dan rincian matrix.
5. **Gagal**: tampilkan toast error tanpa menghilangkan hasil run sebelumnya.
6. **Riwayat kosong**: tampilkan empty state dengan tautan kembali ke halaman kalkulasi.
7. **Snapshot tidak ditemukan**: return status `404` dan pesan yang jelas.

### 6.6 Komponen UI

Gunakan komponen yang sudah tersedia di `src/lib/components/ui`:

- `Tabs` untuk memisahkan hasil dan rincian.
- `Stepper` untuk empat tahap perhitungan.
- `Table` untuk ranking dan matrix.
- `Card` untuk metadata run dan kelompok konten.
- `Badge` untuk readiness serta tipe benefit/cost.
- `Alert` untuk masalah prasyarat.
- `Button` dan `Spinner` untuk action kalkulasi.
- `Empty` untuk kondisi tanpa hasil atau riwayat.
- `Skeleton` untuk loading placeholder bila dibutuhkan.
- `svelte-sonner` untuk feedback action.

Tidak perlu menambah chart, data table interaktif, dialog metadata, atau dependency UI baru pada
tahap awal.

### 6.7 Status Implementasi UI Mock

Selesai:

- [x] Tambahkan fixture server statis berisi 5 alternatives dan 7 criteria.
- [x] Tampilkan header, readiness badge, metadata run terbaru, dan simulasi tombol kalkulasi.
- [x] Tampilkan tab `Hasil & Peringkat` dengan ranking, benefit, cost, dan optimization score.
- [x] Tampilkan tab `Rincian Perhitungan` dengan Stepper untuk matriks keputusan, normalisasi,
      normalisasi terbobot, dan nilai optimasi.
- [x] Tambahkan ikon, deskripsi, direct navigation, serta tombol previous/next pada Stepper.
- [x] Tampilkan kode, nama, unit, bobot, tipe benefit/cost, raw label, nilai pembagi normalisasi, dan
      angka sampai 6 desimal pada matrix.
- [x] Gunakan horizontal scroll, sticky alternative column, semantic color, table caption, dan
      keyboard-accessible controls.
- [x] Verifikasi Svelte autofixer, type check, ESLint, dan test suite.

Tersisa:

- [ ] Ganti fixture dan simulasi kalkulasi dengan load/action backend nyata.
- [ ] Ganti badge `Mock data` setelah hasil berasal dari calculation run tersimpan.
- [ ] Tampilkan alert readiness, empty state, error state, dan loading state berbasis data nyata.
- [ ] Tambahkan tautan serta halaman daftar dan detail riwayat.
- [ ] Gunakan istilah `Nilai pembagi normalisasi` menggantikan label `Denominator` pada UI.
- [ ] Ekstrak tampilan hasil menjadi komponen bersama hanya saat detail riwayat membutuhkannya.

## 7. Kriteria Selesai

- Kalkulasi ditolak saat decision matrix belum lengkap.
- Score dapat dihitung ulang secara deterministik dari input run yang sama.
- Criteria benefit menambah score dan criteria cost mengurangi score.
- Ranking tersimpan unik dalam setiap calculation run.
- Score seri menghasilkan ranking deterministik berdasarkan kode alternative.
- Seluruh run, results, dan details tersimpan atomik.
- Kegagalan menyimpan result atau detail tidak meninggalkan calculation run parsial.
- Alternative yang sudah digunakan dalam histori tidak dapat dihapus permanen.
- Perubahan data master tidak mengubah identitas alternative atau criterion pada snapshot lama.
- Admin dapat melihat hasil terbaru melalui Tabs dan seluruh tahap perhitungan melalui Stepper.
- Admin dapat membuka daftar riwayat dan membaca snapshot setiap run tanpa menghitung ulang.
- Halaman tetap dapat digunakan pada desktop dan mobile, termasuk table matrix yang dapat digulir.

## 8. Urutan Implementasi

1. [x] Buat mock UI menggunakan kontrak snapshot final.
2. Tambahkan kolom snapshot alternative dan criterion pada calculation results/details.
3. Implement kontrak, validasi, dan pure calculation service MOORA.
4. Tambah unit test rumus, benefit/cost, nilai pembagi nol, dan ranking seri.
5. Implement transaction persistence beserta bulk insert results/details.
6. Tambah test rollback penyimpanan dan snapshot setelah master berubah.
7. Implement action kalkulasi dan load hasil terbaru.
8. Tambah guard serta test penghapusan alternative yang sudah memiliki histori.
9. Implement backend dan UI daftar riwayat serta detail snapshot run.
10. Hubungkan hasil nyata ke Tabs dan empat tahap Stepper.
11. Verifikasi responsive layout, keyboard navigation, dark mode, dan state kosong/error.

## 9. Di Luar Cakupan Awal

- Perbandingan interaktif antar-run.
- Export PDF atau spreadsheet.
- Penjadwalan kalkulasi otomatis.
- Metode SPK selain MOORA.
- Chart hasil atau podium ranking.
- Dialog untuk mengisi nama dan catatan run.
- Sinkronisasi Tabs atau Stepper ke URL.
