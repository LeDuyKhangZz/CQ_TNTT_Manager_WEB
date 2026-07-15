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
7. Create buckets/private policies.
8. Create initial SA via secure admin script.
9. Test RLS bằng actual JWT.

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
