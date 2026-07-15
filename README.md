# CQ TNTT Manager — Bộ đặc tả triển khai

Bộ tài liệu này là nguồn sự thật để **Claude Code và Codex phối hợp xây dựng Web quản lý Thiếu Nhi Giáo xứ Chợ Quán**.

## Mục tiêu

Xây dựng một web/PWA tiếng Việt, dễ sử dụng trên laptop và điện thoại, phục vụ khoảng **900 thiếu nhi và 20 lớp**, tập trung vào:

- Quản lý năm học, ngành, lớp và hồ sơ thiếu nhi.
- Quản lý Huynh trưởng/Giáo lý viên/Dự trưởng phụ tá.
- Điểm danh thứ Năm và Chúa nhật.
- Giáo án năm học và phân công người dạy.
- Kiểm tra, bảng điểm, nhận xét và Top 5 tùy chọn.
- Chuyển lớp cuối năm.
- Phụ huynh và cổng thiếu nhi.
- Ban, lịch họp, công việc tuần và thiết bị Ban Kỹ thuật.
- Thông báo, dashboard, Excel/PDF và báo cáo đã chốt.
- Module Sa mạc thiếu nhi ở bản phát hành cuối cùng.

## Thứ tự bắt buộc phải đọc

1. [`AGENTS.md`](AGENTS.md)
2. [`WORKLOG.md`](WORKLOG.md)
3. [`docs/08-phase-plan.md`](docs/08-phase-plan.md)
4. Tài liệu liên quan trực tiếp đến task đang claim.
5. [`CLAUDE.md`](CLAUDE.md) nếu agent là Claude Code.

Không agent nào được code chỉ dựa trên một prompt ngắn mà bỏ qua bộ tài liệu này.

## Cây tài liệu

```text
.
├── AGENTS.md
├── CLAUDE.md
├── WORKLOG.md
├── README.md
└── docs
    ├── 00-glossary.md
    ├── 01-business-analysis.md
    ├── 02-database-design.md
    ├── 03-workflow.md
    ├── 04-system-architecture.md
    ├── 05-permission-matrix.md
    ├── 06-ui-ux-spec.md
    ├── 07-testing-strategy.md
    ├── 08-phase-plan.md
    ├── 09-data-import-and-seed.md
    ├── 10-security-and-privacy.md
    ├── 11-api-and-server-actions.md
    ├── 12-deployment-runbook.md
    └── 13-summer-camp-backlog.md
```

## Nguồn sự thật

| Nội dung | Nguồn sự thật |
|---|---|
| Phạm vi, thuật ngữ, nghiệp vụ | `docs/01-business-analysis.md` |
| Schema, enum, constraint, RLS | `docs/02-database-design.md` |
| Luồng nghiệp vụ | `docs/03-workflow.md` |
| Kiến trúc và quy ước code | `docs/04-system-architecture.md` |
| Quyền từng thao tác | `docs/05-permission-matrix.md` |
| Giao diện | `docs/06-ui-ux-spec.md` |
| Definition of Done, test | `docs/07-testing-strategy.md` |
| Task và thứ tự triển khai | `docs/08-phase-plan.md` |
| Trạng thái hiện tại | `WORKLOG.md` |
| Quyết định đã chốt | `WORKLOG.md` mục `QUYẾT ĐỊNH ĐÃ CHỐT` |

Nếu hai tài liệu mâu thuẫn, **không tự chọn một bên**. Ghi blocker vào `WORKLOG.md` và hỏi user.

## Tên tạm thời

- Tên kỹ thuật: `cq-tntt-manager`
- Tên hiển thị tạm: `Thiếu Nhi Chợ Quán`
- Múi giờ hiển thị: `Asia/Ho_Chi_Minh`
- Ngôn ngữ: tiếng Việt
- Định dạng ngày: `dd/MM/yyyy`
- Database lưu thời gian: UTC

Tên thương hiệu có thể đổi sau mà không làm thay đổi schema nghiệp vụ.
