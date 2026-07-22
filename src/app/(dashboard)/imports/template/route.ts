import { NextResponse } from "next/server";
import { buildTemplateWorkbook, TEMPLATE_FILENAME } from "@/features/imports/template";
import { requireImportAccess } from "@/features/imports/server/permissions";

export async function GET() {
  // Same guard as the import page: the template is staff tooling.
  await requireImportAccess();

  const buffer = await buildTemplateWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME}"`,
      "Cache-Control": "no-store",
    },
  });
}
