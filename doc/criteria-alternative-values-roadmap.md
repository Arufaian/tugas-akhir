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

## 3. Alternative Values

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

- [x] Criteria kosong tetap bisa dihapus.
- [x] Criteria yang sudah dipakai tidak terhapus tanpa sengaja.

### 3.3 Guard Delete Criterion Scale

Jika scale sudah pernah dipakai sebagai `labelValue` atau raw value untuk alternative, delete scale bisa membuat histori membingungkan.

Pilihan minimal:

- Blok delete scale jika ada alternative value dengan criterion yang sama dan `rawValue` yang sama.
- Kalau butuh lebih kuat, tambahkan `criterionScaleId` FK di `alternative_criterion_values`.

Kriteria selesai:

- [x] Scale yang sudah dipakai tidak hilang diam-diam.
- [x] Admin mendapat pesan kenapa scale tidak bisa dihapus.

### 3.3.1 Guard Update Criterion Scale

Mengubah `value` atau menghapus scale yang sudah dipakai dapat membuat `rawValue` dan `labelValue` pada matrix tidak lagi merujuk ke opsi yang valid.

Pilihan minimal:

- [x] Blok perubahan `value` dan delete jika scale sudah digunakan oleh alternative value.
- [x] Label dan deskripsi tetap boleh diperbarui; `labelValue` lama dipertahankan sebagai snapshot
      saat penilaian.

Kriteria selesai:

- [x] Nilai matrix yang tersimpan selalu dapat dipetakan ke opsi scale yang masih valid.
- [x] Summary matrix tidak menghitung nilai scale yatim sebagai cell terisi.

### 3.4 Validasi Kelengkapan Decision Matrix

Sebelum kalkulasi MOORA, sistem perlu memastikan semua alternative aktif punya value untuk semua criteria aktif.

Kriteria selesai:

- [x] Ada checker yang menghasilkan alternative mana yang belum lengkap.
- [x] Ada checker yang menghasilkan criterion mana yang belum diisi.
- [x] Status kelengkapan dapat dipakai sebagai prasyarat modul kalkulasi.

### 3.5 Soft-delete Criteria

Gunakan `criteria.isActive` yang sudah ada sebagai status soft-delete. Tidak perlu menambah
`deletedAt` selama timestamp penghapusan dan purge permanen belum dibutuhkan.

Pekerjaan:

- [x] Tambahkan endpoint status untuk mengubah `isActive` dan `updatedAt` tanpa menghapus row.
- [x] Izinkan criteria yang sudah memiliki alternative values atau calculation history untuk
      dinonaktifkan tanpa menghapus data terkait.
- [x] Pertahankan hard delete hanya untuk criteria tanpa alternative values dan calculation history.
- [x] Tambahkan satu action dropdown `Nonaktifkan` atau `Aktifkan` pada row criteria; tidak perlu
      tombol, dialog, atau halaman arsip baru.
- [x] Tampilkan toast sukses atau pesan error dari server setelah perubahan status.
- [x] Nonaktifkan action selama request berjalan untuk mencegah request ganda.
- [x] Pastikan perubahan status membuat readiness normalisasi bobot diperiksa ulang.

Kriteria selesai:

- [x] Menonaktifkan criteria tidak menghapus criterion scales, alternative values, atau calculation
      details.
- [x] Criteria nonaktif tidak digunakan dalam form nilai, completeness checker, atau kalkulasi.
- [x] Criteria nonaktif dapat dipulihkan dari halaman criteria.

### 3.6 Soft-delete Criterion Scale

Tambahkan `criterion_scales.isActive`. Semua row tetap disimpan agar scale dapat dipulihkan dan nilai
lama tetap memiliki pasangan master data.

Keputusan minimal:

- Constraint unique `(criterionId, value)` tetap berlaku terhadap scale aktif dan nonaktif.
- Menonaktifkan scale yang sudah dipakai diperbolehkan.
- Alternative value yang memakai scale nonaktif tetap tersimpan, tetapi dianggap `invalid_scale`
  sampai dinilai ulang atau scale dipulihkan.
- Tidak menambah `criterionScaleId`, tabel histori, atau `deletedAt` pada tahap ini.

Pekerjaan:

- [x] Tambahkan kolom `is_active boolean not null default true` melalui schema dan migration.
- [x] Tambahkan endpoint status untuk mengubah `isActive` dan `updatedAt` tanpa menghapus row.
- [x] Pertahankan hard delete hanya untuk scale yang belum digunakan.
- [x] Tambahkan `Switch` pada setiap row scale untuk menonaktifkan atau mengaktifkan kembali scale.
- [x] Tampilkan scale aktif dan nonaktif pada halaman pengelolaan beserta statusnya.
- [x] Tampilkan toast sukses atau pesan error dari server setelah perubahan status.
- [x] Nonaktifkan `Switch` selama request berjalan dan pulihkan posisi sebelumnya jika request
      gagal.
- [x] Filter hanya scale aktif pada form nilai, validasi save, summary kesiapan scale, dan
      completeness checker.
- [x] Pertahankan row locking saat save, update, nonaktifkan, dan pulihkan scale.

Kriteria selesai:

- [x] Scale nonaktif tidak dapat dipilih atau disimpan sebagai nilai baru.
- [x] Scale nonaktif membuat nilai lama dilaporkan sebagai `invalid_scale`.
- [x] Pemulihan scale membuat nilai lama valid kembali tanpa mengubah alternative value.

### 3.7 Batasi Satu Criteria `tech_features`

Sistem hanya memiliki satu konsep penilaian fitur teknologi. Batas berlaku terhadap seluruh row,
termasuk criteria nonaktif; criteria lama harus dipulihkan, bukan dibuat ulang.

Pekerjaan:

- [x] Verifikasi data existing tidak memiliki lebih dari satu criteria `tech_features`.
- [x] Tambahkan partial unique index database untuk `input_type = 'tech_features'`.
- [x] Tangani unique violation `23505` pada create dan update dengan pesan yang ramah.
- [x] Tambahkan test create dan update, termasuk jaminan constraint database terhadap race
      condition.

Kriteria selesai:

- [x] Database tidak dapat menyimpan lebih dari satu criteria `tech_features`.
- [x] Admin mendapat pesan `Kriteria fitur teknologi hanya boleh ada satu` saat terjadi konflik.

### 3.8 Guard Integritas Tipe Input

Perubahan `inputType` dan direct request ke halaman scale dapat meninggalkan data yang tidak sesuai
dengan tipe criteria.

Pekerjaan:

- [x] Blok perubahan `inputType` jika criteria sudah memiliki alternative values.
- [x] Blok perubahan dari `scale` ke tipe lain selama masih memiliki scale aktif.
- [x] Pastikan load dan action create/update/nonaktifkan/pulihkan scale hanya menerima parent
      criteria dengan `inputType = 'scale'`.
- [x] Return status dan pesan yang jelas untuk konflik data atau parent criteria yang salah.

Kriteria selesai:

- [x] Alternative values tidak ditafsirkan ulang akibat perubahan tipe input.
- [x] Scale aktif tidak menjadi data tersembunyi pada criteria non-scale.
- [x] Direct request tidak dapat memutasi scale milik criteria non-scale.

## 4. Urutan Implementasi Tersisa

1. Jalankan migration verification, `bun run check`, ESLint changed files, `bun run test`, database
   advisors, dan `ponytail-review`.

## 5. Batas Cakupan

- Tidak membuat FK `criterionScaleId` di `alternative_criterion_values`.
- Tidak membuat matrix read-only untuk membandingkan nilai semua alternative.
- Tidak mengubah cascade DB sekarang; hard delete criteria dan criterion scales tetap tersedia hanya
  untuk data yang belum digunakan.
- Kalkulasi, ranking, dan histori hasil MOORA dilanjutkan di
  [`moora-calculation-roadmap.md`](./moora-calculation-roadmap.md).

Data entry tetap memakai form per alternative agar input number, scale, dan feature checklist
sederhana. Roadmap ini berhenti setelah integritas master data dan kelengkapan decision matrix
terjamin.
