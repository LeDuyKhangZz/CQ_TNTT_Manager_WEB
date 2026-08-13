# 12 — Deployment Runbook

## 1. Target

- Frontend/backend: Vercel Hobby.
- Database/Auth/Storage: Supabase.
- Domain: chưa có; dùng Vercel domain trước.
- Ownership hiện tại: tài khoản cá nhân user.
- Trước production ổn định nên thêm một người quản trị dự phòng.

## 2. Environments

### Local

- Supabase CLI local.
- `.env.local`.
- `seed.dev.sql`.

### Preview

- Vercel Preview.
- Nên dùng Supabase project/staging riêng nếu có thể.
- Không trỏ preview vào production DB với migration thử nghiệm.

### Production

- Supabase production.
- Vercel production.
- Không seed demo.

## 3. Pre-deploy checklist

- `git status` rõ.
- Secret scan.
- `npm ci`.
- lint.
- typecheck.
- unit.
- DB reset/test.
- E2E.
- build.
- Migration review.
- Backup production trước migration phá schema.
- Generate DB types.
- Logo/icon.
- 2 SA accounts.
- No demo credentials.

## 4. Supabase setup

1. Create project.
2. Save:
   - project URL;
   - anon key;
   - service role;
   - DB password/connection.
3. Configure Auth site URL/redirect URL.
4. Disable public sign-up nếu không dùng.
5. Apply migrations bằng CLI.
6. Seed reference only.

### 4a. Lấy chính xác từng khóa ở đâu

Ứng dụng chỉ cần **ba** biến. Không cần khóa nào khác.

| Biến | Lấy ở đâu trong dashboard Supabase | Tính chất |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → Data API → **Project URL** (`https://<ref>.supabase.co`) | công khai, có trong bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → **anon / public** | công khai, RLS chặn phần còn lại |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → **service_role** (bấm *Reveal*) | **BÍ MẬT** |

⚠️ `service_role` bỏ qua toàn bộ RLS. Không đặt tiền tố `NEXT_PUBLIC_`, không dán
vào chat/issue, không commit. Lỡ lộ thì vào chính trang đó bấm *Reset* — khóa cũ
chết ngay.

Ngoài ra cần **database password** (hiện lúc tạo project; quên thì
Project Settings → Database → *Reset database password*). Password này chỉ dùng
cho `supabase link`/`db push`/`db dump`, **không** đặt vào Vercel.

Các bước làm một lần, theo thứ tự:

```bash
# 1. Đăng nhập CLI và nối repo với project thật
npx supabase login
npx supabase link --project-ref <ref>      # <ref> là phần trước .supabase.co

# 2. Đẩy toàn bộ migration lên (chưa có dữ liệu nào)
npx supabase db push

# 2b. ⚠️ BẮT BUỘC — `db push` KHÔNG chạy supabase/seed.sql.
#     Local không lộ ra vì `db reset` có chạy seed. Bỏ bước này thì
#     sectors/grade_levels/class_templates/committees đều rỗng, và
#     `generate_default_classes` sẽ tạo 0 lớp mà KHÔNG báo lỗi.
#     Cách làm: Dashboard -> SQL Editor -> New query -> dán toàn bộ
#     supabase/seed.sql -> Run. File idempotent (on conflict do nothing),
#     chạy lại nhiều lần vô hại.

# 3. KHÔNG cần tạo bucket bằng tay: migration 20260722000300 đã insert bucket
#    "teaching-materials" (private, 5 MB, allowlist MIME) cùng policy của nó.
#    Chỉ vào Storage kiểm lại: bucket có mặt và cột Public là "false".

# 4. Auth → URL Configuration:
#    Site URL = https://<domain-vercel>
#    Redirect URLs = https://<domain-vercel>/**
#    Providers → Email: tắt "Enable email signups" (D: không có public sign-up)

# 5. Khởi tạo 2 Super Admin + năm học + 19 lớp — xem §4b
```
7. Create buckets/private policies.
8. Create initial SA via secure admin script — xem §4b.
9. Test RLS bằng actual JWT.

## 4b. Khởi tạo dữ liệu production (P7-T5)

Chỉ dùng `scripts/seed-production.mjs`. **Không bao giờ chạy `seed:dev` trên
project thật** — nó đặt mật khẩu dùng chung `123456` và dựng dữ liệu giả.

```bash
# .env.production.deploy chứa URL + anon key + service role của project thật.
# File này KHÔNG được commit (đã nằm trong .gitignore theo mẫu `.env.*`).
npm run seed:prod -- --confirm=<hostname-project> --year=2026-2027
```

🔴 **Tên file là `.env.production.deploy`, KHÔNG phải `.env.production.local`.**
Next chỉ tự nạp đúng bốn tên — `.env`, `.env.local`, `.env.<NODE_ENV>`,
`.env.<NODE_ENV>.local` — và ở `NODE_ENV=production` nó nạp
`.env.production.local` **trước** `.env.local`. Chỉ cần một file tên đó nằm
trong thư mục gốc là mọi lượt `npm run build && npm run start` chạy tay ở máy
lập trình đều nối thẳng vào **dự án thật**; E2E local đã dính đúng bẫy này một
lần (xem `16_PHASE_2B_IMPLEMENTATION_LOG.md` mục 0.8). `seed:prod` gọi file qua
`node --env-file=` nên không cần đúng tên Next. **Đừng đổi lại tên cũ.**

Script tạo đúng ba thứ và không hơn:

- hai tài khoản Super Admin (D-16), mỗi tài khoản một mật khẩu tạm 8 ký tự ngẫu
  nhiên và `must_change_password = true` (D-27);
- một năm học `status='current'`;
- 19 lớp mặc định qua `generate_default_classes` (D-9).

Hai lớp bảo vệ: phải gõ đúng hostname của project mới chạy, và script từ chối
nếu `profiles` đã có dòng nào.

⚠️ **Phải chạy §4a bước 2b (seed.sql) TRƯỚC.** `seed-production.mjs` gọi
`generate_default_classes`, hàm này đọc `class_templates`. Bảng rỗng thì hàm trả
về thành công với 0 lớp và script in "Đã tạo năm học ... và 0 lớp" — rất dễ đọc
lướt qua. Nếu lỡ chạy sai thứ tự: chạy seed.sql rồi vào `/admin` bấm
"Sinh lớp mặc định", không cần seed lại tài khoản.

Mật khẩu tạm chỉ in ra màn hình **một lần**. Giao tận tay từng người, không gửi
qua tin nhắn nhóm, không lưu vào file. Sau đó mọi tài khoản khác được tạo trong
`/admin` hoặc nhập bằng `/imports`.

## 5. Vercel setup

1. Import Git repo.
2. Framework Next.js.
3. Add env vars.
4. Build command default.
5. Ensure Node version.
6. Deploy preview.
7. Smoke.
8. Promote production.

Không đưa database password vào `NEXT_PUBLIC_*`.

### 5a. Đặt env trên Vercel

Project → Settings → **Environment Variables**. Thêm đúng ba biến ở §4a, chọn cả
ba môi trường (Production / Preview / Development):

| Name | Value | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | đánh dấu **Sensitive** |

`INTERNAL_AUTH_DOMAIN` không bắt buộc; bỏ trống thì dùng mặc định
`choquan.internal`. **Đổi biến này sau khi đã có tài khoản là hỏng đăng nhập** —
alias email của mọi tài khoản dựng từ nó. Chốt một lần trước khi seed.

Node: Settings → General → Node.js Version ≥ **20** (`package.json` yêu cầu).
Build/Install command để mặc định — repo không có bước dựng riêng.

### 5b. Hai giới hạn của nền tảng mà mã nguồn đang dựa vào (M12-C, 2026-08-03)

| Giới hạn | Giá trị đang dùng | Đặt ở đâu |
|---|---|---|
| Thân request | ~**4,5 MB** (trần nền tảng) | `next.config.mjs` → `serverActions.bodySizeLimit: "4.5mb"`; trần nghiệp vụ **4 MB** ở `src/features/imports/limits.ts` (**D-137**) |
| Thời gian chạy hàm | **60 giây** (trần gói Hobby) | `export const maxDuration = 60` ở `/imports`, `/imports/[batchId]` và `/imports/[batchId]/errors` |

🔴 **Trần nghiệp vụ phải luôn nằm DƯỚI trần nền tảng.** Nếu không, file nằm giữa hai
con số sẽ bị chặn ở tầng hạ tầng bằng một **trang lỗi tiếng Anh**, trước khi câu tiếng
Việt của ứng dụng kịp chạy — đúng lỗi M12-C vừa sửa (trần cũ 5 MB / `bodySizeLimit: "6mb"`,
cả hai đều **trên** 4,5 MB).

⚠️ **Đổi gói Vercel thì phải xem lại cả hai dòng trên.** Đặt `maxDuration` cao hơn mức gói
cho phép là **hỏng ở bước triển khai**, không phải ở chạy thử local.

Sau khi có domain Vercel, quay lại Supabase → Auth → URL Configuration điền đúng
domain đó, nếu không thì phiên đăng nhập không giữ được.

Thứ tự bắt buộc: **đặt env → deploy → seed production → smoke.** Deploy trước khi
có env thì build vẫn qua (middleware tự bỏ qua khi thiếu biến) nhưng đăng nhập
sẽ hỏng, rất dễ tưởng nhầm là lỗi code.

## 6. Migration policy

- Migration only forward.
- Không sửa migration đã apply production.
- Mỗi schema change có migration mới.
- Data backfill idempotent.
- Destructive migration cần:
  - backup;
  - impact note;
  - staged rollout;
  - explicit user approval.

## 7. Production smoke

### Auth

- Student.
- Guardian.
- Class teacher.
- Sector leader.
- View-only priest.
- SA.
- Must-change-password.
- Reset password.

### RLS

- Student A/B same class.
- Guardian A/B.
- Class A/B.
- Sector A/B.
- Committee A/B.

### Workflows

- Attendance.
- Teaching plan.
- Score.
- Top 5.
- Promotion dry sample.
- Export.
- Notification.

### PWA

- Manifest valid.
- Install prompt/support.
- No sensitive API cache.

## 8. Backup/recovery

- Supabase backup capability theo plan hiện có phải được kiểm tra tại thời điểm deploy.
- Trước migration lớn: logical dump.
- Định kỳ export:
  - schema;
  - critical data;
  - storage manifest.
- Test restore ở môi trường riêng.
- Ghi nơi giữ backup và người có quyền vào WORKLOG/ops private doc, không commit credential.

### Ai chịu trách nhiệm backup (P7-T5, cập nhật sau khi kiểm thật 2026-07-22)

🔴 **Đã kiểm trên project thật: Supabase Free plan KHÔNG có backup — không phải
ít ngày hơn, mà là không có gì cả.** Màn hình Database → Backups ghi rõ
"Free Plan does not include project backups". Point-in-time recovery cũng không.

Nghĩa là ở trạng thái hiện tại, **dump thủ công là lớp bảo vệ DUY NHẤT**. Không
có lưới đỡ nào khác. Một `delete` nhầm, một migration hỏng, hay project bị xóa là
mất toàn bộ hồ sơ gần 900 thiếu nhi, không dựng lại được từ đâu.

Hai lựa chọn, phải chọn một **trước khi nhập dữ liệu thật**:

| | Nâng lên Pro | Ở lại Free |
|---|---|---|
| Backup tự động | 7 ngày, Supabase lo | không có |
| Việc phải làm tay | vẫn nên dump trước migration lớn | dump định kỳ, **kỷ luật, không được quên** |
| Rủi ro nếu quên | mất tối đa 1 ngày | mất từ lần dump gần nhất |

Khuyến nghị: nhập 900 hồ sơ thật vào một database không có backup là rủi ro
không tương xứng với số tiền Pro. Nếu vẫn ở Free thì bảng dưới **không phải gợi
ý mà là bắt buộc**.

> **Quyết định của user 2026-07-22:** ở lại Free và **chưa nhập dữ liệu thật**.
> Production dùng để chạy thử tính năng với dữ liệu mẫu. Ghi thành **BLK-8**
> trong WORKLOG. Trước khi import sổ lớp thật phải quay lại chọn một trong hai
> cột trên — không được lặng lẽ bỏ qua bước này.

| Việc | Người giữ | Nhịp |
|---|---|---|
| Dump đầy đủ (schema + data) | Super Admin #1 (Khang Nhỏ) | **mỗi tuần**, và sau mỗi đợt nhập liệu lớn |
| Giữ bản dump ở nơi khác Supabase (Drive/ổ cứng riêng) | Super Admin #2 (Mr. Đạt) | mỗi tháng giữ lại 1 bản |
| Dump trước khi chạy `db push` có migration | Người chạy migration | mỗi lần, không ngoại lệ |
| Thử restore vào project nháp | Hai Super Admin cùng làm | mỗi học kỳ |

⚠️ Bảng này chờ user xác nhận. Bản dump chứa hồ sơ trẻ em — cất như tài liệu mật,
**không** đưa vào repo, không để trong thư mục đồng bộ công khai.

Lệnh dump (chạy trong `CQ_TNTT_Manager_Project_Spec`, đã `supabase link`):

```bash
npx supabase db dump --linked -f cq-tntt-schema-$(date +%Y%m%d).sql
npx supabase db dump --linked --data-only -f cq-tntt-data-$(date +%Y%m%d).sql
```

Cần **cả hai file** mới restore được. Chỉ có data mà không có schema thì vô dụng.
Cả hai đều khớp mẫu `*.sql` ngoài `supabase/migrations/` nên đừng để lẫn vào thư
mục migration — `db push` sẽ tưởng là migration mới.

## 9. Rollback

- App: redeploy previous Vercel deployment.
- DB: prefer forward fix.
- Restore only khi mất/corrupt data và đã đánh giá downtime.
- Không rollback app về version không tương thích schema mới.

## 10. Monitoring

- Vercel logs.
- Supabase logs.
- Error tracking tùy chọn.
- Alert thủ công cho auth spike/DB errors.
- Không log PII.

## 11. Definition deployed

Chỉ ghi `deployed` khi:

- Production URL mở.
- Login thật.
- DB migration đúng.
- RLS smoke pass.
- Core workflow pass.
- Env đúng.
- Không blocker credentials.

Nếu chỉ build/preview thì ghi đúng trạng thái.
