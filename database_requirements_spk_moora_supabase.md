# Requirement Database Supabase — SPK Pemilihan Sepeda Motor Yamaha dengan Metode MOORA

## 1. Tujuan

Database ini digunakan untuk aplikasi Sistem Pendukung Keputusan (SPK) pemilihan sepeda motor Yamaha menggunakan metode MOORA. Sistem harus menyimpan data pengguna, alternatif sepeda motor, kriteria, nilai alternatif terhadap kriteria, riwayat perhitungan, detail normalisasi, nilai optimasi, dan ranking akhir.

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
9. `criteria.normalized_weight` disimpan sebagai cache untuk display/audit. Nilainya dihitung di **layer aplikasi** melalui shared utility `recalcNormalizedWeights()` (`$lib/utils/normalize.ts`), bukan via DB trigger. Fungsi ini dipakai di client (preview reaktif via `$derived`) dan server (validasi sebelum write).

---

## 2.1 Status terhadap Kondisi Database Saat Ini

Bagian ini menandai kesesuaian requirement dengan schema yang sudah ada sekarang, agar dokumen bisa dipakai sebagai acuan bertahap.

- `profiles.id` (FK ke `auth.users.id`): **sudah ada**.
- `profiles.name`: **sudah ada**.
- `profiles.role` dengan enum `profile_role`: **sudah ada**.
- `profiles.created_at`, `profiles.updated_at`: **sudah ada**.
- `profiles.is_active`: **sudah ada**.
- Tabel SPK lain (`alternatives`, `criteria`, `alternative_criterion_values`, dst.): **sudah dibuat**.
- Tabel `technology_features` dan `alternative_technology_features`: **sudah dihapus** — digantikan oleh feature calculator di layer kode (lihat section 4.5).
- Kolom `input_type` pada `criteria`: **sudah ada** (enum `input_type`).
- RLS saat ini baru diterapkan di `profiles`: **sudah aktif**, tetapi policy/grants masih perlu hardening pada fase implementasi.

---

## 2.2 Shared Utility: `recalcNormalizedWeights()`

`normalized_weight` pada tabel `criteria` dihitung di **application layer**, bukan via DB trigger.

Lokasi: `$lib/utils/normalize.ts`

```
recalcNormalizedWeights(criteria: { rawWeight: number; isActive: boolean }[])
  → criteria[] dengan normalizedWeight dihitung ulang
```

Logika:

```
totalRaw = sum(rawWeight dari semua kriteria aktif)
normalizedWeight_i = rawWeight_i / totalRaw
```

Alur pemakaian:

1. **Client (preview reaktif)** — dipakai di komponen edit kriteria (slider):

   ```
   let criteria = $state([])
   let withNormalized = $derived(recalcNormalizedWeights(criteria))
   ```

   UI update instan saat slider `raw_weight` digeser.

2. **Server (form action)** — validasi ulang sebelum write ke DB:
   ```
   const validated = recalcNormalizedWeights(formData.criteria)
   // simpan raw_weight + normalized_weight ke DB
   ```

Keuntungan:

- Fungsi yang **sama** dipakai client dan server — tidak ada duplikasi logika.
- Mudah di-test (pure function, tanpa DB).
- Client mendapat feedback instan, server menjamin konsistensi data.

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

### `input_type`

```sql
create type input_type as enum ('number', 'scale', 'tech_features');
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

| Kolom               | Tipe             | Constraint                     | Keterangan                                                          |
| ------------------- | ---------------- | ------------------------------ | ------------------------------------------------------------------- |
| `id`                | `uuid`           | PK default `gen_random_uuid()` | ID kriteria                                                         |
| `code`              | `text`           | unique, not null               | Kode kriteria, contoh `C1`                                          |
| `name`              | `text`           | not null                       | Nama kriteria                                                       |
| `description`       | `text`           | nullable                       | Deskripsi                                                           |
| `unit`              | `text`           | nullable                       | Satuan, contoh `cc`, `skor`, `km/liter`, `juta rupiah`              |
| `raw_weight`        | `numeric(10,4)`  | not null                       | Bobot awal skala 1–5                                                |
| `normalized_weight` | `numeric(12,9)`  | not null                       | Bobot normalisasi (dihitung di application layer, bukan DB trigger) |
| `type`              | `criterion_type` | not null                       | `benefit` atau `cost`                                               |
| `input_type`        | `input_type`     | not null default `'number'`    | Jenis input: `number`, `scale`, atau `tech_features`                |
| `order_index`       | `integer`        | not null                       | Urutan perhitungan                                                  |
| `is_active`         | `boolean`        | not null default `true`        | Status kriteria                                                     |
| `created_at`        | `timestamptz`    | not null default `now()`       | Waktu dibuat                                                        |
| `updated_at`        | `timestamptz`    | not null default `now()`       | Waktu diubah                                                        |

Data awal:

| code | name                     | unit          | raw_weight | normalized_weight | type      | input_type       | order_index |
| ---- | ------------------------ | ------------- | ---------: | ----------------: | --------- | --------------- | ----------: |
| `C1` | `Kapasitas Mesin`        | `cc`          |          4 |          0.173913 | `benefit` | `number`        |           1 |
| `C2` | `Teknologi`              | `skor`        |          5 |          0.217391 | `benefit` | `tech_features` |           2 |
| `C3` | `Konsumsi Bahan Bakar`   | `km/liter`    |          2 |          0.086957 | `benefit` | `number`        |           3 |
| `C4` | `Tahun Perakitan`        | `tahun`       |          3 |          0.130435 | `benefit` | `number`        |           4 |
| `C5` | `Ketersediaan Sparepart` | `skor`        |          1 |          0.043478 | `benefit` | `scale`         |           5 |
| `C6` | `Harga`                  | `juta rupiah` |          5 |          0.217391 | `cost`    | `number`        |           6 |
| `C7` | `Lama Inden Unit`        | `skor`        |          3 |          0.130435 | `cost`    | `scale`         |           7 |

Catatan:

- `order_index` harus mempertahankan urutan benefit terlebih dahulu, lalu cost.
- Jika `Tahun Perakitan` tidak digunakan, set `is_active = false`.
- `normalized_weight` tidak diinput manual oleh user/admin. Nilai dihitung di **layer aplikasi** via shared utility `recalcNormalizedWeights()` (`$lib/utils/normalize.ts`) — dipanggil di client untuk preview reaktif dan di server untuk validasi sebelum write ke DB.
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

## 4.5 Feature Calculator C2 Teknologi (Application Layer)

Kriteria `C2 Teknologi` tidak menggunakan tabel database terpisah. Penilaiannya dilakukan melalui **feature calculator** di layer aplikasi.

### Definisi Fitur

Daftar fitur teknologi dan skornya didefinisikan sebagai constant di:

```
$lib/constants/technology-features.ts
```

```ts
export const TECHNOLOGY_FEATURES = [
  { name: 'ABS', score: 15, aspect: 'Keselamatan' },
  { name: 'TCS', score: 15, aspect: 'Keselamatan' },
  { name: 'VVA', score: 10, aspect: 'Performa' },
  { name: 'YECVT', score: 25, aspect: 'Performa' },
  { name: 'Y-Shift/Riding Mode', score: 5, aspect: 'Performa' },
  { name: 'Hybrid Power Assist', score: 10, aspect: 'Efisiensi Tambahan' },
  { name: 'SSS', score: 5, aspect: 'Efisiensi Tambahan' },
  { name: 'Smart Key', score: 5, aspect: 'Ekosistem Digital' },
  { name: 'Y-Connect', score: 5, aspect: 'Ekosistem Digital' },
  { name: 'TFT Display', score: 5, aspect: 'Ekosistem Digital' },
] as const; // total: 100
```

### Alur Input

1. Form input C2 menampilkan **checklist fitur** (bukan dropdown/radio).
2. User mencentang fitur yang dimiliki motor → JavaScript menjumlahkan skor otomatis.
3. Hasil penjumlahan disimpan sebagai `raw_value` C2 di `alternative_criterion_values`.
4. Skor maksimal adalah 100.

### Keuntungan Pendekatan

- **0 tabel DB tambahan** — tidak perlu migrasi, RLS, atau sync data.
- **Skoring objektif** — nilai C2 berdasarkan fitur konkret, bukan subjektivitas.
- **Fitur mudah diubah** — edit satu file constant, tanpa deploy DB migration.
- **Transparan** — user melihat fitur mana yang berkontribusi ke skor.

---

## 4.6 `criterion_scales`

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

## 4.7 `calculation_runs`

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

## 4.8 `calculation_details`

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

## 4.9 `calculation_results`

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
   1 ── * calculation_details
   1 ── * calculation_results

criteria
   1 ── * alternative_criterion_values
   1 ── * criterion_scales
   1 ── * calculation_details

calculation_runs
  1 ── * calculation_details
  1 ── * calculation_results
```

---

## 5.1 Panduan ERD (Konseptual) yang Akan Digambar

Bagian ini menjadi acuan visual ERD untuk kebutuhan SPK MOORA.

### A. Legenda Simbol ERD

Gunakan simbol berikut agar diagram konsisten dan mudah dibaca:

1. Entitas: gunakan simbol **persegi panjang**.
   - Contoh: `alternatives`, `criteria`, `calculation_runs`.
2. Relasi: gunakan simbol **belah ketupat (diamond)**.
   - Contoh label relasi: "dinilai", "memiliki", "menghasilkan".
3. Atribut: gunakan simbol **oval/elips** yang terhubung ke entitas/relasi.
4. Primary key (PK): atribut **digarisbawahi**.
   - Contoh: `id`, `code` (jika dijadikan PK pada model lain).
5. Foreign key (FK): beri penanda teks **(FK)** di dekat atribut.
   - Contoh: `alternative_id (FK)`.
6. Atribut turunan/opsional:
   - Jika ingin dibedakan, gunakan catatan teks "opsional" untuk kolom nullable.
7. Kardinalitas:
   - Gunakan label di ujung garis relasi: `1`, `M` (atau `N`).
   - `1-M` berarti satu data parent bisa punya banyak data child.
   - `M-N` berarti many-to-many dan harus dipecah dengan entitas asosiasi.

Catatan:

- Jika tool diagram mendukung crow's foot notation, boleh dipakai selama makna kardinalitas tetap sama.
- Untuk menjaga keterbacaan, enum tidak perlu digambar sebagai entitas; cukup jadi catatan teks.

### B. Entitas Utama

1. `profiles`
2. `alternatives`
3. `criteria`
4. `alternative_criterion_values`
5. `criterion_scales`
6. `calculation_runs`
7. `calculation_details`
8. `calculation_results`
9. `auth.users` (sebagai entitas referensi dari Supabase Auth)

> **Catatan:** C2 Teknologi menggunakan feature calculator di application layer (`$lib/constants/technology-features.ts`), bukan entitas database terpisah.

### C. Relasi dan Kardinalitas (untuk label di garis relasi)

1. `auth.users` **1 - 1** `profiles`
2. `profiles` **1 - M** `calculation_runs`
3. `alternatives` **1 - M** `alternative_criterion_values`
4. `criteria` **1 - M** `alternative_criterion_values`
5. `criteria` **1 - M** `criterion_scales`
6. `calculation_runs` **1 - M** `calculation_details`
7. `alternatives` **1 - M** `calculation_details`
8. `criteria` **1 - M** `calculation_details`
9. `calculation_runs` **1 - M** `calculation_results`
10. `alternatives` **1 - M** `calculation_results`

Catatan konseptual:

- Relasi `alternatives` ke `criteria` secara logis adalah **M - N**, yang direalisasikan oleh entitas asosiasi `alternative_criterion_values`.

### D. Atribut Kunci yang Perlu Ditonjolkan di ERD

Gunakan penanda visual yang konsisten:

- **PK**: primary key
- **FK**: foreign key
- **UK**: unique key (opsional ditampilkan jika diagram terlalu padat)

#### `profiles`

- PK/FK: `id` -> `auth.users.id`
- Atribut penting: `name`, `role`, `is_active`, `created_at`, `updated_at`

#### `alternatives`

- PK: `id`
- UK: `code`
- Atribut penting: `name`, `category`, `img_url`, `is_active`, `created_at`, `updated_at`

#### `criteria`

- PK: `id`
- UK: `code`
- Atribut penting: `name`, `unit`, `raw_weight`, `normalized_weight`, `type`, `input_type`, `order_index`, `is_active`, `created_at`, `updated_at`

#### `alternative_criterion_values` (entitas asosiasi)

- PK: `id`
- FK: `alternative_id` -> `alternatives.id`
- FK: `criterion_id` -> `criteria.id`
- UK komposit: (`alternative_id`, `criterion_id`)
- Atribut penting: `raw_value`, `label_value`, `created_at`, `updated_at`

#### `criterion_scales`

- PK: `id`
- FK: `criterion_id` -> `criteria.id`
- Atribut penting: `label`, `value`, `description`, `order_index`, `created_at`, `updated_at`

#### `calculation_runs`

- PK: `id`
- FK: `created_by` -> `profiles.id`
- Atribut penting: `run_name`, `criteria_count`, `alternative_count`, `note`, `created_at`

#### `calculation_details`

- PK: `id`
- FK: `calculation_run_id` -> `calculation_runs.id`
- FK: `alternative_id` -> `alternatives.id`
- FK: `criterion_id` -> `criteria.id`
- UK komposit: (`calculation_run_id`, `alternative_id`, `criterion_id`)
- Atribut penting: `raw_value`, `denominator`, `normalized_value`, `weight`, `weighted_value`, `criterion_type`, `created_at`

#### `calculation_results`

- PK: `id`
- FK: `calculation_run_id` -> `calculation_runs.id`
- FK: `alternative_id` -> `alternatives.id`
- UK komposit: (`calculation_run_id`, `alternative_id`) dan (`calculation_run_id`, `rank`)
- Atribut penting: `total_benefit`, `total_cost`, `optimization_score`, `rank`, `created_at`

### E. Saran Tata Letak ERD (Agar Mudah Dibaca)

1. Letakkan tabel master di kiri/atas: `profiles`, `alternatives`, `criteria`.
2. Letakkan tabel asosiasi di tengah: `alternative_criterion_values`, `criterion_scales`.
3. Letakkan tabel histori perhitungan di kanan/bawah: `calculation_runs`, `calculation_details`, `calculation_results`.
4. Hindari garis relasi saling silang; prioritaskan keterbacaan alur:
   - master data -> matriks penilaian -> run perhitungan -> hasil ranking.

### F. Batasan Scope ERD

- ERD ini fokus pada model data logikal untuk kebutuhan SPK MOORA.
- RLS policy, trigger, function, dan view (`v_alternative_matrix`, `v_latest_ranking`) tidak wajib digambar sebagai entitas ERD.
- Enum (`profile_role`, `criterion_type`, `input_type`) boleh ditampilkan sebagai catatan di sisi diagram.

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
   - `normalized_weight` di-sync via `recalcNormalizedWeights()` (shared utility di `$lib/utils/normalize.ts`) sebelum proses hitung — dijalankan di server dalam satu transaksi bersama form action.
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
- [ ] `normalized_weight` dihitung di application layer via `recalcNormalizedWeights()` (`$lib/utils/normalize.ts`), bukan DB trigger atau input manual.
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

> **Catatan:** C2 Teknologi dinilai melalui feature calculator di application layer (`$lib/constants/technology-features.ts`), bukan tabel DB terpisah.
