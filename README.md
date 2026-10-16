# Qum zanjiri — Vercel + Neon

Qum tannarxi va norma/fakt nazorati sahifasi (claude.ai dagi 16-versiya) — endi o'z serveringizda:
**Vercel** sahifa va API ni beradi, **Neon** (Postgres) ma'lumotni saqlaydi. Hisob-kitob kodi o'zgarmagan.

Qo'shilgani: login/parol bilan kirish, rollar (administrator, operator, ko'ruvchi), foydalanuvchilarni
boshqarish, zaxira nusxa va fayldan tiklash, serverda o'chirib bo'lmaydigan yozish jurnali.

---

## 1. Deploy — eng qisqa yo'l (taxminan 15 daqiqa)

Kerak: Vercel akkaunti (bepul Hobby yetadi) va shu papka.

### 1.1. Loyihani Vercel'ga yuklash

**A variant — GitHub orqali (keyingi yangilanishlar oson):**
1. GitHub'da **Private** (yopiq) repozitoriy oching va shu papkani yuklang. `data/` papkasi `.gitignore` da — u GitHub'ga chiqmaydi va chiqmasligi kerak (unda kompaniya raqamlari bor).
2. vercel.com → **Add New… → Project** → repozitoriyni tanlang → **Import**.
3. Framework Preset: **Other**. Build/Output sozlamalariga tegmang. **Deploy** bosing.

**B variant — kompyuterdan buyruq bilan:**
```bash
npm i -g vercel
cd qum-zanjiri
vercel            # birinchi marta: akkauntga kirish, loyiha nomi so'raladi
```

Birinchi deploy muvaffaqiyatli bo'ladi, lekin sahifa hali ishlamaydi — baza va kalitlar yo'q. Bu normal.

### 1.2. Neon bazasini ulash

Vercel'da loyiha → **Storage** → **Create Database** → **Neon** → mintaqa: **Frankfurt (eu-central-1)** → Create → loyihaga ulang (Connect).
Vercel `DATABASE_URL` o'zgaruvchisini o'zi qo'shadi.

> Funksiyalar `vercel.json` da Frankfurt'ga (`fra1`) qo'yilgan — baza ham Frankfurt'da bo'lsa, so'rovlar tez.
> Bazani boshqa mintaqada yaratsangiz, `vercel.json` dagi `"regions"` ni unga yaqin mintaqaga o'zgartiring.

Neon'da o'zingiz akkaunt ochgan bo'lsangiz: Neon → loyiha → **Connect** → *Pooled connection* satrini nusxalab,
Vercel'da `DATABASE_URL` sifatida qo'shing.

### 1.3. Ikki kalit qo'shish

Vercel → loyiha → **Settings → Environment Variables** (Production uchun):

| Nomi | Qiymati |
|---|---|
| `SESSION_SECRET` | kamida 32 belgili tasodifiy matn (quyidagi buyruq bilan) |
| `SETUP_TOKEN` | kamida 16 belgili, o'zingiz o'ylagan kalit — faqat birinchi sozlashda kerak |

Tasodifiy matn yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Windows PowerShell'da:
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
```

So'ng **Deployments → oxirgi deploy → ⋯ → Redeploy** (o'zgaruvchilar faqat yangi deploy'da kuchga kiradi).

### 1.4. Birinchi sozlash

Sayt manzilini oching (masalan `https://qum-zanjiri.vercel.app`) — o'zi `/setup.html` ga o'tadi:
1. **Server holati** — hamma qatorda «bor» bo'lishi kerak. «Yo'q» bo'lsa — 1.2–1.3 ga qayting.
2. **Administrator** — `SETUP_TOKEN`, loginingiz, ismingiz, parol (kamida 10 belgi).
3. **Ma'lumot** — `data/qum-zanjiri-data.json` faylini tanlang → **Yuklash**. Bu claude.ai dagi sahifadan
   2026-10-12 da olingan nusxa: 93 hujjat, 5 927 yozuv (may 2025 – sentyabr 2026, Samarqand karyeri ham).
4. **Sahifani ochish**.

Shundan keyin `SETUP_TOKEN` ni o'chirib qo'yishingiz mumkin.

> **Muhim:** yangi saytga o'tgan kundan boshlab yozuvlarni faqat shu yerda kiriting. claude.ai dagi eski sahifa
> bilan ikkalasi alohida bazalar — bir-biriga ko'chmaydi. Agar 12-oktabrdan keyin eski sahifaga yozuv kiritilgan
> bo'lsa, deploy'dan oldin yangi nusxa oling (Claude'dan so'rang) va shu faylni yuklang.

---

## 2. Foydalanuvchilar

Sahifa yuqorisida **Foydalanuvchilar** → **+ Yangi foydalanuvchi**. Parol avtomatik yaratiladi — uni xodimga bering,
u kirgach **Parol** bo'limida o'zgartiradi.

| Rol | Nima qila oladi |
|---|---|
| Administrator | Hammasi: normativlar, sozlamalar, foydalanuvchilar, zaxira, jurnallar |
| Operator | Jurnallarga kiritish va tuzatish, hisobotlarni ko'rish. Normativlarni o'zgartira olmaydi. Uchastkasi (Samarqand, Qibray, Chust, Megaton) — «Kiritish» bo'limida birinchi ochiladi |
| Ko'ruvchi | Faqat ko'rish va Excelga yuklab olish (masalan, direktor) |

Ruxsatlar serverda tekshiriladi — brauzerda nimadir o'zgartirilsa ham operator sozlamani, ko'ruvchi esa hech narsani yoza olmaydi.

- Xodim ketdi → **Bloklash**: shu zahoti kira olmaydi, ochiq sahifasi ham yozolmaydi.
- Parolni unutdi → **Parolni tiklash**: yangi parol chiqadi, eski kirishlar yopiladi.
- Oxirgi administratorni bloklab yoki rolini tushirib bo'lmaydi.
- Bitta joydan 5 marta noto'g'ri parol → o'sha joydan 15 daqiqa kutish. Bitta loginga soatiga 30 xato → 15 daqiqa hamma uchun.
- Kirish 30 kun saqlanadi, sahifa ishlatilib tursa o'zi uzayadi.

## 3. Ma'lumot qanday yangilanadi

Sahifa ochilganda hammasi bir marta yuklanadi (hozir ~1,5 MB, siqilgan holda ancha kam), keyin faqat o'zgarganlari
olinadi: sahifa ochiq va ishlatilayotgan bo'lsa har 20 soniyada, 2 daqiqa harakatsizlikdan keyin har daqiqada,
15 daqiqadan keyin to'xtaydi (bosish yoki oynaga qaytish bilan darhol davom etadi). Yuqoridagi «Yangilandi 14:32» —
oxirgi yangilanish vaqti.

Bir vaqtda ikki kishi bitta oyga yozsa ham yozuvlar yo'qolmaydi: server faqat o'zgargan qatorni qo'shadi.
Har bir yozish amali **Foydalanuvchilar → Server jurnali** da (kim, qachon, nima) — u o'chirilmaydi.

## 4. Zaxira nusxa

**Foydalanuvchilar → Zaxira nusxani yuklab olish** — barcha jurnallar, sozlamalar va tarix bitta JSON faylga.
Haftada kamida bir marta yuklab, kompyuterda saqlang.

**Fayldan tiklash**: standart rejim — bazada yo'q hujjatlarni qo'shadi, borlariga tegmaydi. «Almashtirilsin»
rejimi mavjud hujjatlarni fayldagi holatga qaytaradi (fayldan keyingi yozuvlar yo'qoladi) — faqat tasdiq bilan ishlaydi.
Foydalanuvchilar va parollar zaxiraga kirmaydi.

## 5. Narx va cheklovlar

Hozirgi hajm uchun bepul tariflar yetadi:
- **Neon Free**: loyiha uchun oyiga 100 CU-soat hisoblash va 1 GB joy (2026-oktabr holatiga). Limit tugasa, baza
  keyingi oygacha to'xtaydi. Baza 5 daqiqa so'rovsiz tursa o'zi uxlaydi va keyingi so'rovda bir necha soniyada
  uyg'onadi. Hozirgi ma'lumot ~2 MB.
  Taxmin: sahifa kuniga ~10 soat ishlatilsa, oyiga ~70 CU-soat (eng kichik 0,25 CU hisobida) — limit ichida.
- **Vercel Hobby**: shaxsiy/notijorat foydalanish uchun. Kompaniya ishi uchun Vercel shartlariga ko'ra **Pro** tarif
  talab qilinadi — buni o'zingiz baholang.

Sahifa ishlatilmayotganda (tun, dam olish) so'rov yubormaydi, shuning uchun baza ham uxlaydi.

## 6. Kompyuterda ishga tushirish va sinovlar

```bash
npm install
npm run dev      # http://localhost:3000 — .env da DATABASE_URL bo'lmasa, kompyuterdagi bazada (.pglite/)
npm test         # server sinovlari (25 ta), kompyuterdagi Postgres bilan
```

## 7. Sahifani o'zgartirish

Hisob-kitob va ko'rinish kodi — `app/app.js` va `app/markup.html` (claude.ai dagi sahifa bilan bir xil).
O'zgartirgandan keyin `npm run pack` (serverga tayyor fayllarni yig'adi), `npm test`, so'ng deploy
(GitHub'ga push yoki `vercel --prod`).

## Papka tuzilishi

```
api/            server funksiyalari: auth (kirish), sync, doc, query, users, backup, setup, app
lib/            umumiy kod: baza, kirish, yozish qoidalari, sxema; app-bundle.js — yig'ilgan sahifa kodi
public/         ochiq fayllar: index.html (ko'rinish), shim.js (sahifani serverga ulaydi), login/users/setup sahifalari
app/            sahifa manbasi (app.js — hisob-kitob, markup.html — ko'rinish)
scripts/        dev.mjs (mahalliy server), pack.mjs (yig'ish)
test/           server sinovlari
data/           hozirgi ma'lumot nusxasi — faqat birinchi sozlash uchun, GitHub'ga yuklanmaydi
```

Sahifa kodi (`app/app.js`) ochiq fayl sifatida berilmaydi: unda standart normativlar va reja raqamlari bor,
shuning uchun faqat tizimga kirgan foydalanuvchiga `/api/app` orqali beriladi.
