// P2-T4: the canonical import template we hand out.
//
// Columns follow the parish's own SYLL sheet so a class secretary can copy
// straight across, with one addition the SYLL sheet lacks: Giới tính, which the
// students table requires and cannot be guessed (decided with the user).

import ExcelJS from "exceljs";

export const TEMPLATE_SHEET_NAME = "THIEU_NHI";
export const TEMPLATE_FILENAME = "Mau_import_thieu_nhi.xlsx";

interface TemplateColumn {
  header: string;
  width: number;
  required: boolean;
  note?: string;
}

export const TEMPLATE_COLUMNS: readonly TemplateColumn[] = [
  { header: "Tên Thánh", width: 18, required: false, note: 'Bỏ trống hoặc ghi "Chưa" nếu chưa Rửa Tội' },
  { header: "Họ và tên", width: 26, required: true },
  { header: "Giới tính", width: 10, required: true, note: "Nam hoặc Nữ" },
  { header: "Ngày tháng năm sinh", width: 16, required: true, note: "dd/mm/yyyy — ví dụ 02/01/2019" },
  { header: "Nơi sinh", width: 20, required: false },
  { header: "Ngày Rửa Tội", width: 16, required: false, note: 'dd/mm/yyyy, bỏ trống nếu chưa' },
  { header: "Nơi Rửa Tội", width: 22, required: false },
  { header: "Ngày Thêm Sức", width: 16, required: false },
  { header: "Nơi Thêm Sức", width: 22, required: false },
  { header: "Ngày bổn mạng", width: 14, required: false, note: "dd/mm — ví dụ 15/08" },
  { header: "Tên Thánh, họ và tên cha", width: 28, required: false },
  { header: "Số điện thoại cha", width: 16, required: false },
  { header: "Tên Thánh, họ và tên mẹ", width: 28, required: false },
  { header: "Số điện thoại mẹ", width: 16, required: false },
  { header: "Tên Thánh, họ và tên người giám hộ", width: 30, required: false },
  { header: "Số điện thoại người giám hộ", width: 18, required: false },
  { header: "Địa chỉ theo hộ khẩu", width: 30, required: false },
  { header: "Nơi ở hiện nay", width: 30, required: false },
  { header: "Thuộc giáo xứ", width: 22, required: false },
  { header: "Lớp học giáo lý hiện nay", width: 18, required: true, note: "Ví dụ: Ấu 1A, Thiếu 3" },
  { header: "Hoàn cảnh khó khăn", width: 16, required: false, note: 'Ghi "x" nếu có' },
  { header: "Dị ứng", width: 22, required: false },
  { header: "Sức khỏe lưu ý", width: 22, required: false },
  { header: "Ghi chú", width: 24, required: false },
];

/**
 * Build the template workbook. At least one guardian phone (cha, mẹ or người
 * giám hộ) is required even though no single phone column is — the importer
 * needs a phone to reuse/create the guardian record.
 */
export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CQ TNTT Manager";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(TEMPLATE_SHEET_NAME);
  sheet.columns = TEMPLATE_COLUMNS.map((column) => ({
    header: column.header,
    width: column.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 32;
  TEMPLATE_COLUMNS.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      // Required columns are highlighted so they are hard to miss.
      fgColor: { argb: column.required ? "FFFCD9B8" : "FFF1F1F1" },
    };
    if (column.note || column.required) {
      cell.note = [column.required ? "Bắt buộc." : "Không bắt buộc.", column.note]
        .filter(Boolean)
        .join(" ");
    }
  });
  headerRow.commit();

  // Deliberately no sample data row: a row with a plausible name, birth date
  // and class would be parsed as a real child and imported. Examples live in
  // the header cell notes instead.

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
