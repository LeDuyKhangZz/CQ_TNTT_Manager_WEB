import { NextResponse } from "next/server";
import { formatDateTimeVi } from "@/lib/dates";

/** Tên file tải về chỉ dùng ASCII: bỏ dấu tiếng Việt thay vì thay bằng gạch nối. */
export function asciiFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "bao-cao";
}

export function excelResponse(buffer: ArrayBuffer | Buffer, filename: string): NextResponse {
  return new NextResponse(Buffer.from(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/**
 * Cách xếp bề ngang của bảng PDF.
 *
 * 🔴 **Có hai lý do bắt buộc phải mở tham số này ở M07-A, không phải sở thích.**
 * Trang xuất bảng điểm tự viết lại toàn bộ `pdfResponse` (biên bản audit F18 gọi
 * đúng tên: *"trùng lặp logic, dễ lệch nhau khi sửa"*), và khi gộp về đây thì hai
 * khác biệt thật lộ ra:
 *
 *   1. **Bề rộng.** Mặc định `"auto"` cho mọi cột sau cột đầu là đúng với báo cáo
 *      — vài cột, nhãn ngắn. Bảng điểm thì số cột do lớp tự đặt (có lớp 8–10 cột)
 *      và tiêu đề dài (*"Kiểm tra 15 phút số 3 (HS 1)"*): `"auto"` co theo nội
 *      dung nên tổng bề ngang **vượt khổ giấy** và pdfmake cắt cụt phần thừa
 *      trong im lặng. `"*"` chia đều phần còn lại nên không bao giờ tràn.
 *   2. **Cỡ chữ.** Bảng điểm dùng 7 thay vì 8 vì lý do y hệt.
 *
 * Tham số có giá trị mặc định ⇒ hai nơi gọi cũ (`reports`) **không đổi một chữ**.
 */
export interface PdfTableLayout {
  /** Cú pháp bề rộng cột của pdfmake. Mặc định: cột đầu co giãn, cột sau vừa nội dung. */
  widths?: Array<number | string>;
  /** Mặc định 8. */
  fontSize?: number;
}

/**
 * PDF dùng font Roboto nhúng sẵn của pdfmake để giữ dấu tiếng Việt — font mặc
 * định của trình đọc PDF không có sẵn bảng mã này (bài học từ P5-T3).
 */
export async function pdfResponse(
  title: string,
  subtitle: string,
  data: { headers: string[]; rows: Array<Array<string | number | null>> },
  filename: string,
  layout: PdfTableLayout = {},
): Promise<NextResponse> {
  const [{ default: pdfMake }, { default: vfsFonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.vfs = vfsFonts;
  const body = [
    data.headers.map((text) => ({ text, bold: true, color: "#ffffff", fillColor: "#F28C5B" })),
    ...data.rows.map((row) => row.map((value) => ({ text: value === null ? "—" : String(value) }))),
  ];
  const definition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 36, 24, 30],
    defaultStyle: { font: "Roboto", fontSize: layout.fontSize ?? 8 },
    content: [
      { text: title, bold: true, fontSize: 16, color: "#F28C5B", alignment: "center" },
      { text: subtitle, alignment: "center", margin: [0, 2, 0, 14] },
      {
        table: {
          headerRows: 1,
          widths: layout.widths ?? ["*", ...data.headers.slice(1).map(() => "auto")],
          body: body.length > 1 ? body : [...body, data.headers.map(() => ({ text: "—" }))],
        },
        layout: "lightHorizontalLines",
      },
      {
        text: `Xuất lúc ${formatDateTimeVi(new Date())}`,
        margin: [0, 12, 0, 0],
        fontSize: 7,
        color: "#756861",
      },
    ],
  };
  const buffer = await new Promise<Buffer>((resolve) => pdfMake.createPdf(definition).getBuffer(resolve));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
