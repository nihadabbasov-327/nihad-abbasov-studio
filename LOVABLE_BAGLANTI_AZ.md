# Lovable ilə işləmə qaydası

## Vacib məhdudiyyət
Bu paket **statik HTML/JS** saytıdır. Lovable layihələri isə adətən React/Vite strukturu yaradır. Hazır ZIP-i Lovable-a vermək və ya GitHub-da onun React layihəsinin üzərinə `index.html` yazmaq avtomatik köçürmə deyil, işləməyən build yarada bilər. Lovable hazır mövcud GitHub reposunu birbaşa öz layihəsi kimi import etməyə imkan verməyə bilər.

## Ən qısa və təhlükəsiz yol (HTML versiyasını dərhal yayımlamaq)
1. Supabase layihəsi yaradın; `supabase/schema.sql` faylını SQL Editor-də icra edin.
2. Supabase Auth-da admin hesabı yaradın və `studio_admins`-a onun UUID-ni daxil edin.
3. `config.js` daxilində Project URL və publishable/anon key qeyd edin. `service_role` və secret key daxil etməyin.
4. Bu qovluğun **içindəki faylları** GitHub repository-nin kökünə yerləşdirin. ZIP-i bir fayl kimi yükləmək olmaz; faylları çıxardıb yükləyin.
5. Repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.
6. GitHub Pages linkini telefonda və gizli pəncərədə açın; sifariş, izləmə, admin, qaimə, PDF, media upload sınağını keçirin.

## Lovable-a qoşmaq istəsəniz
1. Lovable-da **ayrı layihə** yaradın və Github integrasiyasını Lovable içindən aktiv edin. Lovable öz repo-sunu yaradır.
2. Supabase inteqrasiyasını Lovable-da qoşun: artıq mövcud olan **eyni Supabase layihəsini** seçə bildiyiniz halda seçin. Mövcud məlumatları qorumaq üçün ikinci production bazası yaratmayın.
3. Lovable-a aşağıdakı tapşırığı verin və bu paketin fayllarını istinad kimi təqdim edin. Lovable statik HTML-i React/Vite komponentlərinə **uyğunlaşdırmalıdır**, köhnə script-ləri sadəcə üst-üstə yığmamalıdır.
4. Yeni Lovable versiyasını canlı domenə keçirməzdən əvvəl yeni backend ilə bütün axınları yenidən test edin. Eyni domeni eyni anda həm GitHub Pages, həm Lovable publish ilə yönəltməyin.

### Lovable üçün tapşırıq mətni
Nihad Abbasov Creative Studio üçün bu statik HTML layihəsinin görünüşünü və funksiyalarını React/Vite komponentlərinə migrasiya et. Premium ağ, zümrüd yaşıl, göy-qızılı loqo və 3D fon saxlanılsın. SMM, dizayn, poliqrafiya və onlayn çap xidmətləri kataloqu, portfolio, sertifikatlar, müştəri sifarişi, avtomatik unikal ID, şəxsi məlumatları göstərməyən status izləmə, QR qaimə, tək A4 PDF print, məhsul/qiymət redaktəsi və tam ekran Baş Admin qalsın. Mövcud Supabase schema cədvəllərini, RPC və RLS siyasətlərini əsas götür; admin üçün Supabase Auth istifadə et; service_role açarı frontend-də olmasın. Yalnız müvəffəqiyyətlə serverə yazılan əməliyyatlara uğurlu cavab göstər. `localStorage`-u əsas məlumat bazası kimi istifadə etmə. Supabase Storage fayl upload-u və spam müdafiəsini təmin et. AURELIA AI üçün təhlükəsiz Supabase Edge Function tələbini yaz, AI axtarışını açar olmadan işləyirmiş kimi göstərmə. Mobil görünüş, çap və giriş testlərini də yoxla.

## Canlıya çıxmazdan əvvəl
Bu inteqrasiya paketi sizin real Supabase layihənizdə sınaqdan keçməyib. Müxtəlif cihazlarda test, spam/rate limit, backup və tətbiq təhlükəsizliyi yoxlamaları tələb olunur.
