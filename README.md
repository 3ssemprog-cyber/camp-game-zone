# خطوات ترحيل Camp Game Zone → Supabase + Netlify
============================================================

## المرحلة 1 — إعداد Supabase (10 دقايق)

### 1.1 عمل مشروع
1. روح https://supabase.com وعمل حساب
2. "New Project" → اختار اسم "camp-game-zone"
3. اختار كلمة سر قوية للـ database — احفظها
4. Region → اختار "Central EU (Frankfurt)" أو "US East" — الأقرب للاستخدام

### 1.2 إنشاء قاعدة البيانات
1. من القائمة الجانبية → "SQL Editor"
2. "New Query"
3. افتح ملف `schema.sql` وانسخ كل محتواه
4. الصقه في الـ SQL Editor واضغط "Run"
5. المفروض يظهر "Success" — لو في error راسلني

### 1.3 جيب الـ API Keys
1. Project Settings (⚙️) → API
2. انسخ:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: سلسلة طويلة

### 1.4 فعّل الـ Realtime
1. Database → Replication
2. فعّل على الجدولين دول:
   - `menu_orders`
   - `tables`

---

## المرحلة 2 — تعديل الكود (2 دقايق)

### 2.1 افتح ملف firebase.js الجديد وغيّر السطرين دول:
```
const SUPABASE_URL  = 'https://XXXXXXXXXX.supabase.co';  ← حط الـ URL بتاعك
const SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';             ← حط الـ anon key
```

### 2.2 ADMIN_UID
بعد ما تعمل الأدمن في Supabase Authentication:
1. Authentication → Users → "Invite user" أو "Add user"
2. ادخل إيميل وكلمة سر الأدمن
3. هيظهر UUID — انسخه
4. في firebase.js غيّر:
```
const ADMIN_UID = 'الـ UUID الجديد من Supabase';
```

### 2.3 إضافة الموظفين
- Authentication → Users → "Add user" لكل موظف
- من SQL Editor:
```sql
insert into users (uid, name, role, permissions)
values ('UUID من Authentication', 'اسم الموظف', 'كاشير', '{"pos.view": true}');
```

---

## المرحلة 3 — ترحيل البيانات القديمة (اختياري)

لو عندك بيانات في Firebase محتاج تنقلها:

### طريقة سهلة — من Firebase Console:
1. Firestore → اختار كل collection → Export (JSON)
2. عدّل الـ JSON ليناسب schema الجديد
3. Supabase → Table Editor → Import CSV

### أو راسلني وهعملك سكريبت ترحيل تلقائي

---

## المرحلة 4 — رفع على Netlify (5 دقايق)

### 4.1 من الـ Drag & Drop (الأسهل):
1. روح https://netlify.com وعمل حساب مجاني
2. اسحب فولدر المشروع كله على الصفحة الرئيسية
3. هياخد دقيقة وهيديك لينك زي: `https://campgamezone.netlify.app`

### 4.2 لو عندك GitHub (الأفضل):
1. ارفع الملفات على GitHub repo
2. Netlify → "New site from Git" → اختار الـ repo
3. هيتحدث تلقائي كل ما ترفع تعديل

---

## ملاحظات مهمة

### تغييرات في أسماء الحقول (مهم جداً!)

الكود القديم كان بيستخدم أسماء زي `order` و `openAt`
الـ schema الجديد غيّرهم عشان `order` كلمة محجوزة في SQL:

| Firebase القديم | Supabase الجديد |
|-----------------|-----------------|
| `order`         | `order_data`    |
| `openAt`        | `open_at`       |
| `cashAmt`       | `cash_amt`      |
| `elecAmt`       | `elec_amt`      |
| `dayKey`        | `day_key`       |
| `monthKey`      | `month_key`     |
| `shiftKey`      | `shift_key`     |
| `user` (في log) | `user_name`     |
| `alertQty`      | `alert_qty`     |

### لو المشروع وقع في النص:
- Supabase مش ليه حدود يومية زي Firebase
- لو الـ Supabase project فضل مش بيتفتح أكتر من 1 أسبوع → Free tier بيوقف inactive projects
- الحل: روح supabase.com وافتح المشروع يرجع تاني، أو اشترك في Pro ($25/شهر) لو المشروع production

---

## الملفات اللي اتغيرت

| الملف | التغيير |
|-------|---------|
| `firebase.js` | **استُبدل كامل** بـ Supabase client |
| `pos.html` | `setInterval` → `onSnapshot` |
| `orders.html` | `setInterval` → `onSnapshot` |
| `schema.sql` | **جديد** — تنفيذه مرة واحدة في Supabase |

---

للمساعدة: عاصم المندراوي — 01157436309
