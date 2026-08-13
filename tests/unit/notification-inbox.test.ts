// @vitest-environment node
/**
 * M10-A — hai lỗi CRITICAL của module thông báo.
 *
 * 🔴 **Vì sao có một bài quét MÃ NGUỒN ở đây.** Lỗi gốc là một dòng `.eq(…)`
 * **vắng mặt**. Không cửa kiểm nào bắt được sự vắng mặt ấy: mã vẫn hợp lệ về
 * kiểu, lint xanh, build xanh, và hàng rào của cơ sở dữ liệu **cố ý** cho 6 vai
 * trò cấp xứ đoàn đọc mọi dòng nên pgTAP chạy bằng phiên của họ cũng… xanh.
 * Bài kiểm duy nhất đúng tầng là: *"mọi truy vấn chạm `notification_recipients`
 * phải lọc theo `profile_id`"*. Cùng khuôn với `use-server-exports.test.ts` —
 * một cửa chặn hẹp chạy trong vài mili giây vẫn hơn hẳn không có cửa nào.
 *
 * Bằng chứng **dương tính** (chạy thật bằng JWT của Thư ký) nằm ở
 * `tests/integration/m10-inbox-scope.test.ts`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INBOX_PAGE_SIZE,
  INBOX_QUERY_OWNER_COLUMN,
  toInboxNotifications,
  type InboxRow,
} from "@/features/notifications/inbox";

const SRC = path.resolve(process.cwd(), "src");

/**
 * 🔴 **Hai bảng, không phải một — và bản nháp đầu của bài này chỉ canh một.**
 *
 * Cả `notification_recipients` lẫn `notifications` đều có policy chứa nhánh
 * `or app.can_global_read()`, nên **cả hai** đều là bẫy. Bản đầu chỉ quét bảng
 * người-nhận, và đúng lúc ấy mục "Tôi đã gửi" của đợt C ra đời với một truy vấn
 * `notifications` **không** lọc tác giả — cùng một lỗi, ở bảng bài kiểm không
 * nhìn tới. Cột phải lọc khác nhau ở hai bảng, nên bảng dưới đây ghi từng cặp.
 */
const OWNER_SCOPED_TABLES = [
  { table: "notification_recipients", column: "profile_id" },
  { table: "notifications", column: "author_profile_id" },
] as const;
const RECIPIENTS_TABLE = "notification_recipients";

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) found.push(full);
  }
  return found;
}

/**
 * Cắt lấy chuỗi lời gọi bắt đầu từ `.from("<bảng>")` cho tới dấu chấm phẩy kết
 * thúc câu lệnh. Đủ để thấy `.eq("<cột>", …)` có nằm trong cùng chuỗi ấy không.
 */
function queryChains(source: string, table: string): string[] {
  const chains: string[] = [];
  const marker = `.from("${table}")`;
  let index = source.indexOf(marker);
  while (index !== -1) {
    const end = source.indexOf(";", index);
    chains.push(source.slice(index, end === -1 ? source.length : end));
    index = source.indexOf(marker, index + marker.length);
  }
  return chains;
}

const SOURCES = walk(SRC).map((file) => ({ file, source: readFileSync(file, "utf8") }));

describe.each(OWNER_SCOPED_TABLES)(
  "BR-M10-20 — truy vấn $table phải lọc tường minh theo $column",
  ({ table, column }) => {
    const touching = SOURCES.filter((entry) => entry.source.includes(`.from("${table}")`));

    it("tìm được đúng nhóm file chạm bảng này", () => {
      // 0 file nghĩa là cách nhận diện đã hỏng và cả nhóm bài này xanh giả.
      expect(touching.length).toBeGreaterThan(0);
    });

    it.each(
      touching.flatMap((entry) =>
        queryChains(entry.source, table).map((chain, order) => ({
          name: `${path.relative(SRC, entry.file)} · truy vấn #${order + 1}`,
          chain,
        })),
      ),
    )("$name lọc tường minh", ({ chain }) => {
      // **Ngoại lệ đúng một loại: truy vấn ghim vào một khoá chính.**
      // `.eq("id", …)` trả về **tối đa một dòng đã biết trước id**, nên nó
      // không phải một danh sách "của tôi" và không có gì để rò rỉ — hàng rào
      // đọc vẫn quyết định dòng ấy có tới tay người gọi hay không. Ca thật
      // trong repo: đọc lại `recipient_count` của chính thông báo vừa gửi.
      //
      // Ngoại lệ hẹp đúng bằng chữ `.eq("id"`; mọi truy vấn **nhiều dòng** vẫn
      // phải nêu tên chủ sở hữu.
      if (chain.includes('.eq("id"')) return;
      expect(chain).toContain(`.eq("${column}"`);
    });
  },
);

it("cột lọc của bảng người-nhận vẫn đúng tên hằng số dùng chung", () => {
  expect(INBOX_QUERY_OWNER_COLUMN).toBe(
    OWNER_SCOPED_TABLES.find((entry) => entry.table === RECIPIENTS_TABLE)?.column,
  );
});

describe("toInboxNotifications", () => {
  function row(id: string, readAt: string | null = null): InboxRow {
    return {
      notification_id: id,
      read_at: readAt,
      notification_retracted_at: null,
      notifications: {
        id,
        title: `Thông báo ${id}`,
        content: "Nội dung",
        published_at: "2026-08-09T01:00:00.000Z",
        link_path: null,
        target_type: "class",
      },
    };
  }

  /** M10-C — bản đã thu hồi tới đây với phần nhúng RỖNG (hàng rào đọc giấu nó). */
  function retractedRow(id: string): InboxRow {
    return {
      notification_id: id,
      read_at: null,
      notification_retracted_at: "2026-08-10T03:00:00.000Z",
      notifications: null,
    };
  }

  it("giữ nguyên thứ tự và lấy read_at của chính dòng đó", () => {
    const inbox = toInboxNotifications([row("a", "2026-08-09T02:00:00.000Z"), row("b")]);
    expect(inbox.map((item) => item.id)).toEqual(["a", "b"]);
    expect(inbox[0].readAt).toBe("2026-08-09T02:00:00.000Z");
    expect(inbox[1].readAt).toBeNull();
  });

  it("AC-01-02 — một thông báo chỉ hiện đúng một dòng", () => {
    // Triệu chứng cũ: thông báo gửi 200 người hiện 200 lần trong hộp thư của
    // vai trò cấp xứ đoàn, và `key` của React trùng nhau 200 lần.
    expect(toInboxNotifications([row("a"), row("a"), row("a")])).toHaveLength(1);
  });

  it("bỏ dòng có bản ghi thông báo rỗng thay vì vẽ thẻ trắng", () => {
    const orphan: InboxRow = {
      notification_id: "mất-tích",
      read_at: null,
      notification_retracted_at: null,
      notifications: null,
    };
    expect(toInboxNotifications([orphan, row("a")])).toHaveLength(1);
  });

  it("D-166 — bản đã thu hồi Ở LẠI hộp thư, kèm nhãn thay cho nội dung", () => {
    const [item] = toInboxNotifications([retractedRow("r-1")]);
    // Người nhận CÓ THỂ đã đọc nội dung sai rồi; cho nó biến mất không dấu vết
    // là để họ tưởng mình nhớ nhầm, hoặc cứ làm theo một thông báo đã bị huỷ.
    expect(item.retracted).toBe(true);
    expect(item.id).toBe("r-1");
    expect(item.title).toMatch(/đã được thu hồi/i);
    expect(item.targetType).toBeNull();
    expect(item.linkPath).toBeNull();
  });

  it("phân biệt được 'đã thu hồi' với 'lỗi dữ liệu' — hai dòng cùng nhúng rỗng", () => {
    // Cả hai dòng đều có `notifications: null`. Chỉ cờ ở dòng người-nhận nói
    // được đâu là bản thu hồi; đoán từ phần nhúng rỗng là đoán sai một trong hai.
    const orphan: InboxRow = {
      notification_id: "mất-tích",
      read_at: null,
      notification_retracted_at: null,
      notifications: null,
    };
    const inbox = toInboxNotifications([orphan, retractedRow("r-1")]);
    expect(inbox).toHaveLength(1);
    expect(inbox[0].id).toBe("r-1");
  });

  it("hộp thư rỗng trả mảng rỗng", () => {
    expect(toInboxNotifications([])).toEqual([]);
  });

  it("cỡ trang là một con số dương", () => {
    expect(INBOX_PAGE_SIZE).toBeGreaterThan(0);
  });
});
