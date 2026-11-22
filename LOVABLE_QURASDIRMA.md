# NIHAD ABBASOV CREATIVE STUDIO — TƏHVİL VƏ AKTİVLƏŞDİRMƏ

**Tələb olunan əsas URL:** https://nihadabbasovcreativestudio.lovable.app/

## Vacib: bu ZIP avtomatik canlı sayt yaratmır

Bu arxiv hazır HTML saytının fayllarını, alternativ Supabase sxemini və konfiqurasiyasını ehtiva edir. Bunlar **hazırkı Lovable React layihəsinin avtomatik işlək əvəzi deyil**. Mövcud Lovable layihəsində artıq başqa verilənlər bazası və autentifikasiya qurulub; `supabase/schema.sql` faylını həmin bazada kor-koranə icra etməyin. Qeyd olunan URL-də yeni kodun görünməsi üçün məhz **həmin Lovable layihəsinin** kodu dəyişdirilib **Publish/Update** edilməlidir.

## 1 — Mövcud Lovable layihəsini qoruyun

Lovable Workspace > `Nihad Abbasov Creative Studio` layihəsini açın. Layihənin `Settings → GitHub` inteqrasiyasının statusunu yoxlayın. GitHub-a bağlanıbsa, Lovable-ın yaratdığı **repository URL**-ni müəyyən edin. Əvvəl yaratdığınız `nihadabbasov-327/nihad-abbasov-studio` GitHub Pages repository-si eyni repo olmaya bilər. Qəti əmin olmadan ikisini üst-üstə yazmayın.

## 2 — Kredit xərcləmədən kod dəyişmək

Lovable layihəniz GitHub-a sinxronlaşdırılıbsa, dəyişiklikləri *onun sinxron repository-sinə* commit etməklə kodu redaktə edə bilərsiniz. Amma Lovable React/TypeScript layihəsinin `src/` qovluğunun üzərinə `index.html` faylını kor-koranə atmayın: bu, build-i poza bilər. İki ayrı yol var:

A) Lovable React layihəsini tamamlayın: mövcud layihənin `package.json`, `src/routes/api/aurelia.ts`, `src/` ağacı, databaza sxemi və `.env.example` əsasında uyğun dəyişikliklər hazırlanmalıdır. **Bu fayllar olmadan etibarlı inteqrasiya vermək olmaz.**

B) Əvvəlki HTML-i GitHub Pages-də saxlayın. Bu yol saytı `lovable.app` domeninə avtomatik köçürmür.

## 3 — Supabase

Mövcud Lovable layihəsinin öz Cloud/Supabase bağlantısı ola bilər. Onun `Project URL`, DB sxemi və Auth konfiqurasiyasını yoxlayın. Eyni project ID təsdiqlənməyincə ayrıca hazırlanmış SQL sxemini tətbiq etməyin. Brauzerdə yalnız Supabase URL və publishable/anon key istifadə olunur. `service_role`, `sb_secret_...`, şəxsi API tokenləri GitHub-a və HTML-ə yazılmamalıdır.

## 4 — Baş Admin

Lovable hesabatında admin e-poçtu `abbasovnihad797@gmail.com` kimi seçilib. Bunun aktiv olduğunu yalnız Auth-da həmin hesabla giriş və serverdə admin rolunun yoxlanması təsdiq edə bilər. İlk dəfə qeydiyyatdan keçən təsadüfi istifadəçiyə admin səlahiyyəti verilməməlidir.

## 5 — Canlı yoxlama / Publish

- Layihədə TypeScript build xətaları sıfırlanıb (`src/routes/api/aurelia.ts` daxil olmaqla).
- Ana səhifə, xidmətlər, portfolio, onlayn çap, sifariş, izləmə və Baş Admin açılır.
- Müştəri sifariş göndərir → Supabase-də yazı yaranır → yalnız admin məxfi məlumatları görür.
- QR kod müştərinin telefonunda açılır; ünvan və telefon ictimai görünmür.
- Qaimə: avtomatik və təkrarsız nömrə, loqo, qızılı dizayn, yalnız BİR A4 PDF səhifəsi, müştəri imzası yoxdur.
- AURELIA AI üçün backend endpoint həqiqi işləyir; internet axtarışı ayrıca provayder qoşulmadan vəd edilmir.
- Lovable **Publish / Update** əməliyyatı edilir; sonra https://nihadabbasovcreativestudio.lovable.app/ inkognito rejimində yoxlanılır.

## Bu arxivdə nə var?

- `index.html`, `config.js`, `production-bridge.js` — mövcud HTML versiyası üçün fayllar. Lovable React layihəsinə hazır qoşulma sayılmır.
- `supabase/schema.sql` — yalnız **ayrıca HTML layihəsi üçün** alternativ Supabase sxemi; Lovable-ın mövcud bazasına avtomatik uyğun deyil.

**Ən sürətli düzgün növbəti addım:** Lovable layihəsinin GitHub-da sinxron repository linkini (əgər qoşulubsa) və ya həmin layihənin source ZIP-ni təqdim etmək. Onda məhz Lovable-da istifadə olunan React/TS kodunun üzərində real düzəliş paketi hazırlamaq mümkün olar.
