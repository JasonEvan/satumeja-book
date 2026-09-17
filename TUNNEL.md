# Tunnel DOKU Sandbox dengan localhost.run

Gunakan tunnel hanya saat menguji DOKU Sandbox dari komputer lokal. DOKU perlu
memanggil URL HTTPS yang bisa diakses dari internet; `localhost:3000` tidak
bisa diakses langsung oleh server DOKU.

## 1. Menyalakan aplikasi lokal

Buka terminal pertama di folder project, lalu jalankan:

```bash
npm run dev
```

Aplikasi Next.js biasanya tersedia pada `http://localhost:3000`.

## 2. Menyalakan tunnel

Di terminal kedua, jalankan:

```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```

Pada koneksi pertama, SSH mungkin meminta konfirmasi host key. Ketik `yes`.
Setelah tersambung, localhost.run mencetak URL publik, misalnya:

```text
https://contoh-subdomain.lhr.life
```

Simpan URL tersebut. URL dapat berubah setiap kali tunnel dinyalakan lagi.

## 3. Konfigurasi DOKU Sandbox

Isi `.env.local` menggunakan URL tunnel yang sedang aktif:

```env
DOKU_CALLBACK_URL=https://contoh-subdomain.lhr.life/dev/doku/callback
```

Setelah mengubah `.env.local`, restart `npm run dev` agar environment baru
dibaca oleh Next.js.

Jika QRIS dan HTTP Notification sudah diaktifkan oleh DOKU untuk akun Sandbox,
atur Notification URL pada konfigurasi channel DOKU menjadi:

```text
https://contoh-subdomain.lhr.life/api/dev/doku/webhook
```

Perbedaan URL:

| URL | Kegunaan |
| --- | --- |
| `/dev/doku/callback` | Redirect browser pengguna dari halaman DOKU. |
| `/api/dev/doku/webhook` | Notifikasi server-to-server DOKU; aplikasi hanya menulis status ke server console. |

## 4. Menguji tunnel

Buka URL berikut di browser dari jaringan biasa, bukan hanya dari localhost:

```text
https://contoh-subdomain.lhr.life/dev/doku
```

Jika halaman DOKU Sandbox terbuka, tunnel sudah mengarah ke aplikasi lokal.
Setelah simulasi pembayaran, lihat terminal `npm run dev` untuk log webhook:

```text
DOKU Sandbox payment succeeded { ... }
```

## 5. Mematikan tunnel

Fokus ke terminal yang menjalankan perintah `ssh ... localhost.run`, lalu tekan:

```text
Ctrl+C
```

Tunnel langsung berhenti dan URL publik tidak lagi dapat mengakses aplikasi
lokal. Untuk menghentikan Next.js, tekan `Ctrl+C` juga pada terminal yang
menjalankan `npm run dev`.

## Catatan keamanan

- Jangan gunakan tunnel saat tidak sedang diuji, karena tunnel membuka aplikasi
  lokal ke internet.
- Jangan pernah memasukkan `DOKU_SANDBOX_SECRET_KEY` ke browser atau commit ke
  repository.
- URL localhost.run harus HTTPS dan dapat diakses publik agar dapat dipakai
  sebagai URL DOKU.
