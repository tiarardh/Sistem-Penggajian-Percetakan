# PAYROLLY

Employee & Payroll Management System untuk **Sistem Informasi Akuntansi Penggajian dan Administrasi Karyawan pada Usaha Percetakan**.

## Persyaratan

- Node.js 18 atau lebih baru (menggunakan `fetch` bawaan Node).
- Project Supabase PostgreSQL.

Tidak ada npm package, `package.json`, atau file env yang diperlukan.

## Setup Supabase

1. Buka **SQL Editor** di dashboard Supabase.
2. Jalankan seluruh isi [`sql/schema.sql`](sql/schema.sql). Empat jabatan awal akan ditambahkan otomatis.
3. Ambil **Project URL** dan **Publishable Key** dari pengaturan API project Supabase.
4. Masukkan nilainya pada konstanta `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` di `app.js`, atau berikan sebagai environment variable saat menjalankan server.

Saat memperbarui project, jalankan ulang seluruh `sql/schema.sql` di SQL Editor. Seed memakai `ON CONFLICT DO NOTHING`, sehingga data lama tidak ditimpa. Versi ini menambahkan tabel pendamping `payroll_audit` dan trigger audit; jalankan schema terbaru agar halaman riwayat payroll dapat membaca log.

Contoh PowerShell:

```powershell
$env:SUPABASE_URL = "https://project-ref.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your-key"
node app.js
```

Alternatifnya, isi konstanta di bagian atas `app.js`, kemudian jalankan:

```powershell
node app.js
```

Buka <http://localhost:3000>. Port dapat diubah dengan environment variable `PORT`.

## Perhitungan Payroll

- Gaji pokok diambil dari jabatan karyawan saat payroll dihitung dan disimpan sebagai snapshot periode tersebut.
- Tarif lembur per jam = gaji pokok bulanan / 173 x 1,5.
- Potongan alpha = gaji pokok bulanan / jumlah hari kerja Senin-Jumat pada bulan tersebut x jumlah hari alpha.
- Gaji bersih = gaji pokok + pembayaran lembur - potongan, minimum Rp0.
- Payroll yang sudah dibayar tidak ditimpa saat periode dihitung ulang. Payroll berstatus draft dapat dihitung ulang.

## Catatan Keamanan

Kebijakan RLS dalam schema memberi akses penuh kepada role `anon` untuk keperluan prototype lokal tanpa autentikasi. Jangan gunakan konfigurasi ini untuk data karyawan sungguhan atau aplikasi produksi sebelum menambahkan autentikasi, mempersempit policy RLS, dan membatasi akses berdasarkan pengguna. Gunakan hanya **Publishable Key**; jangan memasukkan Secret/Service Role Key ke aplikasi.

## Struktur

```text
.
├── app.js
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── sql/
│   └── schema.sql
└── README.md
```