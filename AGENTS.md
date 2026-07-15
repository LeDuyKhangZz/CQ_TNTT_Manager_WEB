# AGENTS.md — CQ TNTT Manager

> Hướng dẫn bắt buộc cho mọi coding agent, đặc biệt Codex và Claude Code.

## 1. Đọc trước khi làm

Theo đúng thứ tự:

1. `WORKLOG.md`
2. `docs/08-phase-plan.md`
3. `docs/01-business-analysis.md`
4. `docs/02-database-design.md`
5. `docs/03-workflow.md`
6. `docs/04-system-architecture.md`
7. `docs/05-permission-matrix.md`
8. Tài liệu module liên quan.

Không được bắt đầu code dựa trên prompt hiện tại mà bỏ qua trạng thái repo và quyết định đã chốt.

## 2. Claim task

Trước khi sửa code:

1. Chọn đúng task chưa claim từ `WORKLOG.md`/`docs/08-phase-plan.md`.
2. Ghi vào `TRẠNG THÁI HIỆN TẠI`:
   ```text
   P3-T2 — đang làm — Codex — 2026-07-20
   ```
3. Không claim nhiều task lớn cùng lúc.
4. Không sửa file thuộc task agent khác đang claim, trừ khi user yêu cầu hoặc hai bên đã ghi phối hợp trong WORKLOG.

## 3. Nguồn sự thật

- Business: `docs/01-business-analysis.md`.
- Database: `docs/02-database-design.md`.
- Workflow: `docs/03-workflow.md`.
- Architecture: `docs/04-system-architecture.md`.
- Permissions: `docs/05-permission-matrix.md`.
- UI: `docs/06-ui-ux-spec.md`.
- Tests: `docs/07-testing-strategy.md`.
- Tasks: `docs/08-phase-plan.md`.
- Current status: `WORKLOG.md`.

Nếu mâu thuẫn:

- Không tự chọn.
- Ghi blocker.
- Nêu file/section mâu thuẫn.
- Hỏi user.

## 4. Quy tắc phạm vi

- Làm đúng task ID.
- Không tiện tay refactor module ngoài scope.
- Không đổi business rule đã chốt.
- Không tự thêm module.
- Không bắt đầu Sa mạc trước Phase 8.
- Không đổi Vercel Hobby sang nền tảng khác.
- Không đổi modular monolith thành microservices.
- Không thêm phân đoàn/chi đoàn/đội.
- Không thêm public sign-up.

## 5. Quy tắc bảo mật tuyệt đối

- RLS trên mọi bảng.
- Ẩn nút không phải authorization.
- Mọi Server Action tự authorize.
- Không tin `user_id`, `role`, `updated_by`, `class_id` nhạy cảm từ client.
- `service_role` chỉ server-only; không import vào Client Component.
- Không commit `.env`, JWT, password, DB URL.
- Không log mật khẩu/token/sức khỏe/hồ sơ đầy đủ.
- Super Admin reset password, không xem mật khẩu hiện tại.
- Storage private.
- Invalid UUID trả 404/validation error, không 500.
- Student/guardian isolation phải test bằng JWT thật.
- Ghi chú `staff_only` không được rò rỉ count/content cho guardian/student.
- Export phải giữ filter và chống Excel formula injection.

## 6. Quy tắc database

- Schema change bằng migration mới.
- Không sửa migration đã áp production.
- Migration chạy sạch từ DB trống.
- Constraint quan trọng nằm ở DB.
- Multi-row transaction/concurrency dùng RPC + row lock.
- View dùng `security_invoker`.
- `security definer` đặt `search_path` cố định và kiểm actor.
- Không hard delete enrollment/attendance/score/report final.
- Không tạo full audit log; chỉ metadata cập nhật theo quyết định user.
- Sa mạc tables chưa migrate trước Phase 8.

Sau migration:

```bash
npx supabase db reset
npm run db:types
npm run test:db
```

Nếu script chưa tồn tại, Phase 0 phải thiết lập hoặc ghi lệnh thực tế.

## 7. Quy tắc code

- TypeScript strict.
- Không `any` nếu có thể mô hình hóa.
- Zod ở boundary.
- Server Components mặc định.
- Client Component chỉ khi cần interaction/browser APIs.
- Feature-based structure.
- Không generic repository làm mất type/quyền.
- Không một action `updateAnyTable`.
- Error code ổn định, UI tiếng Việt.
- DB enum tiếng Anh; label tiếng Việt.
- Date UI `dd/MM/yyyy`, timezone `Asia/Ho_Chi_Minh`, DB UTC.
- UTF-8, không mojibake.
- Không thêm dependency nếu thư viện hiện tại làm được.
- Không dùng file system local như storage bền vững trên Vercel.

## 8. Quy tắc UX

- Mobile 360px và laptop 1366px.
- Touch target >= 44px.
- Attendance mặc định present.
- Mass/catechism độc lập.
- Empty score là null, không phải 0.
- Không hiển thị mã thiếu nhi ở table mặc định.
- Không hiển thị promotion trên student detail.
- Dì/Sơ là danh xưng, không role.
- Top 5 có thể publish trước final average.
- Không tạo notification deep-link tới route chưa tồn tại.

## 9. Quy tắc kiểm thử

Trước khi kết thúc task:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Nếu có DB/RLS:

```bash
npm run test:db
```

Nếu đổi workflow chính:

```bash
npm run test:e2e
```

Ghi số test thật. Không ghi `pass` nếu chưa chạy.

High-risk fix:

- Tác giả không tự ghi Verified.
- Agent còn lại xác minh độc lập.
- Ghi verification queue vào WORKLOG nếu cần.

## 10. Quy tắc Git

- User tự commit.
- Agent không chạy `git commit`, `git commit --amend`, `git push` trừ khi user yêu cầu rõ trong lượt hiện tại.
- Không reset/checkout làm mất thay đổi của user/agent khác.
- Trước khi sửa xem `git status`.
- Báo file thay đổi.

## 11. Cập nhật WORKLOG

Sau task hoặc trước khi hết phiên:

- Current status <= 6 dòng.
- Next task rõ.
- Blocker.
- Phase checkbox.
- Một entry đầu nhật ký.
- Chỉ giữ 6 entry gần nhất.
- Ghi migration/data impact.
- Ghi lệnh test thật.
- Không gọi deployed nếu chưa smoke URL production.

## 12. Những quyết định không được đảo ngược

- 5 ngành; Dự trưởng không phải ngành.
- Không đơn vị TNTT ngoài ngành/lớp giáo lý.
- 20 lớp mặc định.
- Một student một lớp chính/năm.
- Một account một role active.
- Role ngành có sector cụ thể.
- Parent: một guardian/student; guardian nhiều con.
- Attendance Thu/Sun, mass/catechism.
- Lock 3 ngày, lease 15 phút.
- Không full audit.
- PWA, Vercel Hobby.
- Sa mạc cuối cùng.
