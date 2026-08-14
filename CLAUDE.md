# CLAUDE.md — Hướng dẫn riêng cho Claude Code

Bạn đang phối hợp với Codex trên dự án `CQ TNTT Manager`.

## 1. Bootstrap mỗi session

> 🔴 **Việc đang làm là GIAI ĐOẠN 2B — tái thiết kế giao diện.**
> `docs/08-phase-plan.md` là kế hoạch xây dựng ban đầu (Phase 1–8, đã xong tới Phase 7).
> **Không lấy task từ đó nữa.** Task của 2B nằm ở `16_PHASE_2B_IMPLEMENTATION_LOG.md`.

Bắt buộc chạy/đọc:

```text
git status
WORKLOG.md                                    ← entry mới nhất
AGENTS.md                                     ← §1b: nguồn sự thật của 2B
docs/system-workflow-redesign/ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md   ← ĐÃ LÀM/CHƯA LÀM
docs/system-workflow-redesign/ui-redesign/11_APPROVED_MODULE_PLAN.md          ← thứ tự + nghiệm thu
```

Rồi đọc thêm theo việc sắp làm:

| Sắp làm | Đọc thêm |
|---|---|
| Component / token / màu | `09_APPROVED_DESIGN_SYSTEM.md` |
| Bất cứ gì đụng theme | `10_APPROVED_THEME_RULES.md` |
| Một module cụ thể | `modules/<Mxx>/03_AUDIT_RESULTS.md` + `04_TO_BE_FLOWS.md` |

Không tải toàn bộ repo vào context; ưu tiên tìm file liên quan.

**Ba tài liệu `09`/`10`/`11` đã được chủ dự án duyệt 2026-07-23 — không tự đổi.**
`09` **ghi đè** `docs/06-ui-ux-spec.md` §2 (token) và §3 (typography).

## 2. Vai trò của Claude

Claude có thể:

- Thực hiện task feature.
- Rà soát kiến trúc/nghiệp vụ.
- Viết migration/RLS.
- Viết test.
- Xác minh độc lập fix của Codex.

Khi là verifier:

- Không chỉ đọc diff.
- Dựng kịch bản độc lập.
- Ưu tiên đường tấn công direct URL, direct Supabase client/JWT, concurrency và dữ liệu cùng lớp.
- Chỉ ghi Verified khi test thật.

## 3. Không rewrite vô lý

Nếu repo đã có code:

- Hiểu pattern hiện tại.
- Dùng component/lib sẵn có.
- Không scaffold lại toàn bộ.
- Không thay framework.
- Không rename hàng loạt ngoài task.
- Không làm lại UI đã hoàn tất chỉ vì sở thích.

## 4. Khi làm database

Trước migration:

- Đọc toàn bộ migration liên quan.
- Tìm policy/function/trigger hiện tại.
- Kiểm tra generated types.
- Phân tích data impact.

Sau migration:

- Reset local.
- pgTAP/RLS negative.
- Regenerate types.
- Build.

Không dùng service role để làm test user flow; test bằng JWT role thật.

## 5. Khi làm attendance

Phải kiểm:

- Default present không vô tình ghi absent.
- Hai status độc lập.
- Claim atomic.
- Lease dùng DB time.
- Old editor sau takeover bị chặn.
- Finalize idempotent.
- Lock 3 ngày.
- Parent/student only own finalized.

## 6. Khi làm gradebook

Phải kiểm:

- Empty không thành 0.
- 0 vẫn hợp lệ.
- max 10.
- lock.
- comments visibility.
- Top 5 snapshot.
- Export filter.

## 7. Khi làm auth

- Username mapping server-side.
- Admin API chỉ server-only.
- Không expose password hiện tại.
- Force change temp password.
- Disabled account denied.
- One active role.
- Role scope consistent.

## 8. Khi context sắp đầy

Trước khi dừng:

1. Đưa code về trạng thái buildable nếu có thể.
2. Chạy test phù hợp.
3. Cập nhật WORKLOG chính xác.
4. Ghi phần đang dở và file đang sửa.
5. Không nói “sẽ làm tiếp nền/background”.
6. **Commit + push được phép** (chủ dự án cấp quyền thường trực 2026-08-14) — nhưng
   **chỉ sau khi đã chạy kiểm thử thật**, và tách commit theo task ID.

## 9. Format báo cáo cuối session

```text
Task:
Đã làm:
File thay đổi:
Migration/data impact:
Test thật:
Blocker/rủi ro:
Cần agent tiếp theo:
```

## 10. Prompt mỗi session của Giai đoạn 2B ⭐

**Dán nguyên khối này. Không cần nói gì thêm.**

```text
Tiếp tục GIAI ĐOẠN 2B.

Đọc theo thứ tự: git status · WORKLOG.md (entry mới nhất) · AGENTS.md §1b ·
docs/system-workflow-redesign/ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md ·
11_APPROVED_MODULE_PLAN.md.

Từ file 16 xác định việc chưa làm tiếp theo, báo tôi biết bạn sắp làm gì, rồi làm.
Theo quy trình 9 bước ở 11 §4 và nghiệm thu 15 mục ở 11 §5.
Không tự đổi ba tài liệu đã duyệt 09/10/11.
Xong thì chạy lint · typecheck · test · build thật, rồi cập nhật file 16 + WORKLOG
bằng số kiểm thử thật, rồi commit + push (một commit cho một task ID).
```

**Muốn chỉ định việc cụ thể** thì thêm một dòng, ví dụ:

```text
Phiên này làm Mốc 0B mục 0.7 (a11y vỏ).
Phiên này làm Mốc 0B mục 0.8 (13 component còn lại).
Phiên này bắt đầu module 1 — M14 Vỏ & Điều hướng.
Phiên này trả nợ window.confirm ở M07 (grep "NỢ 2B").
```

> Thứ tự đã chốt: **hết 0B rồi mới sang module.** Nếu bạn bảo tôi nhảy sang module
> khi 0B chưa xong, tôi sẽ nói rõ cái gì còn thiếu trước khi làm.

## 11. Prompt cho việc ngoài 2B

Chỉ dùng khi quay lại Phase 8 (Sa mạc) hoặc vá lỗi production:

```text
Việc này KHÔNG thuộc Giai đoạn 2B. Đọc WORKLOG.md và docs/08-phase-plan.md.
Claim task trước khi code, xác minh bằng test thật, cập nhật WORKLOG, rồi commit + push.
```
