# Roadmap Alur Kalkulasi MOORA Sales

## 1. Tujuan

Menyediakan alur konsultasi yang membantu sales menemukan rekomendasi sepeda motor berdasarkan
kategori dan rentang harga pelanggan, kemudian mengurutkan seluruh kandidat yang sesuai menggunakan
metode MOORA.

Roadmap ini berfokus pada alur penggunaan, aturan bisnis, rancangan UI, dan jalur implementasi
minimum setelah alur utama disepakati.

## 2. Perbedaan dengan Kalkulasi Admin

Halaman admin menghitung seluruh alternative aktif untuk menghasilkan hasil resmi. Halaman sales
digunakan sebagai alat bantu konsultasi dan hanya menghitung alternative yang sesuai dengan kebutuhan
pelanggan.

Perbedaan utama:

| Admin                                | Sales                                            |
| ------------------------------------ | ------------------------------------------------ |
| Menghitung seluruh alternative aktif | Menghitung alternative hasil filter              |
| Menjalankan perhitungan resmi        | Menjalankan simulasi konsultasi                  |
| Hasil disimpan ke riwayat            | Hasil tidak disimpan pada tahap awal             |
| Mengelola data dan bobot             | Menggunakan data dan bobot yang ditetapkan admin |

Sales tidak dapat mengubah nilai sepeda motor, kriteria, atau bobot MOORA.

## 3. Keputusan Alur Utama

Keputusan yang sudah disepakati:

- Sales menyaring sepeda motor berdasarkan kategori dan rentang harga.
- Kategori dapat berupa satu kategori tertentu atau semua kategori.
- Harga minimum dan maksimum menjadi batas kandidat sebelum perhitungan dilakukan.
- Seluruh sepeda motor yang sesuai dengan filter otomatis menjadi kandidat MOORA.
- Sales tidak memilih ulang kandidat menggunakan checkbox.
- Perhitungan membutuhkan minimal dua kandidat.
- Seluruh kriteria aktif dan bobot yang ditetapkan admin tetap digunakan.
- Hasil hanya berlaku terhadap kandidat pada filter saat itu.
- Hasil kalkulasi sales tidak disimpan ke riwayat admin pada tahap awal.

## 4. Aktor dan Tanggung Jawab

### 4.1 Admin

Admin bertanggung jawab untuk:

- Menjaga data sepeda motor tetap aktif dan akurat.
- Menentukan kategori setiap sepeda motor.
- Mengisi harga dan nilai seluruh kriteria.
- Menentukan kriteria aktif, tipe benefit atau cost, serta bobotnya.
- Memastikan data siap digunakan sebelum fitur kalkulasi sales tersedia.

### 4.2 Sales

Sales bertanggung jawab untuk:

- Menggali kategori dan anggaran pelanggan.
- Memasukkan filter yang sesuai dengan kebutuhan pelanggan.
- Menjelaskan bahwa hasil merupakan rekomendasi di antara kandidat yang memenuhi filter.
- Menggunakan hasil sebagai alat bantu konsultasi, bukan sebagai keputusan mutlak pelanggan.

## 5. Alur Utama

### 5.1 Membuka Kalkulasi

1. Sales membuka halaman kalkulasi.
2. Sistem menampilkan kondisi awal tanpa hasil perhitungan.
3. Sales dapat mulai menentukan kategori dan rentang harga pelanggan.

Pada kondisi awal, belum ada perhitungan yang dijalankan.

### 5.2 Menentukan Kategori

Sales memilih salah satu opsi berikut:

- **Semua kategori** jika pelanggan belum menentukan jenis sepeda motor.
- **Satu kategori tertentu** jika kebutuhan pelanggan sudah lebih spesifik.

Pemilihan satu kategori menjaga alur tetap sederhana. Pemilihan beberapa kategori sekaligus ditunda
sampai ada kebutuhan nyata dari proses konsultasi.

### 5.3 Menentukan Rentang Harga

Sales dapat menentukan:

- Harga minimum.
- Harga maksimum.
- Keduanya sekaligus untuk membentuk rentang harga.

Aturan rentang harga:

- Harga minimum tidak boleh lebih besar dari harga maksimum.
- Batas minimum bersifat inklusif.
- Batas maksimum bersifat inklusif.
- Batas yang tidak diisi berarti tidak membatasi sisi tersebut.

Contoh: rentang Rp20.000.000 sampai Rp30.000.000 mencakup motor dengan harga tepat
Rp20.000.000 maupun Rp30.000.000.

### 5.4 Meninjau Kandidat

Setelah filter diterapkan, sistem menentukan seluruh sepeda motor yang:

- Masih aktif.
- Berada dalam kategori yang dipilih, jika kategori tertentu digunakan.
- Berada dalam rentang harga yang ditentukan.
- Memiliki data yang siap untuk dihitung.

Sales perlu mengetahui jumlah dan identitas kandidat sebelum menjalankan kalkulasi agar konteks hasil
tidak tersembunyi.

### 5.5 Memeriksa Kelayakan Kalkulasi

Sistem memeriksa jumlah kandidat:

- Nol kandidat: perhitungan tidak dapat dijalankan.
- Satu kandidat: perhitungan tidak dapat dijalankan karena tidak ada pembanding.
- Dua kandidat atau lebih: perhitungan dapat dilanjutkan.

Jika kandidat kurang dari dua, sales diarahkan untuk memperluas rentang harga, memilih semua
kategori, atau mengubah kategori.

Jika terdapat data kandidat yang belum lengkap, perhitungan tidak boleh diam-diam mengabaikan
kandidat tersebut. Sistem menyatakan bahwa data belum siap agar hasil rekomendasi tidak menyesatkan.

### 5.6 Menjalankan MOORA

Setelah kandidat memenuhi syarat:

1. Sales menjalankan perhitungan.
2. Sistem menggunakan seluruh kandidat hasil filter.
3. Sistem menggunakan seluruh kriteria aktif dan bobot dari admin.
4. Sistem menghitung nilai MOORA setiap kandidat.
5. Sistem mengurutkan kandidat dari nilai optimasi tertinggi ke terendah.

Perubahan kandidat dapat mengubah hasil normalisasi dan ranking. Karena itu, hasil kalkulasi selalu
terikat pada filter yang digunakan saat perhitungan.

### 5.7 Membaca Hasil

Hasil perlu menyampaikan:

- Filter kategori dan harga yang digunakan.
- Jumlah kandidat yang dibandingkan.
- Sepeda motor dengan ranking tertinggi sebagai rekomendasi utama.
- Urutan seluruh kandidat hasil filter.
- Nilai hasil perhitungan yang mendukung ranking.
- Penjelasan bahwa rekomendasi hanya dibandingkan dengan kandidat pada filter tersebut.

Sales dapat menggunakan ranking pertama sebagai pembuka diskusi, lalu membandingkan kandidat lain
ketika pelanggan memiliki pertimbangan tambahan.

### 5.8 Mengulang Simulasi

Setelah melihat hasil, sales dapat:

- Mengubah kategori.
- Mempersempit atau memperluas rentang harga.
- Menjalankan perhitungan ulang.
- Mengembalikan filter ke kondisi awal untuk konsultasi baru.

Hasil lama digantikan oleh hasil simulasi terbaru. Riwayat simulasi tidak diperlukan pada tahap awal.

## 6. Alur Alternatif dan Pesan yang Diharapkan

| Kondisi                     | Respons Alur                                                   |
| --------------------------- | -------------------------------------------------------------- |
| Filter harga tidak valid    | Minta sales memperbaiki batas harga sebelum melanjutkan        |
| Tidak ada kandidat          | Sarankan memperluas filter                                     |
| Hanya ada satu kandidat     | Jelaskan bahwa minimal dua motor diperlukan sebagai pembanding |
| Data kandidat belum lengkap | Hentikan kalkulasi dan nyatakan data belum siap                |
| Perhitungan berhasil        | Tampilkan rekomendasi utama dan ranking seluruh kandidat       |
| Perhitungan gagal           | Pertahankan filter agar sales dapat mencoba kembali            |
| Sales mengubah filter       | Tandai hasil sebelumnya tidak lagi mewakili filter saat ini    |

## 7. Batasan Tahap Awal

Tahap awal tidak mencakup:

- Pengubahan bobot oleh sales.
- Pengubahan nilai sepeda motor oleh sales.
- Pemilihan kandidat manual setelah filter.
- Pemilihan beberapa kategori sekaligus.
- Penyimpanan nama atau identitas pelanggan.
- Riwayat simulasi sales.
- Penyimpanan hasil sebagai calculation run resmi.
- Perbandingan beberapa simulasi.
- Export, cetak, atau berbagi hasil.
- Rekomendasi berbasis cicilan, tenor, stok, atau promo.

Fitur tersebut hanya ditambahkan jika proses konsultasi nyata menunjukkan kebutuhan yang jelas.

## 8. Rancangan UI/UX yang Disepakati

### 8.1 Arah Tampilan

Halaman menggunakan pendekatan **showroom decision desk**: foto motor menjadi elemen utama,
sedangkan filter, harga, dan skor tetap ringkas serta mudah dibaca saat sales mendampingi pelanggan.

Arah visual mengikuti halaman publik yang sudah tersedia:

- Gunakan warna dan typography dari theme saat ini.
- Pertahankan bidang netral, aksen primary, garis, dan shadow yang ringan.
- Hindari pola dashboard admin yang dipenuhi kartu statistik.
- Jangan menambah font, warna, atau dependency UI baru.

Halaman tidak menggunakan Tabs. Stepper menjadi navigasi utama karena kebutuhan, kandidat, dan hasil
merupakan rangkaian yang saling bergantung.

### 8.2 Struktur Stepper

Stepper terdiri dari tiga tahap:

| Tahap | Judul     | Deskripsi             | Tujuan                                    |
| ----- | --------- | --------------------- | ----------------------------------------- |
| 1     | Kebutuhan | Kategori dan anggaran | Menentukan batas pencarian pelanggan      |
| 2     | Kandidat  | Motor yang sesuai     | Meninjau seluruh motor yang akan dihitung |
| 3     | Hasil     | Rekomendasi MOORA     | Melihat rekomendasi utama dan ranking     |

Aturan navigasi:

- Tahap berikutnya tetap terkunci sampai tahap saat ini selesai.
- Tahap yang sudah selesai dapat dibuka kembali melalui indikator Stepper.
- Tahap Kandidat terbuka setelah filter harga valid diterapkan.
- Tahap Hasil terbuka setelah kalkulasi berhasil.
- Kembali ke tahap sebelumnya tanpa mengubah filter tidak menghapus hasil.
- Perubahan kategori atau rentang harga membatalkan hasil lama dan mengunci kembali tahap Hasil.
- Pada mobile, indikator tetap horizontal dengan informasi yang dipadatkan agar tiga tahap tetap muat.

### 8.3 Tahap Kebutuhan

Tahap Kebutuhan memuat satu Card dengan:

- Judul dan deskripsi singkat mengenai kebutuhan pelanggan.
- Select kategori berisi semua kategori atau satu kategori tertentu.
- Slider harga dengan dua thumb untuk batas minimum dan maksimum.
- Nominal minimum dan maksimum yang selalu terlihat dalam format rupiah.
- Jumlah motor yang sesuai dengan filter saat ini.
- Aksi reset rentang dan tombol **Tampilkan Kandidat**.

Konfigurasi harga awal:

- Slider mencakup seluruh rentang harga alternative aktif.
- Berdasarkan data saat perencanaan, rentang tampilan dibulatkan menjadi Rp18.000.000 sampai
  Rp69.000.000.
- Slider bergerak dengan kelipatan Rp100.000.
- Kondisi awal memilih seluruh rentang katalog.
- Pilihan kategori tidak mengubah posisi slider agar anggaran pelanggan tetap konsisten.
- Nominal ditampilkan tanpa angka desimal, misalnya `Rp28.315.000`.
- Tidak perlu tick untuk setiap harga atau input angka tambahan.

Gunakan komponen yang sudah tersedia: `Card`, `Field`, `Select`, `Slider`, `Badge`, dan `Button`.
Validation error harga tampil di dekat Slider, bukan hanya melalui toast.

### 8.4 Tahap Kandidat

Tahap Kandidat menampilkan:

- Ringkasan kategori dan rentang harga yang digunakan.
- Jumlah kandidat yang akan dihitung.
- Seluruh kandidat hasil filter tanpa pemilihan ulang.
- Foto, nama, kategori, dan harga setiap motor.
- Tombol kembali dan tombol **Hitung N Motor**.

Kandidat menggunakan grid kartu image-forward:

- Satu kolom pada mobile.
- Dua kolom pada tablet.
- Dua atau tiga kolom pada desktop sesuai ruang yang tersedia.
- Foto menggunakan rasio yang konsisten dan tidak terpotong.
- Seluruh kandidat ditampilkan; tidak ada pagination, pilihan checkbox, atau batas enam kartu.

Gunakan `Item.Group` dan `Item.Root` untuk kartu kandidat, ditambah `Badge`, `Empty`, `Alert`,
`Button`, dan `Spinner` sesuai state.

### 8.5 Tahap Hasil

Tahap Hasil menampilkan:

- Ringkasan filter yang menghasilkan perhitungan.
- Jumlah kandidat yang dibandingkan.
- Satu Card image-forward untuk rekomendasi utama.
- Nomor peringkat besar sebagai identitas visual rekomendasi utama.
- Nama motor, kategori, harga, dan skor MOORA rekomendasi utama.
- Ranking lengkap seluruh kandidat beserta harga dan skor MOORA.
- Aksi mengubah kebutuhan atau menghitung ulang.

Ranking selain pemenang menggunakan daftar vertikal agar urutannya mudah dipindai. Tahap awal tidak
menampilkan chart, Tabs, matriks lengkap, atau Stepper perhitungan kedua. Rincian metode ditambahkan
hanya jika sales benar-benar membutuhkannya saat menjelaskan hasil kepada pelanggan.

### 8.6 State UI

| State                       | Respons UI                                                       |
| --------------------------- | ---------------------------------------------------------------- |
| Filter awal                 | Tampilkan seluruh rentang katalog dan jumlah motor yang sesuai   |
| Filter harga tidak valid    | Tampilkan error pada Field dan jangan buka tahap Kandidat        |
| Tidak ada kandidat          | Tampilkan Empty dan arahkan sales kembali mengubah kebutuhan     |
| Satu kandidat               | Tampilkan Alert bahwa diperlukan minimal satu pembanding lagi    |
| Data kandidat belum lengkap | Tampilkan Alert dan nonaktifkan kalkulasi                        |
| Sedang menghitung           | Nonaktifkan aksi dan tampilkan Spinner                           |
| Kalkulasi berhasil          | Buka tahap Hasil dan tampilkan rekomendasi serta ranking         |
| Filter berubah              | Batalkan hasil lama dan kunci kembali tahap Hasil                |
| Kalkulasi gagal             | Pertahankan filter dan kandidat agar sales dapat mencoba kembali |

## 9. Tahapan Roadmap

### Fase 1 - Finalisasi Alur Bisnis

- [x] Tetapkan kategori dan rentang harga sebagai filter kandidat.
- [x] Tetapkan seluruh hasil filter sebagai kandidat kalkulasi.
- [x] Tetapkan minimal dua kandidat.
- [x] Pertahankan kriteria dan bobot milik admin.
- [x] Tetapkan hasil sebagai simulasi tanpa riwayat.
- [x] Hentikan kalkulasi ketika data salah satu kandidat belum lengkap.
- [x] Gunakan rentang penuh sebagai kondisi awal Slider dengan dua batas yang selalu tersedia.

### Fase 2 - Diskusi UI/UX

- [x] Gunakan Stepper untuk tahap Kebutuhan, Kandidat, dan Hasil.
- [x] Gunakan dual-thumb Slider dengan nominal rupiah yang selalu terlihat.
- [x] Gunakan Select untuk memilih semua kategori atau satu kategori.
- [x] Tampilkan seluruh kandidat sebagai kartu motor image-forward.
- [x] Tampilkan rekomendasi utama dan ranking lengkap tanpa rincian matrix.
- [x] Izinkan tahap selesai dibuka kembali dan kunci tahap yang belum tercapai.
- [x] Batalkan hasil lama ketika kategori atau rentang harga berubah.
- [x] Tetapkan pola responsive desktop dan mobile.

Fase ini membahas perilaku dan tampilan halaman tanpa mengubah keputusan bisnis pada Fase 1.

### Fase 3 - Prototipe Alur

- [x] Buat UI mock Stepper tiga tahap menggunakan bentuk data final.
- [x] Buat tahap Kebutuhan dengan Select, dual-thumb Slider, dan jumlah kandidat mock.
- [x] Buat tahap Kandidat dengan seluruh kartu motor mock.
- [x] Buat kondisi kandidat nol, satu, dan lebih dari satu.
- [x] Buat tahap Hasil dengan rekomendasi utama dan ranking mock.
- [ ] Uji navigasi maju, kembali, perubahan filter, kalkulasi ulang, dan reset di browser.
- [ ] Periksa responsive UI pada desktop dan mobile.
- [ ] Minta persetujuan UI mock sebelum menghubungkan data nyata.

Mock harus memakai data lokal dengan struktur yang sama seperti data final. Tidak perlu timeout buatan,
API mock, database sementara, atau abstraction khusus mock.

### Fase 4 - Implementasi Fungsional

- [ ] Gunakan `+page.server.ts` untuk memuat katalog aktif, kategori, gambar, dan rentang harga.
- [x] Sediakan penanda `isPrice` yang dapat dikelola admin tanpa bergantung pada kode atau urutan.
- [ ] Gunakan kriteria aktif dengan `isPrice = true` sebagai sumber harga.
- [ ] Ganti data mock pada halaman dengan data dari server `load`.
- [ ] Buat satu action `calculate` untuk memvalidasi filter dan menjalankan simulasi.
- [ ] Filter seluruh kandidat berdasarkan kategori dan harga di server.
- [ ] Hentikan kalkulasi jika kandidat kurang dari dua atau decision matrix belum lengkap.
- [ ] Gunakan kembali `calculateMoora()` tanpa menyalin algoritma atau membuat service baru.
- [ ] Kembalikan rekomendasi dan ranking ke halaman tanpa menyimpan calculation run.
- [ ] Batasi `/sales/calculate` hanya untuk role sales melalui RBAC yang sudah ada.
- [ ] Hapus fixture dan fungsi mock setelah data nyata terhubung.

Prinsip implementasi backend tahap awal:

- Gunakan satu server `load` dan satu form action; tidak perlu endpoint API terpisah.
- Query dan helper tetap lokal di `+page.server.ts` selama belum digunakan halaman lain.
- Filter in-memory cukup untuk ukuran katalog saat ini; pindahkan ke query database hanya jika ukuran
  data atau hasil pengukuran menunjukkan kebutuhan.
- Validasi ulang kategori dan rentang harga di server. Jangan mempercayai daftar ID kandidat dari
  browser.
- Simulasi sales bersifat read-only dan tidak menggunakan `createMooraCalculation()`.
- Tidak perlu tabel, dependency, cache, queue, atau riwayat baru.
- Jika tidak ada kriteria dengan `isPrice = true`, hentikan alur dan tampilkan Alert bahwa sumber harga
  belum ditetapkan. Jangan menduplikasi harga ke tabel alternative.

### Fase 5 - Validasi Alur

- [ ] Uji kategori tertentu dan semua kategori.
- [ ] Uji batas harga minimum, maksimum, dan rentang lengkap.
- [ ] Uji kondisi tanpa kandidat dan satu kandidat.
- [ ] Uji data kandidat yang belum lengkap.
- [ ] Uji bahwa semua kandidat hasil filter ikut dihitung.
- [ ] Uji bahwa motor di luar filter tidak ikut dihitung.
- [ ] Uji kalkulasi ulang setelah filter berubah.
- [ ] Uji bahwa simulasi sales tidak masuk ke riwayat admin.

### Fase 6 - Evaluasi Setelah Digunakan

- [ ] Evaluasi apakah filter kategori tunggal sudah cukup.
- [ ] Evaluasi apakah sales membutuhkan pemilihan kandidat manual.
- [ ] Evaluasi apakah bobot perlu disesuaikan berdasarkan pelanggan.
- [ ] Evaluasi apakah hasil perlu disimpan, dicetak, atau dibagikan.
- [ ] Evaluasi kebutuhan filter tambahan seperti stok, promo, dan cicilan.

Evaluasi dilakukan berdasarkan penggunaan nyata, bukan untuk menambah fitur sebelum diperlukan.

## 10. Kriteria Selesai

- Sales dapat menentukan kategori dan rentang harga pelanggan.
- Sistem memperlihatkan kandidat yang akan dibandingkan.
- Kalkulasi hanya berjalan ketika tersedia minimal dua kandidat yang siap dihitung.
- Seluruh kandidat hasil filter dan hanya kandidat tersebut digunakan dalam MOORA.
- Kriteria, nilai, dan bobot tetap berasal dari pengelolaan admin.
- Hasil menampilkan rekomendasi utama dan ranking kandidat.
- Konteks filter tetap terlihat bersama hasil.
- Sales dapat mengubah filter dan menjalankan simulasi ulang.
- Simulasi sales tidak mengubah master data atau riwayat resmi admin.
- Stepper hanya membuka tahap yang sudah tersedia bagi sales.
- UI kandidat dan hasil tetap dapat digunakan pada desktop dan mobile.

## 11. Pembahasan Berikutnya

Sesi berikutnya berfokus pada persetujuan UI mock dan implementasi backend minimum:

1. Tangani kondisi saat admin belum menetapkan kriteria dengan `isPrice = true`.
2. Isi `+page.server.ts` dengan katalog aktif dan satu action simulasi.
3. Hubungkan state halaman ke data server dan hasil action.
4. Ganti test mock dengan test filter, validasi, dan kalkulasi server.
5. Verifikasi bahwa simulasi tidak masuk ke riwayat admin.

Keputusan UI tidak boleh mengubah aturan bahwa seluruh hasil filter dihitung menggunakan kriteria dan
bobot yang ditetapkan admin.
