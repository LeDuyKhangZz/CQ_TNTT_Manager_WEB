import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { asciiFilename, excelResponse } from "@/lib/exports/http";
import { batchReportFilename, buildBatchReportWorkbook } from "@/features/imports/export";
import { IMPORT_FORBIDDEN_TEXT } from "@/features/imports/import-feedback";
import { requireImportAccess } from "@/features/imports/server/permissions";
import { getBatchReport } from "@/features/imports/server/queries";

/**
 * Tải file lỗi/kết quả của một lần nhập — M12-C, **TO-BE 5 / AC-22 / SEC-04b**.
 *
 * 🔴 **`requireImportAccess()` phải là câu lệnh ĐẦU TIÊN** (`docs/11` §16, và
 * SEC-04b nói thẳng: *"bị chặn **trước mọi truy vấn**"*). Không phải vì RLS yếu
 * — RLS vẫn trả 0 dòng cho Giáo lý viên lớp — mà vì một route handler chạy truy
 * vấn rồi mới kiểm quyền sẽ trả về **một file rỗng hợp lệ** thay vì một lời từ
 * chối: người bị chặn tưởng lần nhập không có dòng nào.
 *
 * ⚠️ Route handler **không** đi qua `ROUTE_RULES` của middleware giống trang, nên
 * hàng rào ở đây là hàng rào duy nhất ở tầng ứng dụng. Cùng khuôn
 * `/imports/template/route.ts` đã dùng từ Phase 2.
 */
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  try {
    await requireImportAccess();
  } catch (error) {
    // 🔴 Chỉ nuốt `AppError`. `requireAuthContext` báo "chưa đăng nhập" bằng
    // `redirect()` của Next — thứ đó **cũng** là một lỗi được ném ra, và nuốt nó
    // là biến một lượt chuyển về `/login` thành một câu 403 vô nghĩa. Đúng bài
    // học D-96 mà M12-A vừa trả cho năm Server Action của module.
    if (!(error instanceof AppError)) throw error;
    // 403 kèm câu tiếng Việt, không phải 500: người bấm nhầm nút cần biết mình
    // không có quyền, chứ không phải nghĩ hệ thống hỏng.
    return new NextResponse(IMPORT_FORBIDDEN_TEXT, {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const { batchId } = await params;
  const report = await getBatchReport(batchId);
  // Ba trường hợp cùng ra 404, và cả ba đều đúng: lần nhập không tồn tại · lần
  // nhập RLS không cho người này đọc · id trong đường dẫn **không phải UUID**
  // (`AGENTS` §5 — invalid UUID phải là 404, không được thành 500). Phân biệt hai
  // trường hợp đầu là nói cho người ngoài biết id nào có thật.
  if (!report) return new NextResponse("Không tìm thấy lần nhập.", { status: 404 });

  const buffer = await buildBatchReportWorkbook(report.rows);
  const filename = batchReportFilename(report.filename);
  // Tiêu đề HTTP chỉ mang ASCII được; tên gốc có dấu tiếng Việt nên hạ dấu ở đây
  // chứ không hạ trong `batchReportFilename` — bài kiểm tra tên file đọc bản có dấu.
  return excelResponse(buffer, `${asciiFilename(filename.replace(/\.xlsx$/, ""))}.xlsx`);
}
