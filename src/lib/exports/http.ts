import { NextResponse } from "next/server";

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
 * PDF dùng font Roboto nhúng sẵn của pdfmake để giữ dấu tiếng Việt — font mặc
 * định của trình đọc PDF không có sẵn bảng mã này (bài học từ P5-T3).
 */
export async function pdfResponse(
  title: string,
  subtitle: string,
  data: { headers: string[]; rows: Array<Array<string | number | null>> },
  filename: string,
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
    defaultStyle: { font: "Roboto", fontSize: 8 },
    content: [
      { text: title, bold: true, fontSize: 16, color: "#F28C5B", alignment: "center" },
      { text: subtitle, alignment: "center", margin: [0, 2, 0, 14] },
      {
        table: {
          headerRows: 1,
          widths: ["*", ...data.headers.slice(1).map(() => "auto")],
          body: body.length > 1 ? body : [...body, data.headers.map(() => ({ text: "—" }))],
        },
        layout: "lightHorizontalLines",
      },
      {
        text: `Xuất lúc ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
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
