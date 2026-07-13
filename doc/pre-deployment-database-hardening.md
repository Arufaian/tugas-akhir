# Pre-deployment Database Hardening

Seluruh pekerjaan dalam catatan ini menjadi gate sebelum deployment. Mock UI dan implementasi awal
kalkulasi dapat dikerjakan lebih dahulu.

## 1. Integritas Histori

Selesaikan sebelum deployment. Jika memungkinkan, lakukan sebelum database mulai menyimpan histori
nyata agar tidak membutuhkan backfill:

- [ ] Tambahkan snapshot nama pembuat pada `calculation_runs`.
- [ ] Ubah FK dari alternative/criterion menuju histori dari `ON DELETE CASCADE` menjadi
      `ON DELETE RESTRICT`.
- [ ] Pertahankan `ON DELETE CASCADE` dari calculation run menuju results/details.

Kontrak snapshot kalkulasi dibahas dalam
[`moora-calculation-roadmap.md`](./moora-calculation-roadmap.md).

## 2. Hardening Akses

### Database Role

- [ ] Buat PostgreSQL login role `app_backend` tanpa `SUPERUSER`, `CREATEDB`, `CREATEROLE`,
      `REPLICATION`, atau `BYPASSRLS`.
- [ ] Simpan password role hanya pada environment variable server.
- [ ] Berikan `CONNECT` database dan `USAGE` schema `public`.
- [ ] Berikan privilege table secara eksplisit sesuai kebutuhan runtime.
- [ ] Batasi calculation tables menjadi `SELECT` dan `INSERT` saja.
- [ ] Tambahkan RLS policy khusus `app_backend` hanya untuk operasi yang diizinkan.
- [ ] Verifikasi `current_user = 'app_backend'` dan RLS aktif pada koneksi runtime.
- [ ] Verifikasi role gagal menjalankan UPDATE/DELETE histori dan seluruh DDL.

### Connection dan Environment

- [ ] Gunakan `DATABASE_URL` dengan role `app_backend` untuk runtime SvelteKit.
- [ ] Gunakan `MIGRATION_DATABASE_URL` dengan role `postgres` hanya untuk migration.
- [ ] Gunakan Supavisor transaction mode untuk deployment Vercel/serverless.
- [ ] Pertahankan `prepare: false` pada client `postgres-js`.
- [ ] Simpan kedua URL sebagai Vercel server-only environment variables tanpa prefix `PUBLIC_`.
- [ ] Pastikan secret tidak muncul dalam Git, log, response, screenshot, atau dokumentasi.

### Data API dan Auth

- [ ] Revoke privilege tabel aplikasi `public` dari `anon` jika browser tidak membutuhkannya.
- [ ] Revoke privilege tabel aplikasi `public` dari `authenticated` jika seluruh data bisnis
      melewati SvelteKit dan Drizzle.
- [ ] Hapus policy sales untuk membuat calculation run jika kalkulasi tetap admin-only.
- [ ] Pertahankan Supabase browser client hanya untuk Auth dan Storage.
- [ ] Audit Storage RLS karena upload alternative dilakukan dari browser.
- [ ] Nonaktifkan public signup dan gunakan invite-only untuk pengguna perusahaan.
- [ ] Pertimbangkan MFA untuk akun admin.

### Supabase Hardening

- [ ] Revoke `EXECUTE` function `is_admin()` dari `anon`.
- [ ] Revoke akses langsung yang tidak diperlukan ke function `set_updated_at()`.
- [ ] Perbaiki policy `auth.uid()` menjadi `(select auth.uid())` jika masih digunakan.
- [ ] Jalankan security dan performance advisors setelah migration.
- [ ] Verifikasi seluruh RLS policy dengan user anon, sales, admin, dan `app_backend`.

## 3. Kriteria Selesai

- Runtime tidak menggunakan database owner `postgres`.
- Regular user tidak dapat mengakses tabel bisnis melalui Data API tanpa kebutuhan eksplisit.
- Histori kalkulasi tidak dapat diubah atau dihapus sebagian oleh runtime.
- Perubahan atau penghapusan master tidak mengubah snapshot histori.
- Migration tetap dapat dijalankan melalui credential owner yang terpisah.
- Seluruh secret hanya tersedia pada server dan deployment environment.

## 4. Referensi

- [Supabase Postgres Roles](https://supabase.com/docs/guides/database/postgres/roles)
- [Supabase Database Connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Testing](https://supabase.com/docs/guides/local-development/testing/overview)
