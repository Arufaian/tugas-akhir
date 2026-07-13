# Roadmap — Kalkulasi MOORA

## 1. Tujuan

Memetakan pekerjaan kalkulasi MOORA setelah data alternative values lengkap dan siap digunakan
sebagai decision matrix.

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
5. Hitung denominator dan normalisasi matrix.
6. Kalikan nilai normal dengan bobot criteria.
7. Hitung total benefit dan total cost.
8. Hitung optimization score `benefit - cost`.
9. Tentukan ranking.
10. Simpan calculation run, results, dan details dalam satu transaction.

## 4. Penyimpanan Hasil

- `calculation_runs` menyimpan identitas run dan jumlah alternative/criteria.
- `calculation_results` menyimpan total benefit, total cost, optimization score, dan ranking.
- `calculation_details` menyimpan raw value, denominator, normalized value, weight, weighted value,
  dan criterion type untuk setiap cell.
- Satu run harus menyimpan snapshot hasil yang dapat dibaca kembali tanpa menghitung ulang data
  master saat ini.

## 5. Kriteria Selesai

- Kalkulasi ditolak saat decision matrix belum lengkap.
- Score dapat dihitung ulang secara deterministik dari input run yang sama.
- Criteria benefit menambah score dan criteria cost mengurangi score.
- Ranking tersimpan unik dalam setiap calculation run.
- Seluruh run, results, dan details tersimpan atomik.
- Admin dapat melihat hasil dan detail perhitungan setiap run.

## 6. Urutan Implementasi

1. Tetapkan kontrak input dan output service MOORA.
2. Implement validasi prasyarat dan pembentukan matrix.
3. Implement normalisasi, pembobotan, optimization score, dan ranking.
4. Simpan run, results, dan details dalam satu transaction.
5. Tambah tests untuk matrix tidak lengkap, benefit/cost, ranking seri, dan penyimpanan atomik.
6. Buat halaman admin untuk menjalankan kalkulasi dan membaca hasil.

## 7. Di Luar Cakupan Awal

- Perbandingan interaktif antar-run.
- Export PDF atau spreadsheet.
- Penjadwalan kalkulasi otomatis.
- Metode SPK selain MOORA.
