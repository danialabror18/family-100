# Family 100

Game Family 100 (mode 2 tim) dengan board survey AI lokal.

## Cara main

1. Jalankan server lokal (wajib, supaya `survey.json` bisa dimuat):

```bash
cd ~/family-100
python3 -m http.server 5173
```

2. Buka http://localhost:5173

3. Isi nama Tim A & Tim B → **Mulai Face-off**

### Alur (share screen aman)
- Hafalkan jawaban dari `data/survey.json` — **tidak ditampilkan di layar**
- **Peserta benar** → klik baris nomor 1–5 di papan (atau keyboard `1`–`5`)
- **Peserta salah** → tombol **Salah** di bawah papan (atau keyboard `X`)
- Face-off / Steal / Ronde ada di bilah bawah
- Cocok di-share screen: penonton hanya lihat papan, bukan daftar jawaban

## Ganti pertanyaan

Edit `data/survey.json`. Contoh satu ronde:

```json
{
  "id": "r4",
  "question": "JUDUL PERTANYAAN\nBARIS KEDUA",
  "answers": [
    { "text": "JAWABAN SATU", "points": 50, "aliases": ["singkatan"] },
    { "text": "JAWABAN DUA", "points": 40, "aliases": [] },
    { "text": "JAWABAN TIGA", "points": 30, "aliases": [] },
    { "text": "JAWABAN EMPAT", "points": 20, "aliases": [] },
    { "text": "JAWABAN LIMA", "points": 10, "aliases": [] }
  ]
}
```
