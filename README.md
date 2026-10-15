This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cek Booking

Tombol **Cek Booking** di halaman utama membuka `/cek-booking`. Masukkan nomor telepon yang digunakan saat reservasi (format `08…`, `62…`, atau `+62…`) untuk melihat maksimal 20 booking web terbaru, jadwal, meja, dan statusnya. Hasil tidak menampilkan nama, nomor telepon, invoice, atau bukti pembayaran.

Pencarian dilakukan lewat `POST /api/bookings/lookup`, bukan pembacaan `rentals` langsung dari browser. Endpoint membutuhkan `SUPABASE_SERVICE_ROLE_KEY` dan Upstash Redis (`UPSTASH_REDIS_REST_URL` serta `UPSTASH_REDIS_REST_TOKEN`, atau pasangan `KV_REST_API_URL`/`KV_REST_API_TOKEN`). Redis membatasi hingga 30 percobaan per IP dan 20 per nomor telepon dalam jendela 10 menit; tanpa Redis pencarian gagal tertutup. Data pribadi tetap tidak boleh ditampilkan hanya berdasarkan pengetahuan nomor telepon. Akses anonim langsung ke tabel `rentals` yang sudah ada merupakan isu terpisah; lihat `DATABASE.md` bagian Security note.

## Iklan event

Admin di `/admin` dapat mengunggah beberapa gambar JPG/PNG/WebP (maksimal 4 MB) dan menentukan waktu berakhir dengan input **WIB**. Gambar yang belum kedaluwarsa ditampilkan sebagai pop-up bergambar di `/`, dapat digeser antariklan dan ditutup dengan tombol ×. Pop-up tampil lagi jika halaman dimuat ulang. Admin bisa menghapus satu gambar tanpa mengganggu gambar lainnya.

File disimpan di bucket Supabase Storage publik `event-ads` (dibuat otomatis pada unggahan pertama). Nama objek `end-<timestamp-milidetik-UTC>-<uuid>.<ekstensi>` menyimpan batas waktu yang setara dengan input WIB; tidak ada tabel iklan baru. Hanya route server dengan `SUPABASE_SERVICE_ROLE_KEY` yang melakukan daftar, unggah, dan hapus; periksa kebijakan Storage proyek agar `anon`/`authenticated` tidak memiliki izin tulis ke bucket ini. URL gambar bersifat publik.

Set `CRON_SECRET` yang acak dan kuat di environment Vercel Production. Konfigurasi `vercel.json` memanggil `/api/cron/cleanup-ads` pada **17:00 UTC = 00:00 WIB** setiap hari. Route menolak permintaan tanpa `Authorization: Bearer <CRON_SECRET>` dan menghapus gambar yang sudah melewati waktu berakhir. Halaman publik tetap menyaring gambar kedaluwarsa saat dibuka, sehingga keterlambatan cron tidak membuatnya tampil lagi. Pada Vercel Hobby, jadwal harian bisa bergeser sampai sekitar satu jam; cron tidak otomatis diulang setelah gagal. Pantau hasilnya di Vercel Cron Jobs/Functions logs.
