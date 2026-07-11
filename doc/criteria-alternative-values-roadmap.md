# Roadmap — Criteria dan Alternative Values

## 1. Tujuan

Memetakan pekerjaan modul criteria yang perlu diselesaikan sebelum merge branch sekarang, lalu pekerjaan lanjutan saat fitur `alternative_criterion_values` mulai diimplementasikan.

## 2. Kerjakan Sekarang

### 2.1 Perbaiki Deteksi Normalisasi Bobot

Saat ini `needsNormalization` menghitung total `normalizedWeight` dari semua kriteria, termasuk yang tidak aktif. Untuk MOORA, bobot yang dipakai harus berasal dari kriteria aktif.

Ubah logika di `src/routes/admin/criteria/+page.server.ts`:

- [x] Hitung `normalizedSum` hanya dari criteria aktif.
- [x] `hasZeroWeight` tetap hanya untuk criteria aktif.
- [x] Return `normalizedSum` agar UI bisa menampilkan total bobot normal.

Kriteria selesai:

- [x] Jika active criteria sudah berjumlah `1.0`, indikator "Bobot perlu disesuaikan" tidak muncul.
- [x] Inactive criteria tidak membuat status normalisasi stale.

### 2.2 Update `updatedAt` Saat Normalize

Action `normalize` perlu mengubah `updatedAt` bersama `normalizedWeight`.

Kriteria selesai:

- [x] Setiap criteria yang dinormalisasi mendapat `updatedAt: new Date()`.

### 2.3 Tampilkan Kesiapan Skala di Criteria List

Kriteria dengan `inputType = 'scale'` membutuhkan minimal satu row di `criterion_scales`.

Tambahkan data dari `criterion_scales` ke load `/admin/criteria`:

- [x] `scaleCount` per criterion.
- [x] `scaleCriteriaCount`.
- [x] `emptyScaleCriteriaCount`.

Kriteria selesai:

- [x] Row criteria bertipe `scale` menampilkan jumlah skala.
- [x] `0 skala` terlihat sebagai warning.
- [x] Criteria non-scale tidak dipaksa punya skala.

### 2.4 Tambahkan Summary Kesiapan Skala

Tambahkan ringkasan kecil di halaman criteria:

- Total kriteria skala.
- Jumlah kriteria skala tanpa scale.

Catatan implementasi:

- [x] UI summary ditambahkan.
- [x] Summary tersambung ke count asli dari `criterion_scales`.

Kriteria selesai:

- Admin bisa melihat apakah data master scale sudah siap sebelum input nilai alternatif.

### 2.5 Konsisten Zod v4 untuk UUID

Di `src/routes/admin/criteria/[id]/+server.ts`, ganti:

```ts
z.string().uuid();
```

menjadi:

```ts
z.uuid();
```

Kriteria selesai:

- [x] Validasi UUID route criteria memakai API Zod 4 yang konsisten dengan file lain.

## 3. Tunda Sampai Alternative Values

### 3.1 Form Input Nilai Alternatif per Criteria

Pola yang dipilih: **overview progres lalu form nilai per alternative**.

`/admin/alternative-values` adalah halaman overview, bukan form matrix.

- Menampilkan summary active alternatives, active criteria, nilai terisi, dan nilai kosong.
- Menampilkan progres setiap alternative: jumlah criteria terisi dan status lengkap/belum lengkap.
- Menampilkan readiness warning untuk alternatives, criteria, normalisasi bobot, dan scale kosong.
- Tidak ada input nilai, autosave, spreadsheet library, atau matrix read-only pada halaman ini.

Form input berada di `/admin/alternatives/[id]/values`.

- Satu form menampilkan seluruh active criteria untuk satu alternative.
- Setelah simpan berhasil, halaman memuat ulang data alternative tersebut.
- Criteria `scale` tanpa opsi tampil sebagai warning dan tidak dapat disimpan.
- Alternative tidak aktif atau tidak ditemukan menghasilkan not found/redirect.
- Matrix read-only untuk membandingkan seluruh alternative ditunda sampai benar-benar dibutuhkan
  sebelum kalkulasi MOORA.

Mapping minimal:

| inputType       | UI                             | Nilai yang disimpan                                                        |
| --------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `number`        | Input number                   | `rawValue` dari input                                                      |
| `scale`         | Select dari `criterion_scales` | `rawValue = criterion_scales.value`, `labelValue = criterion_scales.label` |
| `tech_features` | Checklist fitur teknologi      | `rawValue` = total skor 0-100; `labelValue` = JSON ID fitur terpilih       |

Kontrak `tech_features`:

- Daftar fitur dan skornya tetap di `src/lib/constants/technology-features.ts`.
- Server menghitung ulang skor dari ID fitur yang valid; total dari browser tidak dipercaya.
- `labelValue` menyimpan JSON ID fitur agar checklist dapat dipulihkan saat edit.
- Nilai `0` adalah penilaian valid tanpa fitur; cell yang belum dinilai tidak memiliki row database.

Catatan implementasi form:

- Load mengambil alternative aktif terkait, active criteria, existing
  `alternative_criterion_values`, dan `criterion_scales`.
- Input `number` menyimpan `rawValue` dari form.
- Input `scale` hanya menerima opsi `criterion_scales` milik criterion; server menetapkan
  `rawValue` dan `labelValue` dari database.
- Input `tech_features` adalah checklist fitur; server menghitung total skor dan menyimpan JSON
  ID fitur di `labelValue`.
- Nilai lama yang dikosongkan menghapus row database terkait. Input kosong baru tidak membuat row.
- Action memvalidasi seluruh payload sebelum menjalankan delete/upsert dalam satu transaction.

Kriteria selesai:

- Setiap alternative punya maksimal satu value per criterion.
- Constraint unique `(alternativeId, criterionId)` tetap dipakai.
- `rawValue` selalu numerik dan non-negative.
- Admin bisa menyimpan semua nilai criteria untuk satu alternative dari satu halaman.
- Criteria scale hanya bisa dipilih dari opsi `criterion_scales` milik criteria tersebut.
- Criteria scale yang belum punya opsi tidak menyebabkan submit gagal untuk cell lain.

Status dan pekerjaan tersisa:

- [x] Ubah `/admin/alternative-values` dari matrix input menjadi overview progres.
- [ ] Validasi setiap input terhadap batas `numeric(14,4)`: non-negatif, maksimal 10 digit sebelum desimal, dan maksimal 4 digit desimal.
- [ ] Buat form `/admin/alternatives/[id]/values` berdasarkan active criteria.
- [ ] Validasi alternative, criteria, dan seluruh payload form secara ketat di server.
- [ ] Jalankan delete dan upsert dalam satu transaction agar save gagal secara atomik.
- [ ] Filter nilai dan scale di query load ke alternative dan criteria aktif yang dipakai form.
- [ ] Tambahkan label aksesibel dan satuan untuk seluruh input angka.
- [x] Tetapkan daftar 10 fitur teknologi tetap dengan total skor maksimum 100.
- [x] Tambahkan constant dan validasi perhitungan skor fitur.
- [x] Hapus nilai `tech_features` di atas 100 yang tidak dapat dipetakan kembali ke fitur asal.
- [ ] Tambahkan checklist `tech_features` ke form alternative.
- [ ] Validasi ID fitur dan hitung skor di action server.

### 3.2 Guard Delete Criteria

Saat `alternative_criterion_values` sudah dipakai, delete criteria tidak boleh diam-diam menghapus data penilaian penting lewat cascade tanpa konfirmasi kuat.

Pilihan minimal:

- Blok delete jika criteria sudah punya alternative values.
- Return pesan: `Kriteria sudah digunakan pada nilai alternatif`.

Kriteria selesai:

- Criteria kosong tetap bisa dihapus.
- Criteria yang sudah dipakai tidak terhapus tanpa sengaja.

### 3.3 Guard Delete Criterion Scale

Jika scale sudah pernah dipakai sebagai `labelValue` atau raw value untuk alternative, delete scale bisa membuat histori membingungkan.

Pilihan minimal:

- Blok delete scale jika ada alternative value dengan criterion yang sama dan `labelValue` sama.
- Kalau butuh lebih kuat, tambahkan `criterionScaleId` FK di `alternative_criterion_values`.

Kriteria selesai:

- Scale yang sudah dipakai tidak hilang diam-diam.
- Admin mendapat pesan kenapa scale tidak bisa dihapus.

### 3.3.1 Guard Update Criterion Scale

Mengubah `value` atau menghapus scale yang sudah dipakai dapat membuat `rawValue` dan `labelValue` pada matrix tidak lagi merujuk ke opsi yang valid.

Pilihan minimal:

- Blok perubahan `value` dan delete jika scale sudah digunakan oleh alternative value.
- Label dan deskripsi masih boleh diperbarui, tetapi pertimbangkan apakah histori nilai perlu mempertahankan label lama.

Kriteria selesai:

- Nilai matrix yang tersimpan selalu dapat dipetakan ke opsi scale yang masih valid.
- Summary matrix tidak menghitung nilai scale yatim sebagai cell terisi.

### 3.4 Validasi Kelengkapan Decision Matrix

Sebelum kalkulasi MOORA, sistem perlu memastikan semua alternative aktif punya value untuk semua criteria aktif.

Kriteria selesai:

- Ada checker yang menghasilkan alternative mana yang belum lengkap.
- Ada checker yang menghasilkan criterion mana yang belum diisi.
- Kalkulasi MOORA ditolak jika matrix belum lengkap.

### 3.5 Service Kalkulasi MOORA

Setelah data matrix lengkap, buat service kalkulasi MOORA.

Urutan minimal:

1. Ambil active alternatives.
2. Ambil active criteria.
3. Ambil alternative criterion values.
4. Bentuk matrix.
5. Normalisasi matrix.
6. Kalikan bobot.
7. Hitung score benefit minus cost.
8. Simpan calculation result dan details.

Kriteria selesai:

- Score bisa dihitung ulang dari data saat ini.
- `calculation_details` menyimpan raw value, normalized value, weighted value, dan contribution.

## 4. Urutan Implementasi Disarankan

### Sekarang

1. Fix active-only normalization.
2. Tambah `normalizedSum` ke load dan tampilkan di UI.
3. Join/count `criterion_scales` di criteria load.
4. Tambah badge jumlah scale di criteria table.
5. Tambah summary scale readiness.
6. Ganti validasi UUID delete criteria ke `z.uuid()`.
7. Jalankan `bun run check`, `bunx eslint <changed files>`, dan `bun run test`.

### Saat Alternative Values

1. Buat schema validasi alternative criterion value.
2. Ubah `/admin/alternative-values` menjadi overview kelengkapan per alternative.
3. Buat form nilai per alternative berdasarkan active criteria.
4. Implement checklist `tech_features` dan mapping `scale` ke `rawValue` + `labelValue`.
5. Validasi dan simpan seluruh form dalam satu transaction.
6. Tambah completeness checker.
7. Tambah guard delete criteria dan scale.
8. Implement MOORA calculation service.
9. Tambah tests untuk mapping scale, feature calculator, completeness checker, dan kalkulasi MOORA.

## 5. Yang Tidak Dikerjakan Sekarang

- Tidak membuat FK `criterionScaleId` di `alternative_criterion_values`.
- Tidak membuat calculation service.
- Tidak membuat guard delete berbasis alternative values.
- Tidak membuat matrix read-only untuk membandingkan nilai semua alternative.
- Tidak mengubah cascade DB sekarang.

Alasannya: data entry memakai form per alternative agar input number, scale, dan feature checklist
tetap sederhana. Matrix read-only, guard delete, dan kalkulasi penuh dikerjakan saat kebutuhan
operasionalnya sudah masuk flow utama.
