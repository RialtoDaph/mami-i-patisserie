# Mami I Pâtisserie — Sistem Internal & Website

Satu aplikasi untuk:

- **Website publik** di `/`: beranda, katalog (`/katalog`), hampers (`/hampers`), kontak (`/kontak`), dan
  keranjang (`/keranjang`). Order dikirim lewat WhatsApp, tanpa checkout atau payment gateway.
- **Aplikasi internal** di `/app` (wajib login), berisi:
  - **Preorder**: order dari WhatsApp, pelanggan, kapasitas mingguan, jadwal produksi, pembayaran/DP,
    campaign musiman (mis. Lebaran 2027), dashboard owner, dan export CSV.
  - **Costing resep**: bahan & kemasan, resep (termasuk sub-resep), paket/hampers, ringkasan HPP,
    dan export CSV.

> Kasir dan stok transaksi **tidak** dibuat di sini. Semua itu nanti ditangani Majoo.

Teknologi: Next.js 16 (App Router) + TypeScript + Tailwind CSS, Supabase (Postgres, Auth,
Row Level Security), deploy ke Vercel.

---

## 1. Setup Supabase

1. Buat akun di [supabase.com](https://supabase.com), lalu klik **New project**.
   - Region: pilih **Southeast Asia (Singapore)** supaya cepat dari Bandung.
   - Simpan password database di tempat aman.
2. Jalankan migration (membuat tabel, aturan akses, dan fungsi):
   - Buka **SQL Editor** → **New query**.
   - Salin isi file-file ini **secara berurutan**, lalu klik **Run** untuk tiap file:
     1. `supabase/migrations/20260926000001_roles_profiles.sql`
     2. `supabase/migrations/20260926000002_costing_schema.sql`
     3. `supabase/migrations/20260926000003_rls_and_rpc.sql`
     4. `supabase/migrations/20260927000001_preorder_schema.sql`
     5. `supabase/migrations/20260927000002_preorder_rls_rpc.sql`
     6. `supabase/migrations/20260927000003_public_site.sql`
   - Migration no. 5 juga membuat dua tempat penyimpanan foto (Storage):
     `product-photos` (foto produk, bisa dilihat publik) dan `payment-proofs` (bukti bayar, **privat**).
   - *Alternatif untuk yang terbiasa pakai terminal:* `npx supabase link` lalu `npx supabase db push`.
3. (Opsional) Isi **data contoh DUMMY**: jalankan `supabase/seed.sql` di SQL Editor.
   Semua data contoh namanya diawali `[DUMMY]` dan harganya **karangan**.
   Sebelum memasukkan data asli, hapus semuanya dengan `supabase/remove_dummy.sql`.
4. Matikan pendaftaran publik: **Authentication → Sign In / Providers → Email**.
   Matikan **Allow new users to sign up**, sehingga hanya Alto yang bisa membuat akun.
5. Buat akun tim di **Authentication → Users → Add user → Create new user**.
   Isi email + password dan centang **Auto Confirm User**.
6. Beri peran lewat **SQL Editor**. Akun tanpa peran bisa login tapi tidak bisa melihat data apa pun.

   ```sql
   update public.profiles p set role = 'owner', full_name = 'Alto'
   from auth.users u where u.id = p.id and u.email = 'email-alto@contoh.com';

   update public.profiles p set role = 'admin', full_name = 'Nana'
   from auth.users u where u.id = p.id and u.email = 'email-nana@contoh.com';

   update public.profiles p set role = 'produksi', full_name = 'Mami'
   from auth.users u where u.id = p.id and u.email = 'email-mami@contoh.com';
   ```

### Hak akses

| Peran | Bisa apa |
|---|---|
| `owner` (Alto) | Semua |
| `admin` (Nana) | Semua |
| `produksi` (Mami) | Lihat semua; tambah & ubah bahan, resep, order, pelanggan; catat pembayaran. **Tidak bisa** menghapus, mengubah harga jual/target HPP, mengubah paket/produk/campaign/pengaturan, atau melihat dashboard omzet. Order dibatalkan lewat status "Batal". |
| `manager` | Hanya lihat (disiapkan untuk manajer outlet nanti) |

Aturan ini dijaga langsung oleh database (Row Level Security + trigger), jadi tetap aman
walaupun ada yang mencoba lewat jalur lain.

## 2. Environment variable

Salin `.env.example` menjadi `.env.local`, lalu isi dari **Supabase → Project Settings → API**
(atau **Connect**):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # "anon public" / "publishable" key
```

Untuk website publik (lihat `.env.example`):

```
NEXT_PUBLIC_SITE_URL=https://alamat-website-anda
NEXT_PUBLIC_WHATSAPP_NUMBER=0812xxxxxxxx   # nomor WA untuk order
NEXT_PUBLIC_INSTAGRAM=namaakun             # tanpa @
NEXT_PUBLIC_SHOW_DUMMY=                    # isi 1 hanya di Preview untuk menampilkan produk DUMMY
```

Selama `NEXT_PUBLIC_WHATSAPP_NUMBER` kosong, tombol WhatsApp di website disembunyikan.

`.env.local` **tidak** ikut masuk ke Git. Jangan pernah memakai atau commit `service_role` key.

## 3. Menjalankan di komputer sendiri

Butuh [Node.js](https://nodejs.org) versi 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000, lalu masuk lewat http://localhost:3000/login.

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `npm test` | Unit test fungsi perhitungan (Vitest) |
| `npm run lint` | Cek kode |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run build` | Build produksi |
| `scripts/test-db.sh` | Tes aturan akses database di Postgres lokal **kosong** (lihat isi file) |

## 4. Deploy ke Vercel

1. Login ke [vercel.com](https://vercel.com) memakai akun GitHub.
2. **Add New → Project**, lalu pilih repo `mami-i-patisserie`. Framework otomatis terdeteksi sebagai Next.js.
3. Di **Environment Variables**, isi `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nilainya sama dengan `.env.local`).
4. Klik **Deploy**. Setiap push ke branch `main` akan otomatis di-deploy ulang.
5. Di Supabase, buka **Authentication → URL Configuration** dan isi **Site URL** dengan
   alamat Vercel, misalnya `https://mami-i-patisserie.vercel.app`.

## 5. Cara pakai singkat

- **Bahan**: tekan **+ Tambah**, isi nama, pilih *dibeli per* (kg / liter / pcs / pack),
  isi jumlah dan harga, lalu **Simpan**. Harga per gram/ml/pcs dihitung otomatis.
  - Contoh pack: butter 227 g seharga Rp 45.000 → pilih **pack**, isi pack diukur dalam **g**, isi `227`.
  - Saat harga bahan diubah, muncul daftar produk yang **akan melewati target HPP** sebelum disimpan.
  - Setiap perubahan harga tercatat di **Riwayat harga**.
- **Resep**: isi hasil jadi per batch dan susut %, lalu tambahkan bahan atau sub-resep.
  Biaya dan HPP langsung terhitung saat mengetik. Tombol **Duplikat** dipakai untuk membuat variasi.
  - Sub-resep (misalnya pistachio cream) memakai satuan hasilnya sendiri (misalnya gram),
    lalu dipakai di resep lain, misalnya 25 g per croissant.
  - Resep tidak bisa saling memakai secara melingkar.
- **Paket**: gabungkan produk, kemasan, dan kartu. Biaya paket = jumlah biaya isinya.
- **Ringkasan**: semua produk aktif dengan HPP berwarna (**hijau** = sesuai target,
  **merah** = di atas target). Ada pilihan harga + PBJT 10%, pembulatan saran harga ke
  Rp 500 / Rp 1.000, dan **Export CSV**.

### Website publik

- Produk tampil di website kalau di **Lainnya → Produk** dicentang **Tampil di website** dan **Aktif**.
  Kategori di website dipilih di kolom **Kategori di website**.
- Label **"Kuota minggu ini penuh"** muncul otomatis kalau kapasitas minggu berjalan (Senin–Minggu) sudah habis.
- Halaman **Hampers** menampilkan campaign aktif (sedang buka atau akan buka) dengan harga khusus campaign.
  Produk dari campaign yang belum buka bisa dilihat, tapi belum bisa masuk keranjang.
- Keranjang disimpan di browser pembeli. Tombol **Pesan via WhatsApp** membuka WhatsApp dengan pesan berisi
  daftar item, jumlah, total, tanggal, dan cara pengambilan. Admin lalu input order di aplikasi.
- Data website diperbarui paling lambat **5 menit** setelah ada perubahan di aplikasi.
- **Mengganti warna brand**: ubah nilai warna di `src/app/brand.css`. **Mengganti teks** (cerita, area kirim,
  dll.): `src/content/site.ts`. Semua yang bertanda `PLACEHOLDER` perlu dikonfirmasi.
- Pengunjung hanya bisa membaca data lewat 2 fungsi khusus (`public_catalog`, `public_campaigns`).
  Data order dan pelanggan tetap tertutup.

### Preorder

Navigasi bawah: **Beranda · Order · Produksi · Costing · Lainnya**.

- **Beranda**: owner/admin melihat dashboard (total order, omzet, belum lunas, DP belum masuk,
  produk terlaris, pelanggan order ulang), dan bisa difilter per campaign. Mami melihat produksi hari ini,
  besok, dan order 3 hari ke depan.
- **Order baru** (3 bagian, lalu Simpan):
  1. **Pelanggan**: ketik nomor WhatsApp. Pelanggan lama langsung dikenali, dan nama/alamatnya terisi otomatis.
  2. **Produk & tanggal**: pilih campaign (kalau ada), tanggal ambil/kirim, dan jumlah per produk.
     Sisa kuota minggu itu terlihat. Kalau kuota habis muncul **PENUH** dan tombol + terkunci.
  3. **Kirim & bayar**: ambil sendiri / kirim instan / ekspedisi, ongkir, diskon, dan DP (saran otomatis, bisa diubah).

  Setelah disimpan muncul tombol **Kirim konfirmasi WhatsApp**.
- **Detail order**:
  - Catat pembayaran (DP/pelunasan) dengan foto bukti. Begitu DP terpenuhi, status otomatis jadi "DP diterima".
  - Tombol "Tandai: …" untuk status berikutnya.
  - 4 pesan WhatsApp siap kirim: konfirmasi, pengingat pelunasan, siap diambil/dikirim, dan sudah dikirim.
- **Produksi**: total per produk per tanggal ambil/kirim. "Kebutuhan resep" menguraikan paket ke resep
  dan resep ke sub-resep, termasuk jumlah batch.
- **Lainnya → Produk**: produk jualan dibuat dari resep atau paket, misalnya "Risol frozen isi 10" = 10 × resep risol.
  Isi harga, kapasitas per minggu (Senin–Minggu), lead time, foto, dan tanda tampil di website.
- **Lainnya → Campaign**: tanggal buka/tutup preorder, rentang tanggal ambil/kirim, DP %, produk yang termasuk,
  dan harga khusus.
- **Lainnya → Pengaturan**: rekening, QRIS, dan alamat ambil. Semua data ini muncul otomatis di pesan WhatsApp.

Aturan kapasitas, lead time, dan jendela campaign juga dijaga oleh database. Jadi walaupun Mami dan Nana
input order bersamaan, kuota tidak bisa kelebihan.

### Rumus

- Biaya per pcs = biaya per batch ÷ (hasil × (1 − susut%))
- HPP % = biaya per pcs ÷ harga jual (harga jual disimpan **sebelum** PBJT)
- Saran harga = biaya per pcs ÷ target HPP, dibulatkan **ke atas** ke Rp 500 / Rp 1.000
- Margin kotor = harga jual − biaya per pcs
- Harga + PBJT = harga jual × 1,1 (hanya untuk tampilan)
- Total order = subtotal + ongkir − diskon
- Saran DP = total × DP %, dibulatkan **ke atas** ke Rp 1.000
- Kuota terpakai = jumlah produk di semua order yang tidak batal, dalam minggu Senin–Minggu yang sama
  dengan tanggal ambil/kirim
