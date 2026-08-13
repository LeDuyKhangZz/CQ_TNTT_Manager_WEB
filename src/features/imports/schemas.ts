import { z } from "zod";

/**
 * Ranh giới trắng cho năm thao tác của luồng nhập Excel — M12-A, hạng mục 9 của
 * `07_IMPLEMENTATION_IMPACT` §1 (biên bản audit trừ điểm C6 vì **không có Zod ở
 * boundary**: `setRowAction`, `setRowGender`, `commitBatch`, `deleteBatch` nhận
 * chuỗi thô, chỉ được kiểm bằng vài câu `if` ở tầng biểu mẫu).
 *
 * 🔴 Vì sao điều đó quan trọng hơn vẻ ngoài của nó: `import_rows.id` và
 * `import_batches.id` đi thẳng vào `.eq("id", …)` và vào tham số của RPC. Một
 * chuỗi rỗng hay một chuỗi không phải UUID làm PostgREST trả lỗi cú pháp kiểu dữ
 * liệu, mà `fail()` của module lại gói **mọi** lỗi lạ thành *"Không xử lý được
 * file import"* — người dùng đọc xong không biết mình vừa làm gì sai. Chặn ở
 * biên cho ra đúng câu tiếng Việt, và giữ đúng `AGENTS` §7 ("Zod ở boundary").
 *
 * **M12-B** gộp `rowGenderSchema` và `rowActionSchema` của đợt A vào
 * {@link rowEditsSchema}: từ TO-BE 4, cả trang dòng đi lên trong **một** lượt
 * gửi nên biên cũng phải là một. Hai schema cũ bị xoá thay vì để lại — chúng chỉ
 * phục vụ hai Server Action đã gỡ, mà một Server Action còn export vẫn là một
 * đầu vào còn gọi được dù không màn hình nào dẫn tới nó nữa.
 */

const rowIdSchema = z.string().uuid("Dòng nhập không hợp lệ. Hãy tải lại trang.");
const batchIdSchema = z.string().uuid("Lần nhập không hợp lệ. Hãy tải lại trang.");

export const batchRefSchema = z.object({ batchId: batchIdSchema });

/**
 * Biên của thao tác sửa **hàng loạt** — M12-B, TO-BE 4 (`z.array(…).max(200)`).
 *
 * 🔴 Trần 200 dòng không phải con số trang trí. Biểu mẫu gửi lên là **toàn bộ
 * một trang** (50 dòng theo `BATCH_ROW_PAGE_SIZE`), nên bất cứ thứ gì lớn hơn
 * nhiều lần con số ấy đều không đến từ màn hình thật — mà mỗi dòng lại là một
 * lệnh `update` xuống cơ sở dữ liệu. Chặn ở biên rẻ hơn nhiều so với phát hiện
 * sau khi đã ghi được một nửa.
 */
export const rowEditsSchema = z.object({
  batchId: batchIdSchema,
  /** Có giá trị = người dùng bấm "Xác nhận dòng này" của đúng một dòng. */
  confirmRowId: rowIdSchema.nullable(),
  /** Đường dự phòng khi chưa có JS của nút "Áp dụng Nam/Nữ cho dòng đang chọn". */
  bulkGender: z
    .enum(["male", "female", "other"], {
      errorMap: () => ({ message: "Hãy chọn Nam hoặc Nữ." }),
    })
    .nullable(),
  entries: z
    .array(
      z.object({
        rowId: rowIdSchema,
        gender: z
          .enum(["male", "female", "other"], {
            errorMap: () => ({ message: "Hãy chọn Nam hoặc Nữ cho dòng này." }),
          })
          .nullable(),
        action: z
          .enum(["create", "merge", "skip"], {
            errorMap: () => ({ message: "Hãy chọn cách xử lý hợp lệ cho dòng này." }),
          })
          .nullable(),
        picked: z.boolean(),
      }),
    )
    .max(200, "Một lần lưu tối đa 200 dòng. Hãy lưu theo từng trang."),
});

export type BatchRefInput = z.infer<typeof batchRefSchema>;
export type RowEditsInput = z.infer<typeof rowEditsSchema>;
