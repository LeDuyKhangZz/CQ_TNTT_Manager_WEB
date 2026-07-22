import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getReportSnapshot } from "@/features/reports/server/queries";
import { asciiFilename, excelResponse, pdfResponse } from "@/lib/exports/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tải lại bản đã chốt. Dữ liệu lấy từ `payload_json` chứ không tính lại, nên
 * file tải hôm nay giống hệt file tải lúc chốt (D-51).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ snapshotId: string }> },
) {
  const { snapshotId } = await params;
  if (!UUID_PATTERN.test(snapshotId)) {
    return NextResponse.json({ error: "Không tìm thấy báo cáo." }, { status: 404 });
  }
  const format = new URL(request.url).searchParams.get("format") ?? "xlsx";
  if (format !== "xlsx" && format !== "pdf") {
    return NextResponse.json({ error: "Định dạng xuất không hợp lệ." }, { status: 400 });
  }

  const snapshot = await getReportSnapshot(snapshotId);
  if (!snapshot) return NextResponse.json({ error: "Không tìm thấy báo cáo." }, { status: 404 });

  const subtitle = `${snapshot.periodStart} – ${snapshot.periodEnd} · mã kiểm tra ${snapshot.checksum.slice(0, 16)}`;
  const filename = `bao-cao-chot-${asciiFilename(snapshot.title)}`;

  if (format === "pdf") {
    return pdfResponse(snapshot.title.toUpperCase(), subtitle, snapshot, `${filename}.pdf`);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CQ TNTT Manager";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Báo cáo đã chốt", { views: [{ state: "frozen", ySplit: 3 }] });
  sheet.addRow([snapshot.title.toUpperCase()]);
  sheet.mergeCells(1, 1, 1, Math.max(snapshot.headers.length, 1));
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FFF28C5B" } };
  sheet.addRow([subtitle]);
  sheet.mergeCells(2, 1, 2, Math.max(snapshot.headers.length, 1));
  sheet.addRow(snapshot.headers);
  for (const row of snapshot.rows) sheet.addRow(row);
  sheet.getRow(3).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF28C5B" } };
  sheet.columns.forEach((column, index) => {
    column.width = index === 0 ? 24 : 18;
  });
  return excelResponse(await workbook.xlsx.writeBuffer(), `${filename}.xlsx`);
}
