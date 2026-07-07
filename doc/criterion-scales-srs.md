# SRS — Criterion Scales

## 1. Pendahuluan

### 1.1 Tujuan

Dokumen ini mendefinisikan requirement fungsional dan antarmuka untuk fitur CRUD **criterion scales** pada modul admin SPK.

### 1.2 Ruang Lingkup

Sub-halaman `/admin/criteria/[id]/scales` — pengelolaan skala penilaian untuk satu kriteria.

### 1.3 Definisi

| Istilah    | Definisi                                                |
| ---------- | ------------------------------------------------------- |
| SPK        | Sistem Pendukung Keputusan                              |
| Criterion  | Kriteria penilaian motor (e.g. Harga, CC, Konsumsi BBM) |
| Scale      | Tingkat/level penilaian untuk suatu kriteria            |
| orderIndex | Urutan tampilan scale (ascending)                       |

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk

Bagian dari modul admin SPK. Kriteria dengan `inputType = 'scale'` membutuhkan daftar skala agar user bisa memilih nilai saat input penilaian.

### 2.2 Fungsi Produk

- Melihat daftar scale milik suatu kriteria (urut ascending orderIndex)
- Menambah scale baru (label, value, description opsional)
- Mengedit scale yang sudah ada
- Menghapus scale dengan konfirmasi

### 2.3 Karakteristik Pengguna

Admin internal (role `sales`/`admin`) yang mengelola data master SPK.

---

## 3. Kebutuhan Antarmuka (UI)

### 3.1 Layout

Menggunakan pendekatan **stacked card + inline add form**:

- Card header: judul "Skala Penilaian — {nama_kriteria}"
- Form tambah di atas (sticky secara visual, bukan CSS sticky)
- List scale sebagai card horizontal dengan progress bar
- Aksi edit/delete langsung di baris

### 3.2 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  ← Kembali ke Kriteria                                      │
│                                                             │
│  Skala Penilaian                       Total: 5 skala      │
│  Atur tingkat penilaian untuk {nama_kriteria}               │
│                                                             │
│  ┌─ Tambah Skala ─────────────────────────────────────┐     │
│  │ Label    [________________]  Nilai  [5]  Deskripsi │     │
│  │          [________________]                         │     │
│  │                   [Simpan]  [Batal]                 │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
│  ── 1 ─────────────────────────────────────────────────     │
│  │  1   Sangat Murah               nilai  5   ✏️  🗑️    │
│  │  ████████████████████████████████████                    │
│  ── 2 ─────────────────────────────────────────────────     │
│  │  2   Murah                      nilai  4   ✏️  🗑️    │
│  │  ██████████████████████████████                          │
│  ── 3 ─────────────────────────────────────────────────     │
│  │  3   Sedang                     nilai  3   ✏️  🗑️    │
│  │  ████████████████████                                    │
│  ── 4 ─────────────────────────────────────────────────     │
│  │  4   Mahal                      nilai  2   ✏️  🗑️    │
│  │  ████████████                                            │
│  ── 5 ─────────────────────────────────────────────────     │
│  │  5   Sangat Mahal              nilai  1   ✏️  🗑️    │
│  │  ██████                                                  │
│                                                             │
│  ⋮ (empty state jika belum ada scale)                       │
│    Belum ada skala. Tambah skala pertama di atas.           │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 State & Komponen

| State          | Tampilan                                       |
| -------------- | ---------------------------------------------- |
| **Loading**    | Skeleton card (3 baris shimmer) saat load data |
| **Empty**      | Ilustrasi/teks "Belum ada skala" + tombol add  |
| **Error**      | Toast error dari form action / fetch delete    |
| **Submitting** | Button disabled + spinner, form field readonly |

### 3.4 Mobile

- Layout tetap stacked (tidak ada grid)
- Progress bar tetap proporsional
- Tombol aksi (✏️🗑️) di kanan

---

## 4. Kebutuhan Fungsional

### 4.1 Melihat Daftar Scale

- List scale berdasarkan `criterionId` dari params
- Urut ascending berdasarkan `orderIndex`
- Tampilkan: nomor urut, label, value (badge), progress bar, action edit/delete

### 4.2 Menambah Scale

- Form: label (text, required), value (number, required), description (text, optional)
- orderIndex: auto (max orderIndex + 1 dari scale yang sudah ada)
- Validasi via Zod di server + client
- Setelah sukses: toast success, form reset, list refresh

### 4.3 Mengedit Scale

- Klik ✏️ → form berubah jadi mode edit (inline)
- Field terisi data lama
- Simpan via `?/update` form action
- Batal kembali ke display mode

### 4.4 Menghapus Scale

- Klik 🗑️ → confirm dialog (`ConfirmDeleteDialog`)
- Delete via `DELETE /admin/criteria/[id]/scales/[scaleId]`
- Toast sukses/gagal, invalidate data

### 4.5 Navigasi

- Dari halaman criteria list: tombol "Skala" di tiap baris dengan `inputType === 'scale'`
- Header halaman scales: breadcrumb/link "← Kembali ke Kriteria"

---

## 5. Validasi & Aturan Bisnis

| Aturan                    | Detail                                                                    |
| ------------------------- | ------------------------------------------------------------------------- |
| Label                     | Wajib, string non-kosong                                                  |
| Value                     | Wajib, numerik ≥ 0                                                        |
| Description               | Opsional                                                                  |
| orderIndex                | Auto-increment per criterionId                                            |
| Unik dalam satu criterion | Label (case-insensitive) tidak boleh duplikat per criterionId             |
| Cascade delete            | Jika criterion dihapus, semua scale-nya ikut terhapus (ON DELETE CASCADE) |

---

## 6. Struktur Data

### 6.1 Tabel Database (`criterion_scales`)

| Kolom        | Tipe          | Constraint                                    |
| ------------ | ------------- | --------------------------------------------- |
| id           | uuid          | PK, default gen_random_uuid()                 |
| criterion_id | uuid          | FK → criteria.id, NOT NULL, ON DELETE CASCADE |
| label        | text          | NOT NULL                                      |
| value        | numeric(10,4) | NOT NULL                                      |
| description  | text          | nullable                                      |
| order_index  | integer       | NOT NULL                                      |
| created_at   | timestamptz   | default now()                                 |
| updated_at   | timestamptz   | default now()                                 |

### 6.2 Zod Schema

```ts
export const criterionScaleSchema = z.object({
	id: z.string(),
	criterionId: z.string(),
	label: z.string(),
	value: z.number(),
	description: z.string().nullable(),
	orderIndex: z.number(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const createCriterionScaleSchema = z.object({
	label: z.string().trim().min(1, 'Label wajib diisi'),
	value: z.coerce.number().min(0, 'Nilai harus ≥ 0'),
	description: z.string().optional()
});

export const updateCriterionScaleSchema = createCriterionScaleSchema;
```

---

## 7. Struktur Route & Aksi

```
src/routes/admin/criteria/[id]/scales/
├── +page.svelte           ← halaman list + form add + edit inline
├── +page.server.ts        ← load() + actions: create, update
└── [scaleId]/
    └── +server.ts         ← DELETE
```

| Aksi         | Method             | Implementation                                                                               |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------- |
| List scales  | `load()`           | `db.select().from(criterionScalesTable).where(eq(criterionId, id)).orderBy(asc(orderIndex))` |
| Tambah scale | `actions.create`   | superValidate → `db.insert`                                                                  |
| Edit scale   | `actions.update`   | superValidate → `db.update` (by id)                                                          |
| Hapus scale  | `DELETE [scaleId]` | `db.delete` via `+server.ts` (sama pola `criteria/[id]/+server.ts`)                          |

---

## 8. Kebutuhan Non-Fungsional

| Aspek         | Kriteria                                                               |
| ------------- | ---------------------------------------------------------------------- |
| Kinerja       | Render daftar < 100ms (scale < 20 item per criterion)                  |
| Aksesibilitas | Keyboard navigable, focus trap di dialog, aria-label pada icon button  |
| Responsif     | Mobile (375px) hingga desktop (1440px)                                 |
| Dark mode     | Mengikuti sistem (mode-watcher) — tidak perlu styling khusus           |
| Konsistensi   | Mengikuti pattern komponen yang sudah ada (Card, Button, Badge, toast) |

---

## 9. UI Design Prompt (English)

Generate a Svelte 5 admin sub-page at `/admin/criteria/[id]/scales` for managing criterion evaluation scales in a Decision Support System (SPK) for motorcycle selection. Use shadcn-svelte components with Tailwind CSS v4.

### Layout

**Stacked card layout** with these sections from top to bottom:

1. **Back navigation** — A text link "← Kembali ke Kriteria" pointing back to `/admin/criteria` using shadcn Button variant="link".
2. **Page header** — A non-interactive Card with:
   - Left: ruler icon (Lucide `Ruler`) + title "Skala Penilaian — {criterion_name}" in `font-display text-2xl font-semibold tracking-tight`
   - Right: total count badge `{n} skala` in muted text
   - Below title: description "Atur tingkat penilaian untuk {criterion_name}" in `text-muted-foreground text-sm`
3. **Add form card** — A Card containing an inline form with fields:
   - Label (Input, required, placeholder "Cth: Sangat Murah")
   - Value (Input type number, required, placeholder e.g. "5")
   - Description (Input, optional, placeholder "Deskripsi singkat (opsional)")
   - Submit button "Simpan" (Button variant="default") + Cancel "Batal" (Button variant="outline", href back)
   - Validation errors shown inline via shadcn Form.FieldErrors
4. **Scales list** — A vertical stack of scale items, each as a `<div>` with:
   - Left: order number in a muted circular badge
   - Middle: scale label (text) + value (Badge component — color gradient from destructive (low value) → warning → success (high value))
   - Visual progress bar below the label using a `<div>` with dynamic width proportional to value/maxValue, colored `bg-primary`
   - Right: two icon buttons — edit (Pencil icon, triggers inline edit mode) and delete (Trash2 icon, opens ConfirmDeleteDialog)
   - Each item separated by `<Separator />` or a subtle border
5. **Empty state** — Centered text "Belum ada skala. Tambah skala pertama di atas." with muted styling and a Plus icon, shown when list is empty.
6. **Loading state** — 3 skeleton rows (shimmer animation via `<div class="animate-pulse ...">`) while data loads.

### Interactions

- **Add**: Form submits via SvelteKit form action `?/create`. On success: toast "Skala berhasil ditambahkan", form resets, list refreshes (invalidateAll). On error: toast error message.
- **Edit**: Clicking the edit icon replaces the scale's display row with an inline form (same fields, pre-filled). Save button submits via `?/update`. Cancel reverts to display mode.
- **Delete**: Clicking the delete icon opens `ConfirmDeleteDialog` ("Yakin ingin menghapus skala {label}?"). Confirm sends DELETE fetch request to `/admin/criteria/[id]/scales/[scaleId]`. Toast on success/failure.
- **Navigation**: A "Skala" button appears in the criteria DataTable row actions for criteria with `inputType === 'scale'`, linking to this sub-page.

### Visual Style

- Use existing shadcn-svelte component library (Card, Button, Input, Badge, Separator, ConfirmDeleteDialog, toast from svelte-sonner)
- Dark mode handled by `mode-watcher` — no custom theme tokens
- Progress bar width = `(value / maxValueInList) * 100%` — gives instant visual distribution
- Badge value color: lower values use `destructive` variant, middle uses `warning`, higher uses `success`
- Gunakan skills yang relevan seperti **shadcn-svelte** untuk component primitives, **svelte-code-writer** untuk dokumentasi Svelte 5 runes, dan **svelte-autofixer** untuk post-edit validation
- All action icons use Lucide SVG icons, not emoji
- Touch targets ≥ 44px for all interactive elements
- Form submit button shows spinner + disabled state during submission
- Responsive down to 375px: form fields stack vertically on mobile
