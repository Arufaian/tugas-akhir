# Roadmap Dashboard Admin

## 1. Tujuan

Mengganti placeholder pada `/admin/dashboard` dengan ringkasan operasional yang membantu admin
menjawab tiga pertanyaan:

1. Apakah data MOORA siap dihitung?
2. Alternatif mana yang menempati peringkat teratas pada run terbaru?
3. Kapan perhitungan terakhir dilakukan dan berapa banyak riwayat yang tersedia?

Dashboard bukan dashboard penjualan. Database saat ini tidak menyimpan transaksi, omzet, pelanggan,
atau histori stok sehingga UI tidak boleh menyiratkan metrik bisnis tersebut.

## 2. Kondisi Saat Ini

`src/routes/admin/dashboard/+page.svelte` hanya berisi tiga placeholder card dan satu placeholder
besar. Route belum memiliki `+page.server.ts` dan belum membaca data database.

Snapshot database remote pada 15 Juli 2026:

| Data                         |                   Nilai |
| ---------------------------- | ----------------------: |
| Alternative aktif            |                       5 |
| Criterion aktif              |                       5 |
| Benefit / cost               |                   4 / 1 |
| Cell decision matrix         |          25 / 25 terisi |
| Total calculation run        |                       4 |
| Run terbaru                  |            14 Juli 2026 |
| Peringkat pertama            | Grand Filano Hybrid Neo |
| Optimization score tertinggi |             0,239827485 |

Nilai di atas hanya menjadi dasar validasi desain. UI tetap harus membaca data dinamis dari database
dan mendukung kondisi kosong, belum lengkap, serta belum memiliki run.

## 3. Ruang Lingkup

Termasuk:

- `+page.server.ts` untuk summary, readiness, run terbaru, ranking terbaru, dan riwayat singkat.
- Empat KPI: alternative aktif, criterion aktif, kelengkapan matrix, dan total run.
- Horizontal bar chart untuk optimization score pada run terbaru.
- Panel keputusan terbaru untuk alternative peringkat pertama.
- Daftar tiga calculation run terbaru.
- Empty state dan warning saat data belum siap atau belum memiliki run.
- Tampilan responsive dan aksesibel.
- Test minimum untuk mapping summary dan state dashboard.

Tidak termasuk:

- Chart penjualan, omzet, pelanggan, atau popularitas alternative.
- Chart kategori selama seluruh alternative aktif masih berada pada satu kategori.
- Tren score antar-run, winner frequency, radar chart, atau perbandingan run.
- Filter tanggal, pencarian, pagination, export, refresh otomatis, atau realtime.
- Perubahan schema, migration, view, RPC, cache, dan dependency baru.
- Komponen dashboard generik atau abstraction chart baru.

## 4. Arsitektur Informasi

Urutan konten mengikuti prioritas keputusan, bukan sekadar grid card.

```text
┌──────────────────────────────────────────────────────────────┐
│ Dashboard Keputusan                      [Hitung MOORA]       │
│ Kesiapan data dan hasil keputusan terbaru                    │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ Alternative │ Criterion   │ Kelengkapan │ Total Perhitungan   │
├─────────────────────────────────────┬────────────────────────┤
│ Peringkat MOORA Terbaru             │ Keputusan Terbaru      │
│ Horizontal bar chart                │ #1, score, metadata    │
├─────────────────────────────────────┴────────────────────────┤
│ Tiga calculation run terbaru                    [Lihat semua] │
└──────────────────────────────────────────────────────────────┘
```

Pada mobile, seluruh bagian ditumpuk menjadi satu kolom. Chart menggunakan tinggi minimum yang tetap
agar label alternative tetap terbaca dan tidak memakai `aspect-video`.

## 5. Kontrak Data Server

Buat `src/routes/admin/dashboard/+page.server.ts` dengan satu `load()` server-side. Query independen
dijalankan paralel menggunakan `Promise.all`.

Kontrak minimum:

```ts
{
	summary: {
		activeAlternativeCount: number;
		activeCriteriaCount: number;
		totalCellCount: number;
		filledCellCount: number;
		completionPercentage: number;
		isReady: boolean;
		totalRunCount: number;
	};
	latestRun: {
		id: string;
		name: string;
		createdAt: Date;
		createdByName: string;
		alternativeCount: number;
		criteriaCount: number;
		results: Array<{
			alternativeId: string;
			alternativeCode: string;
			alternativeName: string;
			rank: number;
			totalBenefit: number;
			totalCost: number;
			optimizationScore: number;
		}>;
	} | null;
	recentRuns: Array<{
		id: string;
		name: string;
		createdAt: Date;
		createdByName: string;
		alternativeCount: number;
		criteriaCount: number;
	}>;
}
```

### 5.1 Sumber Data

- Active alternative dan criterion berasal dari master data saat ini.
- Kelengkapan matrix memakai `checkDecisionMatrixCompleteness()` agar nilai scale tidak valid tidak
  dihitung sebagai cell lengkap.
- Readiness juga memeriksa normalized weight aktif dan ketersediaan scale aktif.
- Run dan ranking terbaru memakai snapshot dari `getLatestCalculationRun()`.
- Total dan tiga run terbaru memakai query `calculation_runs` yang diurutkan dengan
  `created_at DESC, id DESC`.
- Numeric PostgreSQL dikonversi menjadi `number` sebelum dikirim ke UI.

Tidak perlu mengambil daftar pengguna. Status pengguna pada UI saat ini berasal dari Supabase Auth,
bukan hanya `profiles.is_active`, dan tidak berkaitan langsung dengan kesiapan keputusan MOORA.

### 5.2 Batas Query

- Ambil hanya tiga row untuk riwayat singkat.
- Jangan memuat seluruh calculation history.
- Gunakan snapshot result terbaru yang sudah tersedia; jangan menghitung ulang MOORA saat dashboard
  dibuka.
- Jangan menambah index sebelum volume atau query plan menunjukkan kebutuhan nyata.
- Pesan database error harus generik dan tidak menyertakan detail SQL.

## 6. Chart Utama

Gunakan horizontal `BarChart` dari LayerChart di dalam `Chart.Container` shadcn-svelte.

### 6.1 Dataset

- Kategori: nama atau kode alternative.
- Nilai: `optimizationScore`.
- Urutan: `rank` ascending.
- Warna utama: `var(--chart-1)`.
- Peringkat pertama diberi emphasis yang tetap konsisten dengan semantic primary.

### 6.2 Tooltip

Tooltip menampilkan:

- Nama dan kode alternative.
- Rank.
- Total benefit.
- Total cost.
- Optimization score dengan precision yang konsisten.

Axis score harus mempertahankan baseline nol agar panjang batang tidak melebih-lebihkan selisih.
Implementasi harus tetap benar jika score negatif muncul pada run berikutnya.

### 6.3 Empty State

Jika belum ada run, jangan membuat dataset nol buatan. Ganti area chart dengan `Empty` yang
mengarahkan admin ke `/admin/moora-calculation`.

## 7. Layout dan Komponen UI

Gunakan komponen yang sudah terpasang:

| Kebutuhan                   | Komponen                                       |
| --------------------------- | ---------------------------------------------- |
| Wadah section dan KPI       | `Card`                                         |
| Chart                       | `Chart.Container`, `Chart.Tooltip`, `BarChart` |
| Status readiness            | `Badge`                                        |
| Kelengkapan decision matrix | `Progress`                                     |
| Masalah kesiapan            | `Alert`                                        |
| Navigasi                    | `Button`                                       |
| Riwayat singkat             | `Table`                                        |
| Metadata                    | `Separator` dan `Badge`                        |
| Belum ada run               | `Empty`                                        |
| Ikon                        | `@lucide/svelte`                               |

Tidak menggunakan `Tabs`, `Select`, `DataTable`, atau filter karena seluruh informasi utama muat
dalam satu tampilan.

### 7.1 Header

- Judul: `Dashboard Keputusan`.
- Deskripsi: `Pantau kesiapan data dan hasil perhitungan MOORA terbaru.`
- Badge menampilkan `Siap dihitung` atau `Perlu dilengkapi`.
- Tombol utama menuju `/admin/moora-calculation`.

### 7.2 KPI

Empat KPI memakai pola visual yang sudah digunakan pada halaman `alternative-values`:

1. Alternative aktif.
2. Criterion aktif.
3. Persentase kelengkapan matrix dengan `Progress` kecil.
4. Total calculation run beserta waktu run terakhir jika tersedia.

Jangan membuat card terpisah untuk cell terisi dan kosong karena keduanya merupakan satu metrik.

### 7.3 Keputusan Terbaru

Panel di samping chart menampilkan:

- Badge `Peringkat #1`.
- Nama dan kode alternative.
- Optimization score.
- Waktu run dalam locale `id-ID`, zona waktu `Asia/Jakarta`, dan label `WIB`.
- Cakupan jumlah alternative dan criterion.
- Link menuju detail calculation run.

Panel ini menjadi focal point halaman; section lain tetap memakai visual admin yang tenang dan
konsisten.

### 7.4 Riwayat Singkat

Gunakan `Table` sederhana berisi maksimal tiga run:

- Nama dan waktu.
- Pembuat.
- Cakupan alternative dan criterion.
- Link detail.

Sediakan satu tombol `Lihat semua` menuju `/admin/calculation-history`. Tidak perlu pagination pada
dashboard.

## 8. State Halaman

Dashboard mendukung empat state:

1. Data siap dan run tersedia: tampilkan seluruh KPI, chart, keputusan, dan riwayat.
2. Data belum siap tetapi run lama tersedia: tampilkan warning readiness dan tetap tampilkan snapshot
   run terbaru dengan label waktu yang jelas.
3. Data siap tetapi belum ada run: tampilkan KPI dan empty state dengan CTA hitung.
4. Data master kosong: tampilkan KPI nol, warning, dan CTA menuju pengelolaan alternative atau
   criterion.

Run lama tidak boleh dianggap sebagai representasi master data saat ini. Label `Run terbaru` dan
waktu snapshot harus selalu terlihat.

## 9. Responsive dan Aksesibilitas

- Gunakan satu kolom pada mobile dan grid `2fr / 1fr` untuk chart serta keputusan pada desktop.
- Pastikan nama alternative panjang tidak terpotong tanpa tooltip atau fallback yang dapat dibaca.
- Tambahkan `<svelte:head>` dengan title dan description khusus dashboard.
- Chart harus memiliki ringkasan teks atau daftar ranking yang tetap dapat dipahami tanpa visual.
- Warna bukan satu-satunya pembeda rank, readiness, benefit, atau cost.
- Link dan tombol memiliki accessible name yang jelas.
- Animasi chart menghormati reduced motion; hilangkan animasi jika dukungan library tidak langsung.
- Gunakan keyed `{#each}` berdasarkan id atau href stabil.

## 10. Tests dan Verifikasi

Test minimum:

- Summary menghitung active alternative dan criterion dengan benar.
- Completion percentage aman saat total cell nol.
- Nilai scale tidak valid membuat matrix belum lengkap.
- Latest results diurutkan berdasarkan rank.
- Numeric result dikonversi menjadi `number`.
- Empty state digunakan saat belum ada run.
- Database error tidak membocorkan detail internal.

Verifikasi implementasi:

1. Jalankan Svelte autofixer pada `+page.svelte` sampai tidak ada temuan.
2. Jalankan `bun run check`.
3. Jalankan ESLint untuk file yang berubah.
4. Jalankan test dashboard dan `bun run test`.
5. Periksa tampilan desktop, tablet, mobile, light mode, dan dark mode.
6. Periksa chart dengan score positif, score negatif, nama panjang, satu result, dan tanpa run.

## 11. Urutan Implementasi

1. [x] Tetapkan kontrak return `load()` dashboard.
2. [x] Implement query summary dan readiness dari master data aktif.
3. [x] Gunakan service history untuk snapshot run terbaru.
4. [x] Implement query count dan tiga calculation run terbaru.
5. [x] Ganti placeholder dengan header dan empat KPI.
6. [x] Implement horizontal bar chart ranking terbaru.
7. [x] Implement panel keputusan terbaru dan link detail.
8. [x] Implement table riwayat singkat dan link seluruh riwayat.
9. [x] Implement warning dan empty states.
10. [x] Tambahkan test minimum mapping dan state dashboard.
11. [x] Jalankan autofixer, check, lint, dan test.

## 12. Kriteria Selesai

- Dashboard tidak lagi memakai placeholder atau data statis.
- Admin dapat melihat kesiapan data tanpa membuka halaman lain.
- Kelengkapan matrix dan readiness mengikuti master data aktif saat ini.
- Run terbaru ditampilkan sebagai snapshot historis, bukan hasil kalkulasi ulang.
- Ranking terbaru terbaca jelas pada desktop dan mobile.
- Tooltip chart menampilkan benefit, cost, score, dan rank.
- Kondisi tanpa data dan tanpa run memiliki arahan tindakan yang jelas.
- Riwayat singkat hanya memuat tiga run dan menyediakan link menuju daftar lengkap.
- Tidak ada dependency, schema, migration, filter, atau abstraction baru yang tidak diperlukan.
- Type check, lint, test, dan Svelte autofixer selesai tanpa error.

## 13. Pekerjaan Lanjutan

Evaluasi hanya setelah data dan kebutuhan nyata tersedia:

- Tren jumlah calculation run per minggu.
- Perbandingan dua run dengan cakupan dan konfigurasi yang sebanding.
- Chart bobot criterion jika admin sering membutuhkan konteks bobot dari dashboard.
- Filter periode ketika jumlah run sudah cukup besar.
- Metrik penjualan hanya setelah schema transaksi tersedia.

Chart kategori, radar, winner frequency, dan score history tidak direncanakan sekarang karena data
saat ini belum cukup atau berisiko menghasilkan interpretasi yang menyesatkan.
