# Nihad Abbasov Creative Studio — GitHub + Supabase quraşdırılması

Bu paket V6 dizaynını, loqonu, qaimə çapını və AURELIA AI interfeysini saxlayır, sifariş/qaimə/müştəri məlumatları üçün Supabase bağlantısı əlavə edir. **Sayt avtomatik olaraq sizin hesablarınıza bağlanmayıb.** Aşağıdakı quraşdırma addımlarını tamamlamadan canlı sifariş qəbul edilməyəcək.

## Fayllar

- `index.html` — saytın əsas interfeysi (V6 əsasında).
- `config.js` — sizin Supabase Project URL və **publishable / anon** açarınız.
- `production-bridge.js` — Supabase Auth, sifariş, izləmə, qalereya upload, admin sinxronlaşdırması.
- `supabase/schema.sql` — PostgreSQL cədvəlləri, RLS, təhlükəsiz RPC və Storage siyasətləri.
- `.nojekyll` — GitHub Pages üçün.

## 1. Supabase layihəsi

1. https://supabase.com/dashboard → **New project** → yeni layihə yaradın; regionu auditoriyaya yaxın seçin.
2. **SQL Editor → New query** açın, `supabase/schema.sql` faylının **tam mətnini** yapışdırın və **Run** edin.
3. **Authentication → Users → Add user** vasitəsilə şəxsi admin e-poçtunuz və güclü şifrə ilə hesab yaradın. Əgər təsdiqləmə istəyirsə, e-poçtu təsdiqləyin.
4. Həmin istifadəçinin **UUID** dəyərini kopyalayın.
5. SQL Editor-də, UUID-ni öz dəyərinizlə əvəz edib bu əmri icra edin:

```sql
insert into public.studio_admins(user_id)
values ('BURAYA_ADMIN_AUTH_UUID');
```

**Vacib:** Bu əmri yalnız Supabase-in etibarlı SQL Editor bölməsində edin. `studio_admins` cədvəlinə başqa şəxsləri əlavə etməyin.

## 2. Supabase URL və açar

Supabase → **Project Settings → API Keys** (bəzi panellərdə **Connect / API**) bölməsindən:

- **Project URL**: `https://xxxx.supabase.co`
- **Publishable key**, yoxdursa legacy **anon key**.

`config.js` faylını dəyişin:

```js
window.NA_SUPABASE_CONFIG = {
  url: 'https://SIZIN-LAYIHE.supabase.co',
  publishableKey: 'SIZIN_PUBLISHABLE_VE_YA_ANON_ACAR'
};
```

**QƏTİ QADAĞAN:** `service_role`, `sb_secret_...`, Postgres şifrəsi, AI gizli açarı və ya GitHub tokenini HTML/JavaScript fayllarına yazmayın. Publishable/anon açar brauzer üçün nəzərdə tutulub; məlumat qorunmasını RLS təmin edir.

## 3. GitHub-a yerləşdirmək

1. https://github.com/new → yeni repository yaradın (məsələn, `nihad-studio`). GitHub Pages Free hesabında repo adətən public olmalıdır; kodunuzun ictimai görünməsini nəzərə alın.
2. Faylları **strukturunu saxlayaraq** repository kökünə yükləyin: `index.html`, `config.js`, `production-bridge.js`, `.nojekyll`, `supabase/` (istəyə görə README).
3. **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
4. GitHub Pages linki `https://GITHUB-ISTIFADECI.github.io/nihad-studio/` formatında ola bilər. Tam URL-ni Pages səhifəsindən götürün.
5. Öz domeniniz varsa Pages → Custom domain və domen DNS ayarlarını rəsmi GitHub təlimatına uyğun edin. HTTPS aktiv olsun.

Git CLI ilə alternativ:

```bash
git init
git add .
git commit -m "Deploy Nihad Abbasov Creative Studio"
git branch -M main
git remote add origin https://github.com/SIZIN_USERNAME/nihad-studio.git
git push -u origin main
```

## 4. İlk admin giriş və aktivləşdirmə

1. GitHub Pages ünvanını açın. `Baş Admin` düyməsini seçin.
2. Supabase Auth-da yaratdığınız **e-poçt və şifrə** ilə daxil olun — `NA-Demo-2026` artıq qəbul edilmir.
3. İlk giriş zamanı saytda V6 başlanğıc xidmət kataloqu Supabase-ə yüklənir. Sonra Baş Admin → xidmətləri və qiymətləri real məlumatlarla dəyişin.
4. Əvvəlki V6-dakı məlumatları itirmək istəmirsinizsə, **əvvəlki HTML işləyən brauzerdə** açın və JSON backup alın. Sonra yeni saytın Baş Admin → Backup bölməsində `Köhnə lokal məlumatları import et` düyməsini istifadə edin. Bu, yalnız eyni brauzerdə V6 məlumatı qalıbsa işləyir. Import server məlumatlarını əvəz edə bilər.
5. Baş Admin → Xidmətlər, Portfolio, Sertifikatlar bölmələrindən material əlavə edin. Şəkillər Supabase Storage `studio-media` bucket-ına yüklənəcək.

## 5. Real yoxlama siyahısı

- [ ] İnkognito pəncərədə və ya ikinci telefonda saytın xidmətləri görünür.
- [ ] Müştəri sifarişi verəndə `NA-...` kodu alır.
- [ ] Supabase → Table Editor → `studio_orders` cədvəlində sifariş yaranır.
- [ ] Eyni kod ikinci cihazda `Sifarişi izlə` ilə status göstərir, şəxsi telefon/ünvan çıxmır.
- [ ] Baş Admin sifariş statusunu dəyişir; müştəri yenidən yoxlayanda yeni status görünür.
- [ ] Baş Admin yeni şəkil yükləyir; ikinci cihazda görünür.
- [ ] Yeni qaimə yaradılır və `studio_invoices`-da görünür.
- [ ] Qaimənin PDF/çap önbaxışında **yalnız 1 qaimə**, loqo və qızılı rənglər görünür; müştərinin imzası yoxdur.
- [ ] Baş Admin çıxış etdikdən sonra admin məlumatları açılmır.
- [ ] Müştəri birbaşa `studio_orders` cədvəlindən digər şəxslərin telefonlarını oxuya bilmir (RLS).

## Mövcud versiyanın praktik məhdudiyyətləri

1. **Bu kod təqdim edilən inteqrasiya paketidir, işlək Supabase hesabı üzərində test edilməyib.** Canlı sistemin tamamlandığını yalnız yuxarıdakı testlərdən sonra demək olar.
2. Köhnə HTML üçün əlavə edilmiş bridge, Baş Admin dəyişikliklərini serverə qısa gecikmə ilə toplu yazır. Çox adminli və yüksək trafikli işdə daha düzgün həll ayrıca API və sıra-sıra CRUD əməliyyatlarına keçməkdir.
3. İctimai sifariş və sorğu endpoint-ləri üçün CAPTCHA, rate limiting, spam müdafiəsi və ehtiyat nüsxə siyasəti canlı yayımdan əvvəl əlavə edilməlidir.
4. `studio_track` yalnız kodu bilənə xidmət adı/status göstərir. Kodun müştəriyə verilməsi zamanı məxfilik nəzərə alınmalıdır.
5. AURELIA AI-nin internetdə real axtarış etməsi **əlavə AI server / Edge Function** və ayrıca məxfi API açarı tələb edir; bu paket internet axtarışı açmır.
6. Gəlir hesabatları tətbiqdəki qeydiyyata əsaslanır; bank ödənişini avtomatik doğrulamır. PDF qaimə rəsmi fiskal çekin əvəzi deyil.
7. GitHub Pages statik hostinqdir. Supabase server rolunu oynayır; öz serveriniz olmadan da baza işləyə bilər, lakin ağır iş axınları üçün backend genişləndirilməsi lazım ola bilər.

## Etibarlı mənbələr

- Supabase JavaScript: https://supabase.com/docs/reference/javascript/installing
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
