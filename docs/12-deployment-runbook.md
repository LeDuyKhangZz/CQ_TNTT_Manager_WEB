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
# .env.production.local chứa URL + anon key + service role của project thật.
# File này KHÔNG được commit (đã nằm trong .gitignore theo mẫu `.env.*`).
npm run seed:prod -- --confirm=<hostname-project> --year=2026-2027
```

Script tạo đúng ba thứ và không hơn:

- hai tài khoản Super Admin (D-16), mỗi tài khoản một mật khẩu tạm 8 ký tự ngẫu
  nhiên và `must_change_password = true` (D-27);
- một năm học `status='current'`;
- 19 lớp mặc định qua `generate_default_classes` (D-9).

Hai lớp bảo vệ: phải gõ đúng hostname của project mới chạy, và script từ chối
nếu `profiles` đã có dòng nào.

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

### Ai chịu trách nhiệm backup (P7-T5)

| Việc | Người giữ | Nhịp |
|---|---|---|
| Bật/kiểm tra backup tự động của Supabase | Super Admin #1 (Khang Nhỏ) | kiểm lại mỗi đầu năm học |
| Dump thủ công trước mỗi migration phá schema | Người chạy migration | mỗi lần deploy có migration |
| Giữ bản dump ngoài Supabase | Super Admin #2 (Mr. Đạt) | mỗi tháng |
| Thử restore vào project nháp | Hai Super Admin cùng làm | mỗi học kỳ |

⚠️ Bảng này là **đề xuất theo D-16**, user phải xác nhận trước khi coi là đã
chốt. Hobby plan của Supabase chỉ giữ backup tự động trong thời gian ngắn, nên
bản dump thủ công giữ ngoài mới là thứ cứu được dữ liệu — dữ liệu ở đây là hồ sơ
gần 900 thiếu nhi, mất là không dựng lại được.

Lệnh dump thủ công (chạy từ máy có Supabase CLI, không lưu output vào repo):

```bash
supabase db dump --db-url "<connection-string>" -f cq-tntt-<yyyymmdd>.sql
supabase db dump --db-url "<connection-string>" --data-only -f cq-tntt-data-<yyyymmdd>.sql
```

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
