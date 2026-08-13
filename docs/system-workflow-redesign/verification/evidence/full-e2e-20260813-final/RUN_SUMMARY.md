# Full E2E final — 2026-08-13

## Baseline và cách chạy

- Local Supabase đã `db:reset` qua migration `20260813000400` và `seed:dev` thành công.
- Dùng production build cuối, Playwright **1 worker**.
- Inventory: **585 test**, **23 spec**, ba project viewport `mobile-360`, `tablet-768`,
  `laptop-1366`.
- Thời lượng: **32,2 phút**.

## Kết quả

- **571 pass**
- **14 fail**
- **0 failure `ECONNREFUSED`**
- Verdict của browser gate: **FAILED**

Phân loại sau khi đọc đủ 14 `error-context.md`:

- **14 PRODUCT_UX_RELIABILITY** — UI còn pending/stale, derived state chưa cập nhật hoặc navigation
  không hoàn tất;
- **0 TEST_SYNCHRONIZATION**;
- **0 INCONCLUSIVE/CASCADE**;
- theo module: M02 = 4, M03 = 5, M07 = 2, M10 = 1, M12 = 2;
- theo viewport: laptop = 8, tablet = 4, mobile = 2.

Không failure nào là bằng chứng mutation nghiệp vụ ghi sai. Một số artifact cho thấy mutation/success
đã xảy ra nhưng UI dẫn xuất còn cũ; các case dừng trước postcondition/DB readback phải được ghi là
“trạng thái mutation chưa xác định”, không suy diễn thành dữ liệu sai.

Các failure artifact:

1. M02 sinh lớp mặc định — tablet
2. M02 sinh lớp mặc định — laptop
3. M02 đổi trạng thái lớp rồi trả lại — laptop
4. M02 mốc học kỳ 1 — laptop
5. M12 xác nhận dòng trùng — laptop
6. M12 hủy rồi mở lại lô — tablet
7. M10 nhãn thu hồi — laptop
8. M07 hành trình Kết quả/chuyển lớp — mobile
9. M07 hành trình Kết quả/chuyển lớp — laptop
10. M03 tạm nghỉ rồi khôi phục — tablet
11. M03 tạm nghỉ rồi khôi phục — laptop
12. M03 vòng đời bí tích — mobile
13. M03 cập nhật số điện thoại phụ huynh — tablet
14. M03 cập nhật số điện thoại phụ huynh — laptop

## Artifact integrity

`test-results/.last-run.json` có SHA-256:

```text
75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659
```

Không chạy targeted trong thư mục `test-results` này sau khi sao lưu. Mỗi thư mục failure giữ
`error-context.md`, screenshot/trace nếu Playwright sinh ra.

### Giới hạn artifact

`playwright-report/index.html` trong thư mục sao lưu **không thuộc lượt final**: payload nhúng là
report cũ của `home.spec.ts`, 15 test/11 unexpected, ngày 2026-07-15 và 10 worker. Không được dùng
HTML này làm bằng chứng cho kết quả 571/585. Con số tổng lấy từ console result được quan sát khi
lượt final kết thúc; danh sách/phân loại 14 fail lấy từ `.last-run.json` và 14
`test-results/*/error-context.md` khớp lượt final. Việc HTML bị stale được giữ nguyên và công khai,
không xóa hay thay bằng artifact khác.
