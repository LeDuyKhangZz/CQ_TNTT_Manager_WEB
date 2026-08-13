# AGENTS.md — CQ TNTT Manager

> Hướng dẫn bắt buộc cho mọi coding agent, đặc biệt Codex và Claude Code.

## 1. Đọc trước khi làm

> 🔴 **DỰ ÁN ĐANG Ở GIAI ĐOẠN 2B — TÁI THIẾT KẾ GIAO DIỆN.**
> Phase 1–8 trong `docs/08-phase-plan.md` là kế hoạch **XÂY DỰNG BAN ĐẦU**, đã xong tới Phase 7.
> Việc đang làm bây giờ nằm ở `docs/system-workflow-redesign/ui-redesign/`, **không phải** ở
> `docs/08-phase-plan.md`. Xem §1b.

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

## 1b. Giai đoạn 2B — nguồn sự thật đang hiệu lực

Đọc **bốn file này** trước khi làm bất cứ việc gì của 2B:

| Thứ tự | File | Vai trò |
|---|---|---|
| 1 | `docs/system-workflow-redesign/ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md` | ⭐ **ĐÃ LÀM / CHƯA LÀM.** Bắt đầu từ đây |
| 2 | `docs/system-workflow-redesign/ui-redesign/11_APPROVED_MODULE_PLAN.md` | Thứ tự, phạm vi, quy trình 9 bước, nghiệm thu chung 15 mục |
| 3 | `docs/system-workflow-redesign/ui-redesign/09_APPROVED_DESIGN_SYSTEM.md` | Design system. **Ghi đè `docs/06-ui-ux-spec.md` §2 và §3** |
| 4 | `docs/system-workflow-redesign/ui-redesign/10_APPROVED_THEME_RULES.md` | Quy tắc theme động |

Ba tài liệu `09`/`10`/`11` **đã được chủ dự án phê duyệt ngày 2026-07-23**, không tự đổi.

**Trước khi code một module:** đọc thêm `03_AUDIT_RESULTS.md` và `04_TO_BE_FLOWS.md` của module đó
trong `docs/system-workflow-redesign/modules/<Mxx>/`.

**Sau khi xong:** cập nhật `16_PHASE_2B_IMPLEMENTATION_LOG.md` + `00_SYSTEM_AUDIT_BOARD.md` +
`WORKLOG.md` bằng **số kiểm thử thật**.

**Nợ đang mở:** grep `NỢ 2B` trong `src/` ra hết các chỗ phải trả đúng module.

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
- **CÓ full audit log** (D-65, chốt 2026-07-23 — đảo ngược D-34). Bảng audit chỉ append,
  không ai sửa/xóa kể cả Super Admin; chỉ Super Admin đọc. Không ghi password/token/nội dung
  hồ sơ sức khỏe vào log. Phạm vi thao tác phải ghi: `docs/system-workflow-redesign/06_DECISION_LOG.md` D-65.
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
- 19 lớp mặc định: 18 lớp giáo lý thuộc 5 ngành và 1 lớp Dự trưởng chỉ hoạt động trong HK1.
- Không có Chiên Con 3; Thiếu 3 không chia A/B.
- Lớp Dự trưởng được tính vào tổng số lớp nhưng Dự trưởng không phải ngành.
- Một student một lớp chính/năm.
- Một account một role active.
- Role ngành có sector cụ thể.
- Parent: một guardian/student; guardian nhiều con.
- Attendance Thu/Sun, mass/catechism.
- Lock 3 ngày, lease 15 phút.
- ~~Không full audit.~~ → **CÓ full audit log** (D-65, 2026-07-23).
- PWA, Vercel Hobby.
- Sa mạc cuối cùng.

## 13. Quyết định sau audit Giai đoạn 1 (2026-07-23)

19 quyết định D-61…D-79 nằm ở **`docs/system-workflow-redesign/06_DECISION_LOG.md`**.
Đọc file đó **trước khi** đụng vào permission, gradebook lock, portal, equipment, notification
hoặc academic year — nó ghi đè mô tả cũ trong `docs/03`, `docs/05`, `docs/06` và `WORKLOG.md`.

Sáu thay đổi permission bắt buộc có RLS negative test bằng JWT thật: D-63, D-66, D-67, D-70, D-74, D-75.
