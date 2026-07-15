# 10 — Security and Privacy

## 1. Dữ liệu nhạy cảm

- Dữ liệu trẻ em.
- Tên thánh/tôn giáo.
- Địa chỉ/số điện thoại.
- Sức khỏe.
- Bí tích.
- Kết quả học tập.
- Hoàn cảnh khó khăn.
- Mật khẩu/token.
- Phase 8: phí/biên lai Sa mạc.

Nguyên tắc: thu thập tối thiểu, đúng mục đích, scope hẹp.

## 2. Không được làm

- Không lưu mật khẩu plaintext.
- Không hiển thị mật khẩu hiện tại cho Super Admin.
- Không commit service role/db password.
- Không dùng public storage cho tài liệu cá nhân.
- Không log health/full profile.
- Không dùng service role trong browser.
- Không chỉ ẩn UI mà bỏ RLS.
- Không expose SQL error/stack.
- Không public danh sách 900 em.
- Không dùng URL object storage vĩnh viễn.
- Không gửi dữ liệu cho AI bên thứ ba trong v1.

## 3. Account security

- Password temp 8 ký tự chỉ là baseline; force change.
- Rate limit login.
- Session cookie secure/httpOnly theo Supabase/Next.
- Disable/lock.
- Reset by SA.
- Role change invalidates/refreshed token.
- Two SA for recovery.
- Production accounts không dùng demo password.

## 4. Authorization

- Default deny.
- RLS every table.
- Storage policies.
- Server action authorization.
- Validate UUID.
- Ownership via FK, không client-supplied user id.
- RPC actor = `auth.uid()`, không tin `updated_by` input.
- Prevent self role escalation.

## 5. Field-level exposure

### Student list

Không cần trả:

- health.
- sacrament.
- internal notes.
- auth identity.
- password state chi tiết.

### Guardian/student portal

Không trả:

- staff_only comments.
- sacrament.
- health.
- other students except Top 5 snapshot.
- staff private phone nếu không cần.

### Treasurer

Không health/sacrament/score details/internal notes.

## 6. Storage

- Private buckets.
- Path includes scope ids.
- Signed URLs 5–15 phút.
- Filename sanitized.
- MIME/type/size validation.
- Malware scanning nếu sau này cần; v1 giới hạn tài liệu thông thường.
- No executable upload.

## 7. Audit decision

User đã chốt bỏ full audit history.

Vẫn giữ:

- `created_at`.
- `created_by`.
- `updated_at`.
- `updated_by`.
- `locked_at/by`.

Hệ quả phải ghi nhận:

- Không điều tra được đầy đủ before/after.
- Không khôi phục field cũ từ app.
- Backup database là tuyến phục hồi chính.
- Những action tài chính Phase 8 nên cân nhắc immutable receipt records dù không có audit chung.

## 8. Privacy UI

- Session timeout hợp lý.
- Hide sensitive tabs nếu no permission.
- Mask phone trong một số list; click xem full nếu authorized.
- Export warning.
- Không index public.
- `robots.txt` disallow.
- No analytics chứa PII.
- Error reports scrub PII.

## 9. Backups và retention

- Business history 5 năm.
- Notifications 1–2 năm có thể cleanup.
- Import raw rows cleanup sớm.
- Health data review khi student archived.
- Backup trước migration lớn.
- Test restore ít nhất trước production launch.

## 10. Security test checklist

- IDOR direct URL.
- Same-class isolation.
- Role escalation.
- JWT stale after role change.
- SQL injection via filters.
- CSV formula injection in Excel export.
- XSS in announcement/comment.
- File path traversal.
- Double submit.
- Concurrency attendance/equipment.
- Auth user disabled.
- Service role bundle scan.

## 11. CSV/Excel injection

Khi export, cell bắt đầu bằng:

```text
= + - @
```

phải được escape/quote để không thành formula, đặc biệt tên/ghi chú nhập tự do.

## 12. Content security

- Sanitize rich text hoặc chỉ plain text/limited markdown.
- CSP.
- No arbitrary HTML in notifications.
- External links `rel=noopener`.
