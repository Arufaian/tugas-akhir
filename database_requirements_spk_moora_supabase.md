# Requirement Database Supabase — SPK Pemilihan Sepeda Motor Yamaha dengan Metode MOORA

## 1. Tujuan

Database ini digunakan untuk aplikasi Sistem Pendukung Keputusan (SPK) pemilihan sepeda motor Yamaha menggunakan metode MOORA. Sistem harus menyimpan data pengguna, alternatif sepeda motor, kriteria, nilai alternatif terhadap kriteria, indikator teknologi, riwayat perhitungan, detail normalisasi, nilai optimasi, dan ranking akhir.

Database menggunakan Supabase PostgreSQL.

---

## 2. Prinsip Desain

1. Gunakan Supabase Auth untuk autentikasi.
2. Jangan membuat tabel akun dengan kolom password. Password dikelola oleh Supabase Auth.
3. Simpan profil aplikasi pada tabel `profiles` dengan `id` yang mereferensikan `auth.users.id`.
4. Simpan kriteria secara fleksibel di tabel `criteria`, bukan hard-coded di aplikasi.
5. Simpan nilai alternatif terhadap kriteria di tabel `alternative_criterion_values`.
6. Perhitungan MOORA dapat dihitung ulang dari data alternatif, kriteria, dan nilai kriteria.
7. Jika ingin menyimpan riwayat hasil perhitungan, gunakan `calculation_runs`, `calculation_details`, dan `calculation_results`.
8. Kriteria `Tahun Perakitan` masih didukung. Jika nanti tidak dipakai, set `criteria.is_active = false`, lalu hitung ulang bobot dan ranking.
9. `criteria.normalized_weight` disimpan sebagai cache untuk display/audit dan dihitung otomatis dari `raw_weight` kriteria aktif.

---

## 2.1 Status terhadap Kondisi Database Saat Ini

Bagian ini menandai kesesuaian requirement dengan schema yang sudah ada sekarang, agar dokumen bisa dipakai sebagai acuan bertahap.

- `profiles.id` (FK ke `auth.users.id`): **sudah ada**.
- `profiles.name`: **sudah ada**.
- `profiles.role` dengan enum `profile_role`: **sudah ada**.
- `profiles.created_at`, `profiles.updated_at`: **sudah ada**.
- `profiles.is_active`: **belum ada** (ditandai sebagai **tambahan fase migrasi berikutnya**, bukan blocker untuk desain SPK).
- Tabel SPK lain (`alternatives`, `criteria`, `alternative_criterion_values`, dst.): **belum dibuat**.
- RLS saat ini baru diterapkan di `profiles`: **sudah aktif**, tetapi policy/grants masih perlu hardening pada fase implementasi.

---

## 3. Enum

### `profile_role`

```sql
create type profile_role as enum ('admin', 'sales');
```

### `criterion_type`

```sql
create type criterion_type as enum ('benefit', 'cost');
```

## 4. Tabel

## 4.1 `profiles`

Tabel profil pengguna aplikasi. Terhubung dengan Supabase Auth.

Penjelasan fungsi tabel:

- Menyimpan data profil aplikasi yang melengkapi data auth bawaan Supabase.
- Menjadi sumber role (`admin`/`sales`) untuk kontrol akses aplikasi.
- Menjadi referensi user pada tabel histori seperti `calculation_runs.created_by`.

| Kolom        | Tipe           | Constraint                 | Keterangan            |
| ------------ | -------------- | -------------------------- | --------------------- |
| `id`         | `uuid`         | PK, FK `auth.users(id)`    | ID user Supabase Auth |
| `name`       | `text`         | not null                   | Nama pengguna         |
| `role`       | `profile_role` | not null default `'sales'` | Role pengguna         |
| `is_active`  | `boolean`      | not null default `true`    | Status aktif          |
| `created_at` | `timestamptz`  | not null default `now()`   | Waktu dibuat          |
| `updated_at` | `timestamptz`  | not null default `now()`   | Waktu diubah          |

Catatan:

- Jangan simpan password di tabel ini.
- Gunakan RLS.
- Admin dapat mengelola semua profil; sales hanya membaca/mengubah profil sendiri.
- Fungsi `is_active`: menonaktifkan user aplikasi tanpa menghapus akun auth/histori.
- Jika `is_active` tidak dibuat: kontrol suspend user harus dilakukan dengan cara lain (hapus user auth atau policy tambahan), biasanya lebih rumit secara operasional.

---

## 4.2 `alternatives`

Tabel master alternatif sepeda motor.

Penjelasan fungsi tabel:

- Menyimpan daftar motor yang akan dibandingkan pada proses SPK.
- Menyediakan identitas alternatif (`code`, `name`, `category`) untuk tampilan UI dan laporan.
- Menyimpan `img_url` agar UI dapat menampilkan gambar tiap alternatif.

| Kolom        | Tipe          | Constraint                     | Keterangan                                          |
| ------------ | ------------- | ------------------------------ | --------------------------------------------------- |
| `id`         | `uuid`        | PK default `gen_random_uuid()` | ID alternatif                                       |
| `code`       | `text`        | unique, not null               | Kode alternatif, contoh `A1`                        |
| `name`       | `text`        | not null                       | Nama sepeda motor                                   |
| `category`   | `text`        | nullable                       | Kategori, contoh `Maxi`, `Classy`, `Matic`, `Sport` |
| `img_url`    | `text`        | nullable                       | URL gambar motor untuk ditampilkan di UI            |
| `is_active`  | `boolean`     | not null default `true`        | Status alternatif                                   |
| `created_at` | `timestamptz` | not null default `now()`       | Waktu dibuat                                        |
| `updated_at` | `timestamptz` | not null default `now()`       | Waktu diubah                                        |

Catatan:

- Jangan simpan nilai kriteria langsung di tabel ini.
- Nilai kriteria disimpan di `alternative_criterion_values`.
- `img_url` bersifat opsional; jika kosong, UI bisa memakai placeholder image.

---

## 4.3 `criteria`

Tabel master kriteria MOORA.

Penjelasan fungsi tabel:

- Menyimpan definisi kriteria (nama, tipe benefit/cost, satuan).
- Menyimpan bobot awal (`raw_weight`) dan bobot hasil normalisasi (`normalized_weight`).
- Mengatur urutan konsisten evaluasi dan tampilan melalui `order_index`.

| Kolom               | Tipe             | Constraint                     | Keterangan                                             |
| ------------------- | ---------------- | ------------------------------ | ------------------------------------------------------ |
| `id`                | `uuid`           | PK default `gen_random_uuid()` | ID kriteria                                            |
| `code`              | `text`           | unique, not null               | Kode kriteria, contoh `C1`                             |
| `name`              | `text`           | not null                       | Nama kriteria                                          |
| `description`       | `text`           | nullable                       | Deskripsi                                              |
| `unit`              | `text`           | nullable                       | Satuan, contoh `cc`, `skor`, `km/liter`, `juta rupiah` |
| `raw_weight`        | `numeric(10,4)`  | not null                       | Bobot awal skala 1–5                                   |
| `normalized_weight` | `numeric(12,9)`  | not null                       | Bobot normalisasi (diupdate otomatis oleh sistem)      |
| `type`              | `criterion_type` | not null                       | `benefit` atau `cost`                                  |
| `order_index`       | `integer`        | not null                       | Urutan perhitungan                                     |
| `is_active`         | `boolean`        | not null default `true`        | Status kriteria                                        |
| `created_at`        | `timestamptz`    | not null default `now()`       | Waktu dibuat                                           |
| `updated_at`        | `timestamptz`    | not null default `now()`       | Waktu diubah                                           |

Data awal:

| code | name                     | unit          | raw_weight | normalized_weight | type      | order_index |
| ---- | ------------------------ | ------------- | ---------: | ----------------: | --------- | ----------: |
| `C1` | `Kapasitas Mesin`        | `cc`          |          4 |          0.173913 | `benefit` |           1 |
| `C2` | `Teknologi`              | `skor`        |          5 |          0.217391 | `benefit` |           2 |
| `C3` | `Konsumsi Bahan Bakar`   | `km/liter`    |          2 |          0.086957 | `benefit` |           3 |
| `C4` | `Tahun Perakitan`        | `tahun`       |          3 |          0.130435 | `benefit` |           4 |
| `C5` | `Ketersediaan Sparepart` | `skor`        |          1 |          0.043478 | `benefit` |           5 |
| `C6` | `Harga`                  | `juta rupiah` |          5 |          0.217391 | `cost`    |           6 |
| `C7` | `Lama Inden Unit`        | `skor`        |          3 |          0.130435 | `cost`    |           7 |

Catatan:

- `order_index` harus mempertahankan urutan benefit terlebih dahulu, lalu cost.
- Jika `Tahun Perakitan` tidak digunakan, set `is_active = false`.
- `normalized_weight` tidak diinput manual oleh user/admin; nilai dihitung ulang otomatis berdasarkan `raw_weight` semua kriteria aktif.
- Fungsi `order_index`: menjaga urutan tampilan dan urutan evaluasi kriteria tetap konsisten di UI, laporan, dan proses hitung.
- Tanpa `order_index`, urutan kriteria cenderung bergantung ke urutan insert/query yang bisa berubah dan membingungkan pengguna.

---

## 4.4 `alternative_criterion_values`

Tabel nilai setiap alternatif terhadap setiap kriteria.

Penjelasan fungsi tabel:

- Menyimpan matriks keputusan inti MOORA: nilai alternatif x kriteria.
- Menjadi sumber data utama untuk normalisasi, pembobotan, dan ranking.
- Menyediakan `label_value` untuk jejak nilai kualitatif saat input dilakukan berbasis label.

| Kolom            | Tipe            | Constraint                      | Keterangan                     |
| ---------------- | --------------- | ------------------------------- | ------------------------------ |
| `id`             | `uuid`          | PK default `gen_random_uuid()`  | ID nilai                       |
| `alternative_id` | `uuid`          | FK `alternatives(id)`, not null | Alternatif                     |
| `criterion_id`   | `uuid`          | FK `criteria(id)`, not null     | Kriteria                       |
| `raw_value`      | `numeric(14,4)` | not null                        | Nilai awal sebelum normalisasi |
| `label_value`    | `text`          | nullable                        | Label nilai kualitatif         |
| `created_at`     | `timestamptz`   | not null default `now()`        | Waktu dibuat                   |
| `updated_at`     | `timestamptz`   | not null default `now()`        | Waktu diubah                   |

Constraint:

- `unique(alternative_id, criterion_id)`
- `raw_value >= 0`

Contoh A1:

| Kriteria                  | raw_value | label_value                      |
| ------------------------- | --------: | -------------------------------- |
| C1 Kapasitas Mesin        |    124.86 | null                             |
| C2 Teknologi              |        30 | null                             |
| C3 Konsumsi Bahan Bakar   |        50 | null                             |
| C4 Tahun Perakitan        |      2024 | null                             |
| C5 Ketersediaan Sparepart |         2 | `Menengah`                       |
| C6 Harga                  |    28.315 | `Rp28.315.000`                   |
| C7 Lama Inden Unit        |         1 | `Ready stock / inden < 1 minggu` |

Catatan:

- Harga disimpan dalam satuan juta rupiah. Contoh Rp28.315.000 disimpan sebagai `28.315`.
- Konsumsi bahan bakar disimpan dalam satuan km/liter.
- Ketersediaan sparepart dan lama inden disimpan sebagai skor.

---

## 4.5 `technology_features`

Tabel indikator fitur teknologi.

Penjelasan fungsi tabel:

- Menyimpan daftar fitur teknologi beserta skor kontribusinya.
- Menjadi kamus fitur yang dipakai lintas alternatif.
- Mendukung transparansi penilaian kriteria teknologi (C2).

| Kolom         | Tipe           | Constraint                     | Keterangan   |
| ------------- | -------------- | ------------------------------ | ------------ |
| `id`          | `uuid`         | PK default `gen_random_uuid()` | ID fitur     |
| `aspect`      | `text`         | not null                       | Aspek fitur  |
| `name`        | `text`         | not null                       | Nama fitur   |
| `score`       | `numeric(8,2)` | not null                       | Skor fitur   |
| `description` | `text`         | nullable                       | Deskripsi    |
| `is_active`   | `boolean`      | not null default `true`        | Status fitur |
| `created_at`  | `timestamptz`  | not null default `now()`       | Waktu dibuat |
| `updated_at`  | `timestamptz`  | not null default `now()`       | Waktu diubah |

Data awal:

| aspect               | name                  | score |
| -------------------- | --------------------- | ----: |
| `Keselamatan`        | `ABS`                 |    15 |
| `Keselamatan`        | `TCS`                 |    15 |
| `Performa`           | `VVA`                 |    10 |
| `Performa`           | `YECVT`               |    25 |
| `Performa`           | `Y-Shift/Riding Mode` |     5 |
| `Efisiensi Tambahan` | `Hybrid Power Assist` |    10 |
| `Efisiensi Tambahan` | `SSS`                 |     5 |
| `Ekosistem Digital`  | `Smart Key`           |     5 |
| `Ekosistem Digital`  | `Y-Connect`           |     5 |
| `Ekosistem Digital`  | `TFT Display`         |     5 |

---

## 4.6 `alternative_technology_features`

Tabel relasi alternatif dan fitur teknologi.

Penjelasan fungsi tabel:

- Menghubungkan tiap alternatif dengan fitur-fitur teknologi yang dimiliki.
- Menentukan fitur aktif per alternatif lewat `is_available`.
- Menjadi dasar audit bagaimana nilai C2 terbentuk dari fitur yang benar-benar tersedia.

| Kolom                   | Tipe          | Constraint                             | Keterangan                |
| ----------------------- | ------------- | -------------------------------------- | ------------------------- |
| `id`                    | `uuid`        | PK default `gen_random_uuid()`         | ID relasi                 |
| `alternative_id`        | `uuid`        | FK `alternatives(id)`, not null        | Alternatif                |
| `technology_feature_id` | `uuid`        | FK `technology_features(id)`, not null | Fitur                     |
| `is_available`          | `boolean`     | not null default `false`               | Status ketersediaan fitur |
| `created_at`            | `timestamptz` | not null default `now()`               | Waktu dibuat              |
| `updated_at`            | `timestamptz` | not null default `now()`               | Waktu diubah              |

Constraint:

- `unique(alternative_id, technology_feature_id)`

Catatan:

- Jika `is_available = true`, skor fitur dihitung.
- Total skor fitur aktif per alternatif harus sama dengan nilai `C2 Teknologi` di `alternative_criterion_values`.
- Fungsi spesifik tabel ini: menyimpan relasi many-to-many motor dan fitur teknologi agar nilai `C2 Teknologi` transparan, dapat diaudit, dan tidak menjadi angka black-box.

---

## 4.7 `criterion_scales`

Tabel skala untuk kriteria kualitatif.

Penjelasan fungsi tabel:

- Menyimpan konversi nilai kualitatif ke numerik per kriteria.
- Menjaga konsistensi penilaian antar user karena label dan nilainya terstandar.
- Membuat aturan skala dapat diubah dari data tanpa mengubah kode aplikasi.

| Kolom          | Tipe            | Constraint                     | Keterangan      |
| -------------- | --------------- | ------------------------------ | --------------- |
| `id`           | `uuid`          | PK default `gen_random_uuid()` | ID skala        |
| `criterion_id` | `uuid`          | FK `criteria(id)`, not null    | Kriteria        |
| `label`        | `text`          | not null                       | Label skala     |
| `value`        | `numeric(10,4)` | not null                       | Nilai numerik   |
| `description`  | `text`          | nullable                       | Deskripsi       |
| `order_index`  | `integer`       | not null                       | Urutan tampilan |
| `created_at`   | `timestamptz`   | not null default `now()`       | Waktu dibuat    |
| `updated_at`   | `timestamptz`   | not null default `now()`       | Waktu diubah    |

Fungsi spesifik tabel ini:

- Memetakan label kualitatif ke angka numerik yang dipakai MOORA (contoh: `Menengah` -> `2`).
- Membuat input user lebih mudah dipahami (pilih label), sementara sistem tetap menyimpan nilai numerik untuk perhitungan.
- Memudahkan perubahan definisi skala tanpa hard-code di aplikasi.

Data awal C5 Ketersediaan Sparepart:

| label       | value | description                |
| ----------- | ----: | -------------------------- |
| `Eksklusif` |     1 | Sparepart relatif terbatas |
| `Menengah`  |     2 | Sparepart cukup tersedia   |
| `Berlimpah` |     3 | Sparepart mudah diperoleh  |

Data awal C7 Lama Inden Unit:

| label                            | value | description                                    |
| -------------------------------- | ----: | ---------------------------------------------- |
| `Ready stock / inden < 1 minggu` |     1 | Unit tersedia atau waktu tunggu sangat singkat |
| `Inden 1–2 minggu`               |     2 | Waktu tunggu singkat                           |
| `Inden 3 minggu–1 bulan`         |     3 | Waktu tunggu menengah                          |
| `Inden > 1 bulan`                |     4 | Waktu tunggu panjang                           |

---

## 4.8 `calculation_runs`

Tabel riwayat proses perhitungan MOORA.

Penjelasan fungsi tabel:

- Mencatat setiap eksekusi perhitungan sebagai satu run terpisah.
- Menyimpan metadata run seperti pembuat, jumlah kriteria, dan jumlah alternatif.
- Menjadi parent untuk detail dan hasil akhir agar histori perhitungan terstruktur.

| Kolom               | Tipe          | Constraint                     | Keterangan              |
| ------------------- | ------------- | ------------------------------ | ----------------------- |
| `id`                | `uuid`        | PK default `gen_random_uuid()` | ID run                  |
| `run_name`          | `text`        | nullable                       | Nama run                |
| `created_by`        | `uuid`        | FK `profiles(id)`, nullable    | User pembuat run        |
| `criteria_count`    | `integer`     | not null                       | Jumlah kriteria aktif   |
| `alternative_count` | `integer`     | not null                       | Jumlah alternatif aktif |
| `note`              | `text`        | nullable                       | Catatan                 |
| `created_at`        | `timestamptz` | not null default `now()`       | Waktu perhitungan       |

Catatan:

- Buat row baru setiap user menjalankan hitung MOORA.
- Simpan hasil detail dan ranking agar hasil lama tidak berubah saat data master berubah.

---

## 4.9 `calculation_details`

Tabel detail perhitungan per alternatif dan per kriteria.

Penjelasan fungsi tabel:

- Menyimpan jejak komputasi rinci per sel matriks (raw, denominator, normalized, weighted).
- Menjadi basis audit matematis jika hasil ranking dipertanyakan.
- Menjaga snapshot agar hasil lama tetap konsisten walau data master berubah.

| Kolom                | Tipe             | Constraint                          | Keterangan                       |
| -------------------- | ---------------- | ----------------------------------- | -------------------------------- |
| `id`                 | `uuid`           | PK default `gen_random_uuid()`      | ID detail                        |
| `calculation_run_id` | `uuid`           | FK `calculation_runs(id)`, not null | ID run                           |
| `alternative_id`     | `uuid`           | FK `alternatives(id)`, not null     | Alternatif                       |
| `criterion_id`       | `uuid`           | FK `criteria(id)`, not null         | Kriteria                         |
| `raw_value`          | `numeric(14,4)`  | not null                            | Nilai awal                       |
| `denominator`        | `numeric(18,9)`  | not null                            | Akar jumlah kuadrat per kriteria |
| `normalized_value`   | `numeric(18,9)`  | not null                            | Nilai normalisasi                |
| `weight`             | `numeric(12,9)`  | not null                            | Bobot normalisasi                |
| `weighted_value`     | `numeric(18,9)`  | not null                            | Nilai normalisasi dikali bobot   |
| `criterion_type`     | `criterion_type` | not null                            | Benefit atau cost                |
| `created_at`         | `timestamptz`    | not null default `now()`            | Waktu dibuat                     |

Constraint:

- `unique(calculation_run_id, alternative_id, criterion_id)`

---

## 4.10 `calculation_results`

Tabel hasil akhir MOORA per alternatif dalam satu run.

Penjelasan fungsi tabel:

- Menyimpan hasil agregat akhir per alternatif: benefit, cost, dan `optimization_score`.
- Menyimpan ranking final yang siap ditampilkan ke user.
- Menjadi sumber utama untuk halaman hasil/rekomendasi dan laporan keputusan.

| Kolom                | Tipe            | Constraint                          | Keterangan        |
| -------------------- | --------------- | ----------------------------------- | ----------------- |
| `id`                 | `uuid`          | PK default `gen_random_uuid()`      | ID hasil          |
| `calculation_run_id` | `uuid`          | FK `calculation_runs(id)`, not null | ID run            |
| `alternative_id`     | `uuid`          | FK `alternatives(id)`, not null     | Alternatif        |
| `total_benefit`      | `numeric(18,9)` | not null                            | Total benefit     |
| `total_cost`         | `numeric(18,9)` | not null                            | Total cost        |
| `optimization_score` | `numeric(18,9)` | not null                            | Nilai optimasi Yi |
| `rank`               | `integer`       | not null                            | Peringkat akhir   |
| `created_at`         | `timestamptz`   | not null default `now()`            | Waktu dibuat      |

Constraint:

- `unique(calculation_run_id, alternative_id)`
- `unique(calculation_run_id, rank)`

Catatan:

- Ranking diurutkan dari `optimization_score` terbesar ke terkecil.
- Jika nilai sama, gunakan tie-breaker berdasarkan `alternatives.code`.

---

## 5. Relasi Antar Tabel

```text
auth.users
  1 ── 1 profiles

profiles
  1 ── * calculation_runs

alternatives
  1 ── * alternative_criterion_values
  1 ── * alternative_technology_features
  1 ── * calculation_details
  1 ── * calculation_results

criteria
  1 ── * alternative_criterion_values
  1 ── * criterion_scales
  1 ── * calculation_details

technology_features
  1 ── * alternative_technology_features

calculation_runs
  1 ── * calculation_details
  1 ── * calculation_results
```

---

## 6. View yang Disarankan

## 6.1 `v_alternative_matrix`

View untuk menampilkan matriks keputusan.

Output:

- `alternative_id`
- `code`
- `name`
- `c1_engine_capacity`
- `c2_technology`
- `c3_fuel_efficiency`
- `c4_assembly_year`
- `c5_sparepart_availability`
- `c6_price_million`
- `c7_indent_duration`

## 6.2 `v_latest_ranking`

View untuk menampilkan ranking dari perhitungan terbaru.

Output:

- `calculation_run_id`
- `rank`
- `alternative_code`
- `alternative_name`
- `total_benefit`
- `total_cost`
- `optimization_score`

---

## 7. Aturan Perhitungan MOORA

AI agent harus melakukan langkah berikut:

1. Ambil semua kriteria aktif dari `criteria`, urutkan berdasarkan `order_index`.
   - Pastikan `normalized_weight` sudah tersinkron otomatis sebelum proses hitung (atau hitung ulang di dalam transaksi run).
2. Ambil semua alternatif aktif dari `alternatives`.
3. Ambil semua nilai dari `alternative_criterion_values`.
4. Untuk setiap kriteria, hitung denominator:

```text
denominator_j = sqrt(sum(raw_value_ij ^ 2))
```

5. Hitung normalisasi:

```text
normalized_value_ij = raw_value_ij / denominator_j
```

6. Hitung nilai terbobot:

```text
weighted_value_ij = normalized_value_ij * normalized_weight_j
```

7. Hitung total benefit:

```text
total_benefit_i = sum(weighted_value_ij where criterion_type = 'benefit')
```

8. Hitung total cost:

```text
total_cost_i = sum(weighted_value_ij where criterion_type = 'cost')
```

9. Hitung nilai optimasi:

```text
optimization_score_i = total_benefit_i - total_cost_i
```

10. Ranking diurutkan dari `optimization_score` terbesar ke terkecil.

---

## 8. RLS Policy Minimum

Aktifkan RLS pada semua tabel.

| Tabel                             | Read                        | Insert/Update/Delete                 |
| --------------------------------- | --------------------------- | ------------------------------------ |
| `profiles`                        | User own profile, admin all | User own profile terbatas, admin all |
| `alternatives`                    | authenticated users         | admin only                           |
| `criteria`                        | authenticated users         | admin only                           |
| `alternative_criterion_values`    | authenticated users         | admin only                           |
| `technology_features`             | authenticated users         | admin only                           |
| `alternative_technology_features` | authenticated users         | admin only                           |
| `criterion_scales`                | authenticated users         | admin only                           |
| `calculation_runs`                | admin all, sales own        | sales insert own, admin all          |
| `calculation_details`             | admin all, sales own run    | via server/RPC only                  |
| `calculation_results`             | admin all, sales own run    | via server/RPC only                  |

---

## 9. Checklist Implementasi

- [ ] Semua primary key menggunakan `uuid`.
- [ ] Semua tabel memiliki `created_at`.
- [ ] Tabel master memiliki `updated_at`.
- [ ] Semua foreign key dibuat.
- [ ] RLS aktif di semua tabel.
- [ ] Tidak ada password manual di database.
- [ ] `criteria.order_index` mengikuti urutan benefit dulu, cost setelahnya.
- [ ] Harga disimpan sebagai angka dalam juta rupiah.
- [ ] Total bobot normalisasi kriteria aktif harus 1.
- [ ] `normalized_weight` dihitung otomatis dari `raw_weight` kriteria aktif (bukan input manual).
- [ ] Ranking berasal dari `optimization_score`, bukan dari nilai normalisasi.
- [ ] Ranking diurutkan dari nilai optimasi terbesar ke terkecil.

---

## 10. Tabel Minimal untuk MVP

Jika ingin implementasi cepat, buat minimal:

1. `profiles`
2. `alternatives`
3. `criteria`
4. `alternative_criterion_values`
5. `calculation_runs`
6. `calculation_details`
7. `calculation_results`

Tabel `technology_features` dan `alternative_technology_features` dapat dibuat setelah MVP, tetapi lebih baik dibuat dari awal jika penilaian teknologi ingin transparan.
