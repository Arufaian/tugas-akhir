# Roadmap — Criteria dan Alternative Values

## 1. Tujuan

Memetakan pekerjaan modul criteria yang perlu diselesaikan sebelum merge branch sekarang, lalu pekerjaan lanjutan saat fitur `alternative_criterion_values` mulai diimplementasikan.

## 2. Kerjakan Sekarang

### 2.1 Perbaiki Deteksi Normalisasi Bobot

Saat ini `needsNormalization` menghitung total `normalizedWeight` dari semua kriteria, termasuk yang tidak aktif. Untuk MOORA, bobot yang dipakai harus berasal dari kriteria aktif.

Ubah logika di `src/routes/admin/criteria/+page.server.ts`:

- Hitung `normalizedSum` hanya dari criteria aktif.
- `hasZeroWeight` tetap hanya untuk criteria aktif.
- Return `normalizedSum` agar UI bisa menampilkan total bobot normal.

Kriteria selesai:

- Jika active criteria sudah berjumlah `1.0`, indikator "Bobot perlu disesuaikan" tidak muncul.
- Inactive criteria tidak membuat status normalisasi stale.

### 2.2 Update `updatedAt` Saat Normalize

Action `normalize` perlu mengubah `updatedAt` bersama `normalizedWeight`.

Kriteria selesai:

- Setiap criteria yang dinormalisasi mendapat `updatedAt: new Date()`.

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

Saat fitur alternative values dibuat, form input nilai harus mengikuti `criteria.inputType`.

Mapping minimal:

| inputType       | UI                             | Nilai yang disimpan                                                        |
| --------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `number`        | Input number                   | `rawValue` dari input                                                      |
| `scale`         | Select dari `criterion_scales` | `rawValue = criterion_scales.value`, `labelValue = criterion_scales.label` |
| `tech_features` | Ditentukan nanti               | `rawValue` hasil mapping fitur                                             |

Kriteria selesai:

- Setiap alternative punya maksimal satu value per criterion.
- Constraint unique `(alternativeId, criterionId)` tetap dipakai.
- `rawValue` selalu numerik dan non-negative.

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
2. Buat UI input values berdasarkan active criteria.
3. Implement mapping `scale` ke `rawValue` + `labelValue`.
4. Tambah completeness checker.
5. Tambah guard delete criteria.
6. Tambah guard delete scale.
7. Implement MOORA calculation service.
8. Tambah tests untuk mapping scale, completeness checker, dan kalkulasi MOORA.

## 5. Yang Tidak Dikerjakan Sekarang

- Tidak membuat FK `criterionScaleId` di `alternative_criterion_values`.
- Tidak membuat calculation service.
- Tidak membuat guard delete berbasis alternative values.
- Tidak membuat UI input alternative values.
- Tidak mengubah cascade DB sekarang.

Alasannya: branch sekarang fokus merapikan criteria dan scales. Alternative values belum masuk flow utama, jadi guard dan kalkulasi penuh lebih aman dikerjakan saat data entry alternative values dibuat.
