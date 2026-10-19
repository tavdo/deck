# KARTULI DECK AI 🇬🇪
**ქართული ბანქო, შენი დიზაინით — AI-ითა და ქართული კულტურული მემკვიდრეობით შთაგონებული სათამაშო ბანქოს დიზაინის სტუდია.**

Kartuli Deck AI არის სრულფასოვანი (Full-Stack) ვებ-აპლიკაცია, რომელიც მომხმარებლებს საშუალებას აძლევს შექმნან, დაარედაქტირონ, შეინახონ და სტამბურად დაბეჭდონ როგორც ინდივიდუალური სათამაშო კარტები, ისე სრული 36/52-კარტიანი ან ინდივიდუალური ქართული დასტები.

---

## 1. არქიტექტურა და ტექნოლოგიური სტეკი

- **Frontend:** React 18, TypeScript, Vite, React Router v6, Lucide React
- **Styling & Visual Identity:** სპეციალურად შექმნილი ქართული ლუქს-დიზაინის სისტემა (`#151515` ნახშირისფერი, `#722F37` საფერავის ღვინისფერი, `#F4EBDD` თბილი სპილოსძვლისფერი, `#C6A15B` ძველი ოქრო, `#351A22` მუქი შინდისფერი, `#A69A89` ქვისფერი) და `Noto Sans Georgian` / `Noto Serif Georgian` ტიპოგრაფია.
- **Deterministic Card Rendering (`CardRenderer`):** ყველა კარტის ზომა, ჩარჩო, კუთხის რანგის ინდექსი, ქართული ქვე-ინდექსი, მასტის სიმბოლოები (მათ შორის ქართული სიმბოლოები: **ვაზი**, **ხანჯალი**, **ბორჯღალი**) და საბეჭდი საზღვრები (Bleed / Safe Margin) იხატება ზუსტი ვექტორული **SVG** კომპონენტებით.
- **Backend:** Node.js, Express, TypeScript, Zod ვალიდაცია, `express-rate-limit`
- **AI Image Generation:** Google Gemini API (`@google/genai` SDK) უახლესი მხარდაჭერილი სურათების გენერაციის მოდელებით:
  - `gemini-nano-banana-2.1` (ნაგულისხმევი რეკომენდებული მოდელი)
  - `gemini-3-pro-image` (Nano Banana Pro)
  - `gemini-3.1-flash-image` (Nano Banana 2)
  - `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite)
- **Database:** PostgreSQL (`pg`) სრული სქემითა და მიგრაციებით (`src/server/db/migrations/001_initial_schema.sql`). ლოკალური გაშვებისას, თუ გარე PostgreSQL სერვერი არ არის ჩართული, ავტომატურად აქტიურდება ჩაშენებული PostgreSQL-თავსებადი ძრავა (`pg-mem`) ლოკალური სნაპშოტის შენახვით (`.data/kartuli-deck-pg-snapshot.json`).
- **Storage:** S3-თავსებადი Object Storage (`@aws-sdk/client-s3` — AWS S3, Cloudflare R2, MinIO, Supabase Storage) ან ლოკალური ფაილური საცავი დეველოპმენტისთვის (`.data/storage`).
- **Export Engine:** ინდივიდუალური PNG (300/600 DPI რასტერიზაცია), ვექტორული SVG და მრავალგვერდიანი სტამბური PDF (`pdfkit`) კონფიგურირებადი Bleed-ით, უსაფრთხო ველითა და ჭრის ნიშნებით (Crop Marks).

---

## 2. ლოკალური გაშვება და კონფიგურაცია

### ნაბიჯი 1: დამოკიდებულებების ინსტალაცია
```bash
npm install
```

### ნაბიჯი 2: გარემოს ცვლადების (`.env`) კონფიგურაცია
დააკოპირეთ `.env.example` ფაილი `.env` სახელით:
```bash
cp .env.example .env
```
შეავსეთ თქვენი Google Gemini API გასაღები:
```env
GEMINI_API_KEY=თქვენი_რეალური_GEMINI_API_KEY
GEMINI_IMAGE_MODEL=gemini-nano-banana-2.1
```
> **შენიშვნა დემო რეჟიმის შესახებ:** თუ `GEMINI_API_KEY` არ არის მითითებული `.env` ფაილში, აპლიკაცია სრულად ფუნქციონირებს **სადემონსტრაციო რეჟიმში** — ქმნის ქართული ორნამენტული სისტემის SVG ილუსტრაციებს და მკაფიოდ აღნიშნავს მათ `დემო ნიმუში` სტატუსით, რათა არ მოხდეს რეალური AI გენერაციის იმიტაცია.

### ნაბიჯი 3: მონაცემთა ბაზის მიგრაცია (არასავალდებულო ლოკალურ რეჟიმში)
სერვერის ჩართვისას მიგრაცია ავტომატურად ეშვება, თუმცა შეგიძლიათ ხელითაც გაუშვათ:
```bash
npm run db:migrate
```

### ნაბიჯი 4: სერვერისა და კლიენტის ერთდროული გაშვება
```bash
npm run dev
```
- **Frontend (Vite):** `http://localhost:5173`
- **Backend API:** `http://localhost:3001/api`

---

## 3. ტესტირება და Build

ავტომატური ტესტების გაშვება (ამოწმებს 52 და 36-კარტიანი დასტების კომბინatorიკას, ჯოკერის განცალკევებას, Gemini API-ის პასუხის პარსინგს, SVG `CardRenderer`-ს, REST API-ს, რიგის მართვასა და PDF ექსპორტს):
```bash
npm test
```

Production Build-ის აწყობა და გაშვება:
```bash
npm run build
npm start
```

---

## 4. განთავსების ინსტრუქცია (Deployment — Render / Cloud)

აპლიკაცია მომზადებულია **Render**-ზე ან ნებისმიერ Linux კონტეინერულ პლატფორმაზე განსათავსებლად:

1. **Port Binding:** Backend სერვერი (`src/server/index.ts`) უსმენს `0.0.0.0:$PORT`-ს.
2. **Ephemeral Filesystem გათვალისწინება:** Render-ის ფაილური სისტემა ეფემერულია — Production გარემოში აუცილებლად მიუთითეთ:
   - `DATABASE_URL` — მართვადი PostgreSQL ბაზის მისამართი (Render PostgreSQL ან Supabase).
   - `STORAGE_DRIVER=s3` და `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` — გენერირებული სურათების მუდმივ Object Storage-ში შესანახად.
   - `REDIS_URL` — BullMQ/Redis-ის მისამართი (არასავალდებულო, სისტემას აქვს PostgreSQL-ზე დაფუძნებული მდგრადი Queue Worker-იც).
3. **Build & Start Commands (Render Web Service):**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

---

## 5. იმპლემენტირებული ფუნქციონალისა და სამომავლო გაფართოების სტატუსი

### სრულად იმპლემენტირებულია:
- ქართული ვიზუალური იდენტობა, `KARTULI DECK` ორიგინალური ლოგოტიპი და მრავალჯერადი გამოყენების ქართული ორნამენტული SVG კომპონენტები.
- 6 ძირითადი გვერდი ქართულ ენაზე: **მთავარი**, **გენერატორი** (ერთი კარტი + სრული დასტა), **კარტის რედაქტორი**, **ჩემი პროექტები**, **გალერეა**, **ექსპორტი**.
- დეტერმინისტული `CardRenderer` SVG სისტემა და ბანქოს ზურგის (`GeorgianCardBackArtwork`) სიმეტრიული გენერატორი.
- Google Gemini API ინტეგრაცია (`gemini-nano-banana-2.1` და Nano Banana სერიის მოდელები) სტილის ერთიანი სპეციფიკაციითა და უსაფრთხო Retry/Timeout პოლიტიკით.
- სრული დასტის გენერირების რიგი (Queue) პროგრესის მაჩვენებლით, ღირებულების წინასწარი დადასტურებით, დაპაუზებით, გაუქმებითა და ხარვეზების გამეორებით.
- PNG, SVG და მრავალგვერდიანი სტამბური PDF ექსპორტი (Bleed, Safe Margin, Crop Marks).

### სამომავლო გაფართოება (Milestone 2):
- ამ ეტაპზე ჩართულია ლოკალური სტუდიის სესიის სამუშაო პროცესი (`demo-user`) რეალური ანგარიშის იმიტაციის გარეშე; სამომავლოდ შესაძლებელია OAuth / Supabase Auth მრავალმომხმარებლიანი ავტორიზაციის მიერთება `users` ცხრილზე.
