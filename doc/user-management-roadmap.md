# Roadmap Manajemen Pengguna

## 1. Tujuan

Menyediakan halaman admin untuk melihat pengguna, menambahkan akun sales melalui modal, dan
mengaktifkan atau menonaktifkan akses login menggunakan Supabase Auth Admin API.

Implementasi ditempatkan di `src/routes/admin/users/` dan mengikuti pola halaman
`src/routes/admin/criteria/`: summary, `DataTable`, filter, serta menu aksi per row.

## 2. Keputusan Produk

- Registrasi publik `/auth/register` tetap tersedia.
- Admin dapat membuat akun baru dengan nama, email, dan password awal.
- Akun yang dibuat admin selalu memiliki role `sales`; form tidak menyediakan pilihan role.
- Email langsung dikonfirmasi melalui `email_confirm: true` agar akun dapat segera login.
- Form tambah pengguna ditampilkan dalam `Dialog`, bukan route `/create` terpisah.
- Aksi row hanya aktifkan/nonaktifkan. Edit, hapus, dan reset password tidak dikerjakan.
- Admin tidak boleh menonaktifkan akunnya sendiri.
- UI dibuat dan ditinjau menggunakan data mock sebelum Supabase Admin API dihubungkan.
- Ringkasan pengguna aktif menampilkan jumlah akun tanpa persentase.

## 3. Keamanan dan Supabase

Gunakan `SUPABASE_SECRET_KEY` hanya di server melalui `$env/static/private`. Buat satu client admin
di `src/lib/server/supabase-admin.ts` dengan `persistSession: false` dan `autoRefreshToken: false`.

Aturan wajib:

- Secret key tidak boleh memakai awalan `PUBLIC_`.
- Secret key tidak boleh diimpor oleh file `.svelte` atau module yang dapat masuk browser bundle.
- Semua operasi `auth.admin.*` dijalankan dari `+page.server.ts`, `+server.ts`, atau `$lib/server`.
- Otorisasi route tetap memakai guard admin yang sudah ada di `handleRbac`.
- Pesan error ke browser tidak boleh membocorkan secret key atau detail internal Supabase.

Status login menggunakan fitur native Supabase:

- Nonaktifkan dengan `auth.admin.updateUserById(userId, { ban_duration: '876000h' })`.
- Aktifkan kembali dengan menghapus ban melalui nilai durasi unban yang didukung Supabase Auth.
- Status tabel diturunkan dari `banned_until`, bukan dari `profiles.is_active`, agar tidak ada dua
  sumber status yang dapat berbeda.
- Token akses yang sudah diterbitkan dapat tetap berlaku sampai kedaluwarsa. Pemeriksaan session
  aktif tambahan baru diperlukan jika pencabutan akses harus seketika.

Referensi resmi:

- [API keys](https://supabase.com/docs/guides/api/api-keys)
- [Create user](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [List users](https://supabase.com/docs/reference/javascript/auth-admin-listusers)
- [Update user](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)

## 4. Kontrak Data

`load()` mengambil maksimal 1.000 pengguna melalui `auth.admin.listUsers()` lalu menggabungkannya
dengan `profiles` berdasarkan UUID.

Row yang dikirim ke UI berisi:

```ts
type UserRow = {
	id: string;
	name: string;
	email: string;
	role: 'admin' | 'sales';
	isActive: boolean;
	createdAt: string;
	isCurrentUser: boolean;
};
```

Nama dan role berasal dari `profiles`. Email, waktu pembuatan, dan status ban berasal dari Supabase
Auth. Profile yang tidak ditemukan menggunakan nama metadata atau label netral tanpa menggagalkan
seluruh halaman.

Batas 1.000 pengguna cukup untuk tahap sekarang. Tambahkan pagination server hanya ketika jumlah
pengguna mendekati batas tersebut.

## 5. Halaman dan Interaksi

Route `/admin/users` menampilkan:

- Header judul dan deskripsi singkat pengelolaan akses staf.
- Tiga summary card: total pengguna, akses aktif, dan akun dinonaktifkan.
- Card total pengguna memuat tombol **Tambah User**.
- Card akses aktif hanya menampilkan jumlah akun, bukan persentase.
- `DataTable` dengan kolom pengguna, role, status, tanggal dibuat, dan actions.
- Kolom pengguna menggabungkan avatar inisial, nama, dan email dalam satu identity cell.
- Pencarian nama atau email serta filter role dan status.
- Badge untuk role dan status.
- Empty state bawaan tabel ketika data tidak tersedia.

### 5.1 Arah Visual

Pertahankan visual language admin yang sudah ada:

- Gunakan warna semantic `primary`, `success`, dan `destructive` dari `layout.css`.
- Gunakan pola tiga `Card` seperti halaman alternatives, tanpa menambah warna atau font baru.
- Gunakan `UsersRound`, `UserCheck`, dan `UserX` untuk ketiga summary card.
- Gunakan `Avatar.Fallback` berisi inisial karena aplikasi belum menyimpan foto profile.
- Gunakan `Badge` default untuk admin, secondary untuk sales, success untuk aktif, dan destructive
  untuk nonaktif.
- Satukan nama dan email dalam identity cell agar tabel tetap ringkas pada layar kecil.
- Tandai akun yang sedang digunakan dengan label `Anda`.

Susunan halaman:

```text
Pengguna
Kelola akun dan akses staf.

[ Total Pengguna + Tambah ] [ Akses Aktif ] [ Dinonaktifkan ]

[ Cari nama atau email ] [ Role ] [ Status ] [ View ]
[ Avatar + nama/email    ] [ Role ] [ Status ] [ Dibuat ] [ Actions ]
```

Modal tambah pengguna menggunakan komponen yang sudah terpasang:

- `Dialog` untuk container modal.
- `sveltekit-superforms` dan schema registrasi yang sudah ada.
- `Form.Field` dan `Input` untuk nama, email, password, dan konfirmasi password.
- Seluruh field disusun vertikal agar pesan validasi password tidak terjepit pada layar kecil.
- Password menggunakan `autocomplete="new-password"` dan menampilkan requirement singkat.
- `Spinner` dan disabled state selama submit.
- Toast sukses atau gagal.
- Modal ditutup dan tabel dimuat ulang setelah akun berhasil dibuat.

Menu actions menggunakan pola dropdown pada halaman criteria:

- User aktif memiliki action **Nonaktifkan**.
- User nonaktif memiliki action **Aktifkan**.
- Action dinonaktifkan selama request berlangsung.
- Akun admin yang sedang login tidak dapat menonaktifkan dirinya sendiri.
- Perubahan berhasil memicu `invalidateAll()` dan toast.

### 5.2 Fase UI Mock

Fase pertama belum memanggil Supabase Admin API:

- `mock-data.ts` menyediakan 8-10 user dengan UUID stabil dan kontrak yang sama seperti data final.
- Mock mencakup admin yang sedang login, sales aktif, sales nonaktif, nama panjang, email panjang, dan
  tanggal pembuatan yang berbeda.
- `+page.server.ts` menghitung ketiga summary dari row mock dan menyediakan Superform.
- Named action `create` hanya menjalankan validasi menggunakan schema registrasi existing.
- Submit valid menampilkan toast yang menyatakan bahwa form masih berupa mock.
- Submit mock tidak menambah row dan action status belum mengubah data lokal.
- Setelah UI disetujui, sumber mock diganti dengan Supabase tanpa mengubah struktur utama halaman.

Tidak perlu membuat simulasi store, timeout buatan, atau CRUD lokal yang akan dibuang saat backend
dipasang.

### 5.3 Penyesuaian DataTable

Lakukan penyesuaian minimum pada komponen existing:

- Tampilkan ringkasan row terpilih hanya ketika tabel memiliki kolom `select`.
- Tambahkan prop opsional `emptyMessage` agar halaman dapat memakai teks Indonesia.
- Jadikan `columns` getter pada konfigurasi table agar prop tetap dibaca secara reaktif.

Tidak perlu membuat komponen table baru khusus pengguna.

## 6. Backend

### 6.1 Load Daftar

1. Ambil user yang sedang login untuk penanda `isCurrentUser`.
2. Ambil daftar Auth users dari Supabase Admin API.
3. Ambil seluruh profile yang ID-nya relevan.
4. Gabungkan data dan urutkan dari pengguna terbaru.
5. Hitung summary dari row yang sama agar tidak ada query count tambahan.

### 6.2 Tambah Pengguna

Action `create`:

1. Validasi request dengan schema registrasi existing.
2. Panggil `auth.admin.createUser()` menggunakan email, password, `email_confirm: true`, dan
   `user_metadata.full_name`.
3. Trigger `private.handle_new_user()` yang sudah ada membuat profile dengan role `sales`.
4. Return message sukses atau error yang aman.

Tidak perlu insert profile kedua dari aplikasi karena akan menduplikasi tanggung jawab trigger.

### 6.3 Ubah Status

Endpoint `PATCH /admin/users/[id]`:

1. Validasi route ID dengan `z.uuid()` dan body `isActive` sebagai boolean.
2. Tolak request jika target sama dengan user yang sedang login.
3. Panggil `auth.admin.updateUserById()` untuk ban atau unban.
4. Return status terbaru atau pesan error generik.

## 7. Perubahan File

- `src/lib/server/supabase-admin.ts`: client Supabase khusus operasi admin.
- `src/routes/admin/users/+page.server.ts`: load daftar dan action create.
- `src/routes/admin/users/+page.svelte`: summary, table, dan state modal.
- `src/routes/admin/users/columns.ts`: definisi kolom dan filter.
- `src/routes/admin/users/mock-data.ts`: fixture sementara untuk fase UI.
- `src/routes/admin/users/types.ts`: kontrak row yang dipakai UI mock dan backend final.
- `src/routes/admin/users/user-form-dialog.svelte`: form tambah pengguna.
- `src/routes/admin/users/user-identity-cell.svelte`: avatar, nama, email, dan label akun sendiri.
- `src/routes/admin/users/data-table-actions.svelte`: aktifkan/nonaktifkan.
- `src/routes/admin/users/[id]/+server.ts`: endpoint perubahan status.
- `src/lib/components/ui/data-table/data-table.svelte`: empty message, selection footer, dan getter
  columns.
- `src/lib/components/app-sidebar.svelte`: menu Users.
- `src/routes/admin/+layout.svelte`: label breadcrumb Users.

Tidak perlu migration database atau dependency baru.

## 8. Urutan Implementasi

Fase UI mock:

1. [x] Tetapkan `UserRow` dan buat fixture mock sesuai kontrak final.
2. [x] Buat load summary serta action validasi mock.
3. [x] Sesuaikan perilaku minimum DataTable existing.
4. [x] Buat header, tiga summary card tanpa persentase, dan tombol tambah.
5. [x] Buat identity cell, columns, filter, badge, dan actions visual.
6. [x] Buat modal tambah user dengan Superforms dan feedback mock.
7. [x] Tambahkan sidebar dan breadcrumb.
8. [ ] Verifikasi desktop, mobile, dark mode, keyboard, filter, dan modal.

Fase integrasi Supabase:

1. [ ] Buat Supabase admin client server-only.
2. [ ] Ganti mock load dengan daftar Auth users dan penggabungan profile.
3. [ ] Ganti action mock dengan `auth.admin.createUser()`.
4. [ ] Implement endpoint serta dropdown aktif/nonaktif.
5. [ ] Tambahkan proteksi akun sendiri.
6. [ ] Hapus `mock-data.ts`.
7. [ ] Tambahkan test server untuk create dan perubahan status.
8. [ ] Jalankan Svelte autofixer, `bun run check`, ESLint changed files, dan `bun run test`.

## 9. Kriteria Selesai

- Admin dapat melihat dan mencari daftar pengguna.
- Summary akses aktif dan nonaktif ditampilkan sebagai jumlah akun tanpa persentase.
- Admin dapat membuat akun sales dengan email dan password awal.
- Akun baru langsung memiliki profile sales dan dapat login tanpa konfirmasi email tambahan.
- Email duplikat dan input tidak valid menghasilkan pesan yang dapat dipahami.
- Admin dapat menonaktifkan dan mengaktifkan kembali login pengguna.
- Admin tidak dapat menonaktifkan akunnya sendiri.
- Secret key tidak pernah dikirim ke browser.
- Halaman dapat digunakan pada desktop dan mobile.
- Type check, lint, dan test lulus.

## 10. Di Luar Cakupan

- Edit nama, email, role, atau password pengguna.
- Menghapus pengguna.
- Membuat akun admin dari UI.
- Memaksa pengguna mengganti password pada login pertama.
- Mengirim email undangan.
- Pagination server dan bulk actions.
- Audit log perubahan pengguna.
- Pencabutan access token secara seketika.
