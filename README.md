# PAYROLLY

Employee & Payroll Management System untuk **Sistem Informasi Akuntansi Penggajian dan Administrasi Karyawan pada Usaha Percetakan**.

## Persyaratan

- Project Supabase PostgreSQL.
- GitHub Pages untuk hosting frontend static (tidak memerlukan Node.js).

## Setup Supabase

1. Buka **SQL Editor** di dashboard Supabase.
2. Jalankan seluruh isi [`sql/schema.sql`](sql/schema.sql). Empat jabatan awal akan ditambahkan otomatis.
3. Ambil **Project URL** dan **Publishable Key** dari pengaturan API project Supabase.
4. Masukkan nilainya pada konstanta `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` di `public/app.js`. Publishable key memang digunakan di browser; jangan pernah memasukkan Secret atau Service Role Key.

Saat memperbarui project, jalankan ulang seluruh `sql/schema.sql` di SQL Editor. Seed memakai `ON CONFLICT DO NOTHING`, sehingga data lama tidak ditimpa. Schema juga membuat tabel `payroll_audit` dan trigger audit.

## Deploy GitHub Pages

1. Simpan perubahan project ke repository GitHub.
2. Pada **Settings > Pages**, pilih branch dan folder root (`/`).
3. Buka `https://<username>.github.io/Sistem-Penggajian-Percetakan/`. `index.html` di root memuat frontend dari `public/` dengan path relatif.

GitHub Pages hanya menyajikan file static. `public/app.js` memakai Supabase JS dari CDN dan mengakses PostgreSQL melalui Supabase Data API; server Node `app.js` tidak dibutuhkan.

## Perhitungan Payroll

- Gaji pokok diambil dari jabatan karyawan saat payroll dihitung dan disimpan sebagai snapshot periode tersebut.
- Tarif lembur per jam = gaji pokok bulanan / 173 x 1,5.
- Potongan alpha = gaji pokok bulanan / jumlah hari kerja Senin-Jumat pada bulan tersebut x jumlah hari alpha.
- Gaji bersih = gaji pokok + pembayaran lembur - potongan, minimum Rp0.
- Payroll yang sudah dibayar tidak ditimpa saat periode dihitung ulang. Payroll berstatus draft dapat dihitung ulang.

## Catatan Keamanan

Kebijakan RLS dalam schema memberi akses penuh kepada role `anon` tanpa autentikasi, termasuk perubahan data. Ini hanya cocok untuk prototype/demo. Jangan gunakan konfigurasi ini untuk data karyawan sungguhan atau aplikasi produksi sebelum menambahkan autentikasi dan mempersempit policy RLS. Publishable key aman untuk ditempatkan di frontend hanya jika policy RLS membatasi akses sebagaimana mestinya; jangan memasukkan Secret/Service Role Key ke aplikasi.

## Struktur

```text
.
├── app.js
├── index.html
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── sql/
│   └── schema.sql
└── README.md
```