/**
 * Perf smoke (docs/07 §12) — LOCAL ONLY.
 *
 * Nâng dữ liệu lên 900 thiếu nhi trải trên 19 lớp rồi đo các truy vấn mà trang
 * /students, /classes và /classes/[id] thực sự chạy. Đo bằng JWT thật để RLS
 * nằm trong phép đo, không dùng service role cho phần đo.
 *
 *   npm run perf:smoke
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
const TARGET_STUDENTS = Number(process.env.PERF_TARGET_STUDENTS ?? 900);
const ATTENDANCE_CLASS_SIZE = Number(process.env.PERF_ATTENDANCE_CLASS_SIZE ?? 60);
const ATTENDANCE_SESSION_COUNT = Number(process.env.PERF_ATTENDANCE_SESSION_COUNT ?? 30);

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL, ANON_KEY và SUPABASE_SERVICE_ROLE_KEY là bắt buộc.");
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url)) {
  throw new Error(`Chỉ chạy perf smoke trên Supabase local. URL hiện tại: ${url}`);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function must(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Đặng", "Bùi"];
const DEM = ["Thị", "Văn", "Gia", "Minh", "Ngọc", "Hữu", "Thanh", "Quốc"];
const TEN = ["An", "Bình", "Chi", "Dũng", "Hà", "Khoa", "Lan", "Mai", "Nam", "Phúc", "Quyên", "Sơn", "Trang", "Uyên", "Vy"];
const THANH = ["Giuse", "Maria", "Phêrô", "Anna", "Phaolô", "Têrêsa", "Gioan", "Cecilia"];

function syntheticName(index) {
  return `${HO[index % HO.length]} ${DEM[(index >> 2) % DEM.length]} ${TEN[(index * 7) % TEN.length]}`;
}

function sundayDates(startDate, count) {
  const first = new Date(`${startDate}T12:00:00Z`);
  first.setUTCDate(first.getUTCDate() + ((7 - first.getUTCDay()) % 7));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(first.getUTCDate() + index * 7);
    return date.toISOString().slice(0, 10);
  });
}

/** Đo một truy vấn, trả về ms và số dòng. */
async function measure(label, run, results) {
  const started = performance.now();
  const { data, error, count } = await run();
  const elapsed = performance.now() - started;
  if (error) throw new Error(`${label}: ${error.message}`);
  const rows = count ?? (Array.isArray(data) ? data.length : data ? 1 : 0);
  results.push({ label, ms: Math.round(elapsed), rows });
}

async function main() {
  const year = must(
    await admin.from("academic_years").select("id, start_date").eq("status", "current").single(),
    "Đọc năm học hiện hành",
  );
  const classes = must(
    await admin.from("classes").select("id, display_name").eq("academic_year_id", year.id),
    "Đọc lớp",
  );
  if (classes.length === 0) throw new Error("Chưa có lớp. Chạy `npm run seed:dev` trước.");

  const { count: before } = await admin.from("students").select("id", { count: "exact", head: true });
  const missing = Math.max(0, TARGET_STUDENTS - (before ?? 0));
  process.stdout.write(`Hiện có ${before} thiếu nhi; cần thêm ${missing} để đạt ${TARGET_STUDENTS}.\n`);

  // ── Bơm dữ liệu tổng hợp (service role: đây là seed, không phải phép đo) ──
  const CHUNK = 150;
  for (let created = 0; created < missing; created += CHUNK) {
    const size = Math.min(CHUNK, missing - created);
    const guardians = must(
      await admin
        .from("guardians")
        .insert(
          Array.from({ length: Math.ceil(size / 2) }, (_, index) => {
            const seq = created + index;
            return {
              full_name: `PH ${syntheticName(seq)}`,
              // 0999xxxxxx: dải test, không đụng số thật của phụ huynh.
              phone: `0999${String(100000 + seq).slice(-6)}`,
              status: "active",
            };
          }),
        )
        .select("id"),
      "Tạo phụ huynh tổng hợp",
    );

    const students = must(
      await admin
        .from("students")
        .insert(
          Array.from({ length: size }, (_, index) => {
            const seq = created + index;
            return {
              full_name: syntheticName(seq),
              saint_name: THANH[seq % THANH.length],
              gender: seq % 2 ? "female" : "male",
              date_of_birth: `${2012 + (seq % 8)}-${String((seq % 12) + 1).padStart(2, "0")}-${String((seq % 28) + 1).padStart(2, "0")}`,
              guardian_id: guardians[Math.floor(index / 2)].id,
              status: "active",
            };
          }),
        )
        .select("id"),
      "Tạo thiếu nhi tổng hợp",
    );

    must(
      await admin.from("enrollments").insert(
        students.map((student, index) => ({
          student_id: student.id,
          academic_year_id: year.id,
          // Trải đều 19 lớp, kể cả lớp Dự trưởng (D-9).
          class_id: classes[(created + index) % classes.length].id,
          status: "active",
          enrolled_on: year.start_date,
        })),
      ),
      "Ghi danh tổng hợp",
    );
  }

  // Attendance có đặc tính khác danh sách tổng: một lớp đông và nhiều buổi
  // tích lũy. Đảm bảo Ấu 1A có tối thiểu 60 em thay vì chỉ ~48 em khi chia đều
  // 900 em cho 19 lớp. Dữ liệu bù dùng riêng dải SĐT 0998xxxxxx.
  const attendanceClass = classes.find((item) => item.display_name === "Ấu 1A");
  if (!attendanceClass) throw new Error("Không tìm thấy lớp Ấu 1A để đo điểm danh.");
  const { count: attendanceSizeBefore, error: attendanceSizeError } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", year.id)
    .eq("class_id", attendanceClass.id)
    .eq("status", "active");
  if (attendanceSizeError) throw new Error(`Đếm sĩ số Ấu 1A: ${attendanceSizeError.message}`);

  const attendanceMissing = Math.max(0, ATTENDANCE_CLASS_SIZE - (attendanceSizeBefore ?? 0));
  if (attendanceMissing > 0) {
    const { count: priorPerfGuardians, error: guardianCountError } = await admin
      .from("guardians")
      .select("id", { count: "exact", head: true })
      .like("phone", "0998%");
    if (guardianCountError) throw new Error(`Đếm phụ huynh perf: ${guardianCountError.message}`);
    const sequenceStart = priorPerfGuardians ?? 0;
    const guardians = must(
      await admin
        .from("guardians")
        .insert(
          Array.from({ length: Math.ceil(attendanceMissing / 2) }, (_, index) => ({
            full_name: `PH điểm danh ${syntheticName(10_000 + sequenceStart + index)}`,
            phone: `0998${String(100000 + sequenceStart + index).slice(-6)}`,
            status: "active",
          })),
        )
        .select("id"),
      "Tạo phụ huynh bù cho lớp điểm danh",
    );
    const students = must(
      await admin
        .from("students")
        .insert(
          Array.from({ length: attendanceMissing }, (_, index) => ({
            full_name: syntheticName(20_000 + sequenceStart * 2 + index),
            saint_name: THANH[index % THANH.length],
            gender: index % 2 ? "female" : "male",
            date_of_birth: `2015-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`,
            guardian_id: guardians[Math.floor(index / 2)].id,
            status: "active",
          })),
        )
        .select("id"),
      "Tạo thiếu nhi bù cho lớp điểm danh",
    );
    must(
      await admin.from("enrollments").insert(
        students.map((student) => ({
          student_id: student.id,
          academic_year_id: year.id,
          class_id: attendanceClass.id,
          status: "active",
          enrolled_on: year.start_date,
        })),
      ),
      "Ghi danh thiếu nhi bù vào Ấu 1A",
    );
  }

  const { count: after } = await admin.from("students").select("id", { count: "exact", head: true });
  const { count: enrollments } = await admin
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", year.id);
  process.stdout.write(`Sau khi bơm: ${after} thiếu nhi, ${enrollments} ghi danh, ${classes.length} lớp.\n\n`);

  // ── Đo bằng JWT thật ─────────────────────────────────────────────────────
  async function sessionFor(username) {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const email = /^GLV/i.test(username)
      ? `${username.toLowerCase()}@staff.${domain}`
      : `${username.toLowerCase()}@accounts.${domain}`;
    const { error } = await client.auth.signInWithPassword({
      email,
      password: "123456",
    });
    if (error) throw new Error(`Đăng nhập ${username}: ${error.message}`);
    return client;
  }

  const globalWrite = await sessionFor("GLV901"); // Xứ đoàn trưởng
  const classTeacher = await sessionFor("GLV910"); // GLV lớp Ấu 1A

  // Dựng 30 buổi bằng chính JWT của GLV lớp. Service role chỉ dọn cờ lock nếu
  // script được chạy lại sau ba ngày; claim/seed/finalize vẫn qua RPC thật.
  const attendanceDates = sundayDates(year.start_date, ATTENDANCE_SESSION_COUNT);
  let measuredSessionId = null;
  let measuredStudentPayload = [];
  let measuredStaffPayload = [];
  for (let index = 0; index < attendanceDates.length; index += 1) {
    const attendanceDate = attendanceDates[index];
    const { data: existing } = await admin
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", attendanceClass.id)
      .eq("attendance_date", attendanceDate)
      .eq("meeting_type", "sunday")
      .maybeSingle();
    if (existing) {
      must(
        await admin
          .from("attendance_sessions")
          .update({ locked_at: null, unlocked_at: null, unlocked_by: null })
          .eq("id", existing.id),
        "Mở lại session perf cũ",
      );
    }

    const claim = must(
      await classTeacher
        .rpc("claim_attendance_session", {
          p_class_id: attendanceClass.id,
          p_date: attendanceDate,
          p_meeting_type: "sunday",
        })
        .single(),
      `Claim buổi perf ${attendanceDate}`,
    );

    if (index < attendanceDates.length - 1) {
      must(
        await classTeacher
          .rpc("save_and_finalize_attendance", {
            p_session_id: claim.out_session_id,
            p_students: [],
            p_staff: [],
            p_finalize: true,
          })
          .single(),
        `Chốt buổi perf ${attendanceDate}`,
      );
      continue;
    }

    measuredSessionId = claim.out_session_id;
    const studentRows = must(
      await classTeacher
        .from("student_attendance_records")
        // D-75: `note` is deliberately unavailable through the table grant.
        // The application reads it through the narrow staff-only RPC below.
        .select("id, enrollment_id, mass_status, catechism_status")
        .eq("attendance_session_id", measuredSessionId),
      "Đọc roster cho phép đo bulk save",
    );
    const studentNotes = must(
      await classTeacher.rpc("attendance_session_notes", {
        p_session_id: measuredSessionId,
      }),
      "Đọc ghi chú nội bộ cho phép đo bulk save",
    );
    const noteByRecord = new Map(
      studentNotes.map((row) => [row.record_id, row.note]),
    );
    const staffRows = must(
      await classTeacher
        .from("staff_attendance_records")
        .select("class_staff_assignment_id, status, note")
        .eq("attendance_session_id", measuredSessionId),
      "Đọc GLV cho phép đo bulk save",
    );
    measuredStudentPayload = studentRows.map((row) => ({
      enrollment_id: row.enrollment_id,
      mass_status: row.mass_status,
      catechism_status: row.catechism_status,
      note: noteByRecord.get(row.id) ?? null,
    }));
    measuredStaffPayload = staffRows.map((row) => ({
      class_staff_assignment_id: row.class_staff_assignment_id,
      status: row.status,
      note: row.note,
    }));
  }
  if (!measuredSessionId) throw new Error("Không tạo được session dùng để đo bulk save.");

  const biggest = must(
    await globalWrite
      .from("enrollments")
      .select("class_id")
      .eq("academic_year_id", year.id)
      .eq("status", "active"),
    "Đếm sĩ số",
  ).reduce((acc, row) => {
    acc.set(row.class_id, (acc.get(row.class_id) ?? 0) + 1);
    return acc;
  }, new Map());
  const [biggestClassId, biggestSize] = [...biggest.entries()].sort((a, b) => b[1] - a[1])[0];
  const biggestName = classes.find((item) => item.id === biggestClassId)?.display_name;

  const results = [];

  await measure(
    "/students — danh sách toàn xứ đoàn (global write) · cách CŨ, tải hết",
    () =>
      globalWrite
        .from("students")
        .select("id, student_code, saint_name, full_name, status, hardship_flag, guardians(full_name, phone)")
        .order("full_name"),
    results,
  );

  // ── M03-B / TB-F03 ────────────────────────────────────────────────────────
  // `04_TO_BE_FLOWS.md` đòi đo lại sau khi thêm join `enrollments`+`classes`:
  // *"nút thắt là cách đánh giá RLS chứ không phải index"* (bài học
  // `20260721000200`). Bốn phép đo dưới đây là **đúng bốn truy vấn** mà trang
  // `/students` và ô chọn em của `/classes/[id]` thật sự chạy sau M03-B.
  const STUDENT_PAGE_SIZE = 20;

  await measure(
    "/students — đếm tổng để phân trang (student_directory, count exact)",
    () =>
      globalWrite
        .from("student_directory")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    results,
  );

  await measure(
    `/students — MỘT trang ${STUDENT_PAGE_SIZE} em kèm lớp và ngành (student_directory)`,
    () =>
      globalWrite
        .from("student_directory")
        .select(
          "id, student_code, saint_name, full_name, status, hardship_flag, guardian_name, guardian_phone, class_name, sector_code, sector_name",
        )
        .eq("status", "active")
        .order("full_name", { ascending: true })
        .range(0, STUDENT_PAGE_SIZE - 1),
    results,
  );

  await measure(
    "/students — tìm KHÔNG DẤU trên search_name (D-126)",
    () =>
      globalWrite
        .from("student_directory")
        .select("id, student_code, full_name, class_name")
        .or("search_name.ilike.*nguyen*,student_code.ilike.*nguyen*")
        .order("full_name", { ascending: true })
        .range(0, STUDENT_PAGE_SIZE - 1),
    results,
  );

  await measure(
    "TB-F13 — dò trùng theo tên đã bỏ dấu (chỉ mục students_search_name_idx)",
    () =>
      globalWrite
        .from("student_directory")
        .select("id, student_code, full_name, date_of_birth, guardian_phone, class_name")
        .eq("search_name", "nguyen thi an")
        .limit(25),
    results,
  );

  await measure(
    "/classes — 19 thẻ lớp kèm đội ngũ và sĩ số",
    () =>
      globalWrite
        .from("classes")
        .select(
          "id, display_name, section_code, class_kind, status, grade_levels(sort_order, sectors(id, name, short_name, sort_order)), class_staff_assignments(capacity, is_active, staff_profiles(full_name, saint_name)), enrollments(status)",
        )
        .eq("academic_year_id", year.id)
        .order("display_name"),
    results,
  );

  await measure(
    `/classes/[id] — roster lớp đông nhất (${biggestName}, ${biggestSize} em)`,
    () =>
      globalWrite
        .from("classes")
        .select(
          "id, display_name, class_kind, academic_year_id, academic_years(code), grade_levels(sectors(name)), class_staff_assignments(id, capacity, starts_on, is_active, staff_profiles(full_name, saint_name)), enrollments(id, status, students(id, student_code, saint_name, full_name))",
        )
        .eq("id", biggestClassId)
        .maybeSingle(),
    results,
  );

  await measure(
    "/classes/[id] — danh sách em chưa ghi danh · cách CŨ, kéo cả bảng",
    () =>
      globalWrite
        .from("students")
        .select("id, student_code, saint_name, full_name")
        .eq("status", "active")
        .order("full_name"),
    results,
  );

  await measure(
    "/classes/[id] — danh sách em chưa ghi danh · cách MỚI (BR-M03-N20, cắt 50)",
    () =>
      globalWrite
        .from("student_directory")
        .select("id, student_code, saint_name, full_name")
        .eq("status", "active")
        .order("full_name")
        .limit(50),
    results,
  );

  await measure(
    "Xuất báo cáo ngành Ấu — student + ghi danh + lớp",
    () =>
      globalWrite
        .from("enrollments")
        .select("id, status, classes!inner(display_name, grade_levels!inner(sectors!inner(code))), students(student_code, full_name, date_of_birth)")
        .eq("academic_year_id", year.id)
        .eq("classes.grade_levels.sectors.code", "AU_NHI"),
    results,
  );

  await measure(
    "GLV lớp Ấu 1A — danh sách students thấy được (RLS lọc)",
    () => classTeacher.from("students").select("id, full_name", { count: "exact" }),
    results,
  );

  await measure(
    `Attendance — chốt ${measuredStudentPayload.length} em bằng một RPC`,
    () =>
      classTeacher
        .rpc("save_and_finalize_attendance", {
          p_session_id: measuredSessionId,
          p_students: measuredStudentPayload,
          p_staff: measuredStaffPayload,
          p_finalize: true,
        })
        .single(),
    results,
  );

  await measure(
    `Attendance — danh sách 24/${ATTENDANCE_SESSION_COUNT} buổi kèm records`,
    () =>
      classTeacher
        .from("attendance_sessions")
        .select(
          "id, class_id, attendance_date, meeting_type, status, finalized_at, locked_at, classes(display_name), profiles!attendance_sessions_editing_by_fkey(display_name), student_attendance_records(mass_status, catechism_status)",
        )
        .eq("class_id", attendanceClass.id)
        .order("attendance_date", { ascending: false })
        .limit(24),
    results,
  );

  await measure(
    `Attendance — tải roster buổi ${measuredStudentPayload.length} em`,
    () =>
      classTeacher
        .from("student_attendance_records")
        .select("id, enrollment_id, student_id, mass_status, catechism_status, students(saint_name, full_name)")
        .eq("attendance_session_id", measuredSessionId),
    results,
  );

  await measure(
    `Attendance — tải ghi chú nội bộ buổi ${measuredStudentPayload.length} em`,
    () =>
      classTeacher.rpc("attendance_session_notes", {
        p_session_id: measuredSessionId,
      }),
    results,
  );

  await measure(
    `Attendance — tổng hợp lớp qua ${ATTENDANCE_SESSION_COUNT} buổi`,
    () =>
      classTeacher
        .from("v_class_attendance_summary")
        .select("*")
        .eq("class_id", attendanceClass.id),
    results,
  );

  // ── Phase 5/6: dashboard, báo cáo, thông báo ─────────────────────────────
  // Ba nhóm này gộp toàn xứ đoàn trong một truy vấn nên chúng mới là chỗ 900 em
  // gây đau, chứ không phải danh sách lớp. P7-T3 thêm vào đây để có số thật.

  await measure(
    "/dashboard — KPI tổng hợp toàn xứ đoàn",
    () =>
      globalWrite
        .from("v_dashboard_summary")
        .select("*")
        .eq("academic_year_id", year.id)
        .maybeSingle(),
    results,
  );

  await measure(
    "/dashboard — 10 em cần lưu ý (chuỗi vắng + tỷ lệ)",
    () =>
      globalWrite
        .from("v_students_at_risk")
        .select("*")
        .eq("academic_year_id", year.id)
        .limit(10),
    results,
  );

  await measure(
    "/dashboard — hồ sơ còn thiếu thông tin (đếm toàn bộ)",
    () =>
      globalWrite
        .from("v_incomplete_student_profiles")
        .select("student_id", { count: "exact", head: true }),
    results,
  );

  await measure(
    "/reports — chuyên cần cả năm học, mọi lớp",
    () =>
      globalWrite.rpc("report_attendance_rows", {
        p_academic_year_id: year.id,
        p_from: year.start_date,
        p_to: attendanceDates[attendanceDates.length - 1],
      }),
    results,
  );

  await measure(
    "/reports — kết quả học tập cả năm học, mọi lớp",
    () => globalWrite.rpc("report_results_rows", { p_academic_year_id: year.id }),
    results,
  );

  await measure(
    "Thông báo — publish toàn xứ đoàn (materialize người nhận)",
    () =>
      globalWrite.rpc("publish_notification", {
        p_title: "Perf smoke — thông báo toàn xứ đoàn",
        p_content: "Bản ghi do perf:smoke tạo, chỉ tồn tại trên DB local.",
        p_target_type: "all",
      }),
    results,
  );

  await measure(
    "Thông báo — badge chưa đọc ở header (mọi route đều chạy)",
    () =>
      globalWrite
        .from("notification_recipients")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    results,
  );

  const width = Math.max(...results.map((item) => item.label.length));
  process.stdout.write("Phép đo (JWT thật, Supabase local):\n");
  for (const item of results) {
    process.stdout.write(
      `  ${item.label.padEnd(width)}  ${String(item.ms).padStart(5)} ms  ${String(item.rows).padStart(4)} dòng\n`,
    );
  }
}

await main();
