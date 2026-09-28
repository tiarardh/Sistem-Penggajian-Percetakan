# PAYROLLY

Employee & Payroll Management System untuk **Sistem Informasi Akuntansi Penggajian dan Administrasi Karyawan pada Usaha Percetakan**.

## Persyaratan

- Project Supabase PostgreSQL.
- GitHub Pages untuk hosting frontend static (tidak memerlukan Node.js).

## Setup Supabase

1. Buka **SQL Editor** di dashboard Supabase.
2. Jalankan seluruh isi [`sql/schema.sql`](sql/schema.sql). Migration mempertahankan tabel/seed lama, membuat profile Auth, dan mengganti policy prototype `anon` dengan RLS role-based.
3. Di **Authentication > URL Configuration**, masukkan URL GitHub Pages project ke **Site URL** dan **Redirect URLs**, misalnya `https://<username>.github.io/Sistem-Penggajian-Percetakan/`.
4. Ambil **Project URL** dan **Publishable Key** dari pengaturan API Supabase. Isi `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` pada `public/app.js`.

Publishable key memang digunakan di browser. Jangan pernah memasukkan Secret atau Service Role Key. Jalankan ulang `sql/schema.sql` saat memperbarui policy; seed memakai `ON CONFLICT DO NOTHING` sehingga data operasional yang sudah ada tidak ditimpa.

## Akun dan Role

1. Setelah schema terpasang, daftarkan akun pertama melalui **Daftar Guest**.
2. Di SQL Editor, jadikan akun tersebut admin (ganti alamat email):

```sql
update public.profiles
set role = 'admin', employee_id = null
where lower(email) = lower('admin@example.com');
```

3. Keluar lalu masuk kembali. Semua pendaftaran dari frontend selalu dimulai sebagai Guest; hanya admin yang dapat mengubah role.
4. Buat data karyawan dari menu **Karyawan**. Setelah karyawan mendaftar dan verifikasi email, buka **Pengguna**, ubah role menjadi **Karyawan**, lalu tautkan ke data karyawan yang sesuai.

Admin dapat mengelola role akun yang sudah mendaftar. Pembuatan/invitasi akun Auth harus dilakukan melalui alur signup Supabase; aplikasi static tidak menggunakan Admin API atau service-role key.

## Deploy GitHub Pages

1. Simpan perubahan project ke repository GitHub.
2. Pada **Settings > Pages**, pilih branch dan folder root (`/`).
3. Buka `https://<username>.github.io/Sistem-Penggajian-Percetakan/`. `index.html` di root memuat frontend dari `public/` dengan path relatif.
4. Pastikan URL project tersebut juga diizinkan pada Supabase Auth Redirect URLs.

GitHub Pages hanya menyajikan file static. `public/app.js` memakai Supabase JS dari CDN dan mengakses PostgreSQL melalui Supabase Data API; server Node `app.js` tidak dibutuhkan.

## Perhitungan Payroll

- Gaji pokok diambil dari jabatan karyawan saat payroll dihitung dan disimpan sebagai snapshot periode tersebut.
- Tarif lembur per jam = gaji pokok bulanan / 173 x 1,5.
- Potongan alpha = gaji pokok bulanan / jumlah hari kerja Senin-Jumat pada bulan tersebut x jumlah hari alpha.
- Gaji bersih = gaji pokok + pembayaran lembur - potongan, minimum Rp0.
- Payroll yang sudah dibayar tidak ditimpa saat periode dihitung ulang. Payroll berstatus draft dapat dihitung ulang.

## Catatan Keamanan

Semua tabel aplikasi memakai RLS dan hanya memberi akses ke role `authenticated`: admin mengelola seluruh data; karyawan hanya membaca data employee, absensi, payroll, dan jabatan yang terkait dengannya serta hanya menulis absensinya sendiri; guest tidak mendapat akses ke tabel operasional. Akun Auth baru otomatis dibuat sebagai Guest. Jangan menambahkan policy `anon` yang memberi akses luas. Review policy sebelum memakai data karyawan sungguhan dan jangan memasukkan Secret/Service Role Key ke aplikasi.

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