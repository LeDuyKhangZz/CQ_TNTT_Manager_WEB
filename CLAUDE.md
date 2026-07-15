# CLAUDE.md — Hướng dẫn riêng cho Claude Code

Bạn đang phối hợp với Codex trên dự án `CQ TNTT Manager`.

## 1. Bootstrap mỗi session

Bắt buộc chạy/đọc:

```text
git status
WORKLOG.md
docs/08-phase-plan.md
AGENTS.md
entry mới nhất trong WORKLOG
```

Sau đó đọc docs module. Không tải toàn bộ repo vào context nếu không cần; ưu tiên tìm file liên quan.

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
6. Không tự commit.

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

## 10. Prompt ngắn cho session đầu

```text
Đọc AGENTS.md, CLAUDE.md, WORKLOG.md và docs/08-phase-plan.md.
Claim đúng task tiếp theo trước khi code. Làm đúng phạm vi task và cập nhật
WORKLOG ngay sau khi hoàn tất hoặc trước khi hết phiên. Không tự commit.
```

## 11. Prompt cho session sau

```text
Đọc trạng thái mới nhất trong WORKLOG.md và task phase đang active.
Kiểm tra git status, tiếp tục đúng task đã claim hoặc claim task tiếp theo.
Không làm lại phần đã hoàn tất; xác minh bằng test thật và cập nhật WORKLOG.
```
