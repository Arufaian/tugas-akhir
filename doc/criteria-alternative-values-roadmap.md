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

### 3.1 Form Input Nilai Criteria per Alternative

#### 3.1.1 Alur Utama

Pola yang dipilih: **overview progres lalu form nilai per alternative**.

`/admin/alternative-values` adalah halaman overview, bukan form matrix.

Form input berada di `/admin/alternatives/[id]/values` sebagai subresource dari satu alternative.

- Satu form menampilkan seluruh active criteria untuk satu alternative.
- Matrix read-only untuk membandingkan seluruh alternative ditunda sampai benar-benar dibutuhkan
  sebelum kalkulasi MOORA.

#### 3.1.2 UI/UX

Halaman overview:

- Menampilkan summary active alternatives, active criteria, nilai terisi, dan nilai kosong.
- Menampilkan progres setiap alternative: jumlah criteria terisi dan status lengkap/belum lengkap.
- Menampilkan readiness warning untuk alternatives, criteria, normalisasi bobot, dan scale kosong.
- Menyediakan link **Isi/Edit Nilai** ke `/admin/alternatives/[id]/values`.
- Tidak memiliki input nilai, autosave, spreadsheet library, atau matrix read-only.

Halaman form:

- Gunakan satu `<form method="POST" use:enhance>` yang membungkus satu `Card.Root`.
- Gunakan `Card.Header` untuk identitas alternative, `Card.Content` untuk seluruh criteria, dan
  `Card.Footer` untuk tombol batal dan simpan. Tidak perlu satu card per criteria.
- Gunakan `Field.Group` sebagai container criteria dan `Field.Separator` sebagai pemisah.
- Form menggunakan satu kolom agar mudah dipindai di desktop dan mobile.

Konfigurasi Superforms:

```ts
superForm(data.form, {
	dataType: 'json',
	multipleSubmits: 'prevent',
	resetForm: false,
	invalidateAll: 'pessimistic'
});
```

- JSON mode mengirim seluruh `$formData.values`, termasuk boolean `false`, array kosong, dan state
  control yang dinonaktifkan, tanpa bergantung pada serialisasi native `FormData`.
- Inisialisasi `$formData.values` dari active criteria. Setiap item selalu memiliki `criterionId`,
  `value`, `isAssessed`, dan `selectedFeatureIds`.
- `criterionId` tidak memerlukan hidden input karena seluruh state dikirim sebagai JSON.
- Render criteria dengan keyed `{#each}` berdasarkan `criterionId`, bukan index sebagai identity.

Formsnap dan Field:

- Gunakan `Form.Field` pada leaf path `values[{index}].value`,
  `values[{index}].isAssessed`, dan `values[{index}].selectedFeatureIds`.
- `Form.ElementField` tidak digunakan karena komponen tersebut ditujukan untuk field yang langsung
  merepresentasikan satu elemen array, bukan property dari object array.
- Gunakan `Form.Control` dan `Form.FieldErrors` untuk koneksi control, atribut aksesibel,
  constraints, dan validation error.
- Gunakan `Field.Field`, `Field.Content`, dan `Field.Description` untuk layout visual.
- Input tunggal `number`, `scale`, dan `isAssessed` menggunakan `Form.Label` agar label terhubung
  dengan ID dari Formsnap.
- Kelompok fitur menggunakan `Field.Set` + `Field.Legend`; setiap checkbox menggunakan
  `Field.Label` dengan `for` yang sesuai. Jangan gabungkan `Form.Fieldset` dengan `Field.Set` agar
  tidak menghasilkan fieldset bertingkat.
- Ambil `errors` dari snippet `Form.Field`, gunakan `data-invalid={errors.length > 0}` pada wrapper,
  dan sebarkan props `Form.Control` tanpa mengganti ID atau atribut ARIA yang disediakan Formsnap.
- Validation error tampil inline; toast hanya digunakan untuk sukses atau kegagalan penyimpanan
  secara keseluruhan.

Komponen per tipe input:

| inputType       | Komponen shadcn-svelte                                               | Nilai yang disimpan                                                        |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `number`        | `InputGroup.Input`; addon satuan bersifat kondisional                | String desimal tervalidasi disimpan sebagai `rawValue`                     |
| `scale`         | `Select` dari `criterion_scales`; `Alert` jika opsi kosong           | `rawValue = criterion_scales.value`, `labelValue = criterion_scales.label` |
| `tech_features` | `Switch` status penilaian + kelompok `Checkbox` + `Badge` skor fitur | `rawValue` = total skor 0-100; `labelValue` = JSON ID fitur terpilih       |

Detail interaksi:

- `number` selalu menggunakan `InputGroup.Root` + `InputGroup.Input` dengan `type="text"` dan
  `inputmode="decimal"` agar nilai tetap berupa string. Render `InputGroup.Addon` +
  `InputGroup.Text` hanya jika satuan tersedia.
- `scale` menggunakan `Select.Root`, `Select.Trigger`, `Select.Content`, dan `Select.Item`.
  `Select.Group` hanya digunakan jika opsi memang memiliki kelompok semantik.
- Untuk `Select`, destructure props `Form.Control` menjadi `name` dan `triggerProps`; berikan
  `name` ke `Select.Root` dan `triggerProps` ke `Select.Trigger`. Trigger menampilkan label opsi
  terpilih, bukan angka mentah.
- Criteria scale tanpa opsi tetap memiliki item state dengan `criterionId` dan `value: ''`.
  Tampilkan `Alert.Root`, `Alert.Title`, dan `Alert.Description` dengan ikon `AlertTriangle`, lalu
  jangan render Select aktif. Nilai criteria lain tetap dapat disimpan.
- `isAssessed` menggunakan satu `Form.Field`, satu `Form.Control`, `Switch`, dan `Form.Label`
  berlabel **Penilaian fitur sudah dilakukan**. Deskripsi menjelaskan bahwa switch tetap
  diaktifkan saat tidak ada fitur agar nilai `0` tercatat.
- `selectedFeatureIds` menggunakan satu `Form.Field` untuk seluruh array, satu `Field.Set`, satu
  `Field.Legend`, dan satu `Form.Control` terpisah untuk setiap checkbox agar ID dan label unik.
  Letakkan satu `Form.FieldErrors` setelah seluruh kelompok.
- Setiap checkbox menggunakan `value={feature.id}` dan binding getter/setter untuk memperbarui
  membership `selectedFeatureIds` secara immutable tanpa ID duplikat. Tampilkan skor fitur dengan
  `Badge`.
- Saat `isAssessed = false`, checkbox dinonaktifkan tetapi `selectedFeatureIds` tidak dihapus dari
  state client. Payload JSON tetap boleh membawa array tersebut; server mengabaikannya. Jika switch
  diaktifkan kembali sebelum meninggalkan halaman, pilihan sebelumnya langsung muncul kembali.
- Tombol submit menggunakan `Form.Button disabled={$submitting}` dan menampilkan
  `<Spinner aria-label="Menyimpan" />` serta teks **Menyimpan...** selama submit.
- Tombol batal menggunakan `Button variant="outline"` untuk kembali ke halaman overview.
- Action mengembalikan message sukses/error. Callback `onUpdated` menampilkan toast hanya ketika
  message tersedia; invalidasi pessimistic memuat hasil load terbaru tanpa mereset form lebih dulu.
- Tidak menggunakan dialog konfirmasi, autosave, accordion, atau sticky footer.

#### 3.1.3 Backend dan Data

Load halaman:

- Mengambil alternative aktif terkait, active criteria, existing `alternative_criterion_values`,
  dan `criterion_scales` yang relevan.
- Memfilter nilai dan scale di query berdasarkan alternative dan active criteria yang dipakai form.
- Alternative tidak aktif atau tidak ditemukan menghasilkan `404`.

Payload form minimal:

```ts
{
	values: Array<{
		criterionId: string;
		value: string;
		selectedFeatureIds: string[];
		isAssessed: boolean;
	}>;
}
```

- `value` dikirim sebagai string agar validasi batas `numeric(14,4)` tidak terkena pembulatan
  JavaScript.
- Untuk tipe yang tidak memakai property tertentu, kirim nilai netral: `value: ''`,
  `selectedFeatureIds: []`, atau `isAssessed: false`. Server hanya membaca property yang relevan
  berdasarkan tipe criteria dari database.
- Browser tidak mengirim atau menentukan `inputType`; server mengambil tipe criteria berdasarkan
  `criterionId` dari database.
- Server memvalidasi seluruh payload sebelum melakukan perubahan database.

Validasi dan mapping:

- Input `number` harus berupa desimal non-negatif, maksimal 10 digit sebelum desimal, dan maksimal
  4 digit setelah desimal. Nilai disimpan sebagai string numeric.
- Input `scale` hanya menerima opsi `criterion_scales` milik criterion terkait. Server menetapkan
  `rawValue` dan `labelValue` dari database.
- Daftar fitur teknologi dan skornya tetap di
  `src/lib/constants/technology-features.ts`.
- Server memvalidasi ID fitur dan menghitung ulang skor; total dari browser tidak dipercaya.
- `labelValue` untuk `tech_features` menyimpan JSON ID fitur agar checklist dapat dipulihkan saat
  edit.
- Nilai `0` valid saat `isAssessed = true` tanpa fitur terpilih. Cell dengan
  `isAssessed = false` dianggap belum dinilai dan tidak memiliki row database.

Penyimpanan:

- Nilai lama `number`/`scale` yang dikosongkan atau `tech_features` dengan `isAssessed = false`
  menghapus row database terkait. Input kosong baru tidak membuat row.
- Delete dan upsert dijalankan dalam satu transaction agar penyimpanan gagal secara atomik.
- Constraint unique `(alternativeId, criterionId)` tetap menjamin maksimal satu value per
  criterion untuk setiap alternative.
- Hapus action `save` lama dari `/admin/alternative-values` agar hanya form per alternative yang
  dapat menulis nilai.

#### 3.1.4 Kriteria Selesai UI/UX

- Admin dapat membuka form isi/edit nilai dari halaman overview.
- Admin dapat mengisi seluruh active criteria untuk satu alternative dari satu halaman.
- Seluruh input memiliki label aksesibel dan input angka menampilkan satuan jika tersedia.
- Criteria scale tanpa opsi menampilkan warning tanpa menggagalkan penyimpanan criteria lain.
- Checklist fitur kosong yang sudah dinilai dapat dibedakan dari cell yang belum dinilai.
- Submit menampilkan status proses, mencegah submit berulang, dan memberikan toast hasil.

#### 3.1.5 Kriteria Selesai Backend

- Setiap alternative memiliki maksimal satu value per criterion.
- `rawValue` selalu numerik, non-negative, dan sesuai batas `numeric(14,4)`.
- Criteria scale hanya dapat dipilih dari opsi milik criterion tersebut.
- Skor `tech_features` selalu dihitung ulang dari ID fitur yang valid.
- Nilai yang dikosongkan dihapus dan seluruh perubahan disimpan dalam satu transaction.
- Alternative tidak aktif atau tidak ditemukan tidak dapat menerima nilai.

#### 3.1.6 Status Pekerjaan

UI/UX:

- [x] Ubah `/admin/alternative-values` dari matrix input menjadi overview progres.
- [x] Buat form `/admin/alternatives/[id]/values` berdasarkan active criteria.
- [x] Tambahkan label aksesibel dan satuan untuk input angka jika tersedia.
- [x] Tambahkan checklist `tech_features` dan kontrol `isAssessed`.
- [x] Tambahkan link isi/edit nilai dari overview ke `/admin/alternatives/[id]/values`.
- [x] Tambahkan status submit, toast hasil, dan invalidasi data setelah penyimpanan.

Backend:

- [x] Validasi setiap input terhadap batas `numeric(14,4)`: non-negatif, maksimal 10 digit
      sebelum desimal, dan maksimal 4 digit desimal.
- [x] Validasi alternative, criteria, dan seluruh payload form secara ketat di server.
- [x] Jalankan delete dan upsert dalam satu transaction agar save gagal secara atomik.
- [x] Filter nilai dan scale di query load ke alternative dan criteria aktif yang dipakai form.
- [x] Tetapkan daftar 10 fitur teknologi tetap dengan total skor maksimum 100.
- [x] Tambahkan constant dan validasi perhitungan skor fitur.
- [x] Hapus nilai `tech_features` di atas 100 yang tidak dapat dipetakan kembali ke fitur asal.
- [x] Validasi ID fitur dan hitung skor di action server.
- [x] Hapus action `save` matrix lama dari `/admin/alternative-values`.

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

1. Tetapkan schema payload dinamis alternative criterion value.
2. Buat form nilai per alternative berdasarkan active criteria.
3. Implement mapping `number`, `scale`, dan checklist `tech_features`.
4. Validasi dan simpan seluruh form dalam satu transaction.
5. Tambahkan link isi/edit nilai dari overview.
6. Hapus action `save` matrix lama dari overview.
7. Tambah tests untuk mapping payload dan penyimpanan atomik.
8. Tambah completeness checker.
9. Tambah guard delete criteria dan scale.
10. Implement MOORA calculation service.
11. Tambah tests untuk completeness checker dan kalkulasi MOORA.

## 5. Yang Tidak Dikerjakan Sekarang

- Tidak membuat FK `criterionScaleId` di `alternative_criterion_values`.
- Tidak membuat calculation service.
- Tidak membuat guard delete berbasis alternative values.
- Tidak membuat matrix read-only untuk membandingkan nilai semua alternative.
- Tidak mengubah cascade DB sekarang.

Alasannya: data entry memakai form per alternative agar input number, scale, dan feature checklist
tetap sederhana. Matrix read-only, guard delete, dan kalkulasi penuh dikerjakan saat kebutuhan
operasionalnya sudah masuk flow utama.
