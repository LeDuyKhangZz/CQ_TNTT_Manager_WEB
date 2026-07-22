# 07 — Testing Strategy

## 1. Mục tiêu

Test tập trung vào:

- RLS và cách ly dữ liệu trẻ em.
- Role/scope.
- Điểm danh concurrency/locking.
- Chuyển lớp.
- Bảng điểm động.
- Account/password reset.
- Export đúng filter.
- Không làm sai dữ liệu im lặng.

Không được sửa test để che bug.

## 2. Test pyramid

### Unit

- Zod schemas.
- Username/phone normalization.
- Grade weighted average.
- Attendance score.
- Promotion target rules.
- Leaderboard sorting/ties.
- Permission pure functions.
- Date/time lock calculations.

### Component

- Attendance roster default present.
- Không chọn khác không biến thành absent.
- Grade cell empty = null, 0 vẫn là 0.
- Mobile status controls.
- Permission-based buttons.
- Filter object preserved for export.

### Database/pgTAP

- RLS mỗi bảng.
- One active role.
- One open enrollment.
- Class/sector scope.
- Guardian/student ownership.
- Locked attendance.
- Gradebook lock.
- Promotion atomicity.
- Equipment quantity.
- Private comments.
- Top 5 isolation.
- Storage policies.

### Integration

- Server Action + DB.
- Auth alias login.
- Admin reset password.
- Import batch.
- Report snapshot.
- Signed URL.

### E2E Playwright

- Core workflows qua browser.
- Mobile viewport.
- Direct URL IDOR.
- Invalid UUID -> 404.
- Multi-user attendance claim/takeover.
- Parent/student portal.

## 3. Required scripts

Phase 0 phải thiết lập:

```json
{
  "scripts": {
    "lint": "next lint hoặc eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:db": "supabase test db",
    "test:e2e": "playwright test",
    "build": "next build",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > src/types/database.ts"
  }
}
```

Điều chỉnh theo repo thật, nhưng WORKLOG phải ghi lệnh thật.

## 4. Gate chung

Trước khi đánh dấu task done:

- Lint pass.
- Typecheck pass.
- Unit/component liên quan pass.
- Build pass.
- Migration reset được nếu có schema change.
- RLS negative test nếu đổi quyền.
- E2E smoke nếu đổi workflow chính.
- Cập nhật docs/WORKLOG.

Không viết `pass` nếu chưa chạy.

## 5. RLS threat cases

### Student isolation

Hai thiếu nhi cùng lớp:

- Student A không đọc profile đầy đủ của B.
- Không đọc attendance/score/comment của B.
- Published Top 5 là ngoại lệ hẹp: chỉ 5 entry công bố.
- A không update dữ liệu của B.

### Guardian isolation

Hai guardian có con cùng lớp:

- G1 chỉ thấy con của G1.
- Không suy ra health/sacrament.
- Không tạo absence request cho con G2.

### Class staff isolation

- GLV Ấu 1A không đọc/sửa Thiếu 1A.
- Direct URL trả 404 hoặc forbidden an toàn.
- Supabase client direct query vẫn RLS.

### Sector isolation

- Trưởng ngành Ấu không access Thiếu.
- Trưởng ngành Ấu có thể access mọi lớp Ấu.
- Điểm danh trực tiếp chỉ lớp staff assignment nếu policy đã chốt như docs.

### Committee isolation

- Member Ban Kỹ thuật không thấy Ban Y tế nếu không membership.
- Leader Ban A không post Ban B.

## 6. Attendance tests

- Unique session.
- Default present.
- Mass/catechism independent.
- Claim session atomically.
- Second user denied while lease active.
- Takeover only after 15 min.
- Old editor cannot overwrite after takeover.
- Finalize creates complete roster.
- Lock after 3 days.
- Non-SA cannot edit locked.
- SA can unlock.
- Parent/student see only finalized own record.
- Double-submit idempotent.

## 7. Grade tests

- Dynamic assessment appears as column.
- Class with only midterm and final is valid; quiz 15m is not required.
- Multiple assessments of the same kind are valid; no per-kind column quota.
- 0 valid.
- Empty null.
- Score >10 rejected DB.
- Enrollment/class mismatch rejected.
- Weight calculation.
- Assigned teacher can change a positive assessment weight before lock; recalculation uses the new weight.
- Zero/negative/out-of-range weight rejected; weight change after lock rejected.
- Attendance suggestion.
- Teacher override.
- Lock blocks update.
- SA unlock.
- Public/private comments isolated.
- Export all students class.

## 8. Promotion tests

- Representative only proposes own class.
- Teacher cannot propose.
- Sector leader only approves own sector.
- Default A→A.
- Manual A→B accepted.
- Invalid skip level rejected.
- Repeat same grade accepted.
- Atomic close old/create new.
- Failure leaves old enrollment unchanged.
- Hiệp 2 proposal creates no staff account automatically.
- Warnings do not block approval.

Gate Phase 5 hiện thực thi bằng `supabase/tests/016..019` và
`tests/e2e/results.spec.ts`: ba viewport dùng ba lớp độc lập, bấm thật từ tạo/nhập/publish điểm,
public/internal comment, Top 5 năm vị trí, Excel/PDF, khóa/mở khóa, đề xuất/duyệt promotion đến
portal guardian/student. E2E kiểm draft/internal/cross-class không xuất hiện và poll cả hai đầu
enrollment của giao dịch chuyển lớp.

## 9. Account tests

- Username unique case-insensitive.
- Alias normalization.
- Must change password.
- Disabled account denied.
- Super Admin reset works.
- Non-SA Admin API impossible.
- Current password never queryable.
- Service role absent from client bundle.
- Brute-force throttling behavior if implemented.

## 10. Import tests

- Valid row.
- Missing required.
- Invalid date.
- Duplicate warning.
- Same guardian reused by normalized phone.
- Student code sequence safe under concurrency.
- Dry run no writes.
- Commit batch atomic or records errors precisely.
- UTF-8 Vietnamese preserved.

## 11. Export tests

- Excel row count equals filtered UI result.
- Date range preserved.
- Scope preserved.
- Unauthorized export denied.
- PDF title/logo/date.
- Snapshot checksum/file.
- Final snapshot immutable.

## 12. Performance checks

Không cần load test lớn, nhưng trước production:

- Seed 900 students/19 classes, gồm lớp Dự trưởng chỉ hoạt động trong HK1.
- Load class roster.
- Finalize ~60–100 records.
- Student list pagination.
- Export sector/year.
- Check query plans cho attendance/score/dashboard.

## 13. Verification rule Claude/Codex

- Agent tạo fix không tự ghi `Verified`.
- Bug/RLS/high-risk fix phải được agent còn lại xác minh bằng kịch bản độc lập.
- Nếu chỉ một agent có session, ghi `Fixed — awaiting independent verification`.
- Không chạy đúng một test của tác giả rồi gọi là independent verification.

## 14. Test data

`seed.dev.sql`:

- 2 Super Admin.
- Cha sở, Cha phó, XĐ trưởng, Phó XĐ, Thư ký, Thủ quỹ.
- Trưởng/Phó của ít nhất 2 ngành.
- 2 lớp cùng ngành A/B.
- 2 GLV mỗi lớp.
- 1 Dự trưởng.
- 2 guardians.
- 4 students, trong đó 2 cùng lớp nhưng khác guardian.
- 1 staff đồng thời guardian.
- Attendance/assessment fixtures.
- 2 Ban.

Mật khẩu demo chỉ local, không giống production.
