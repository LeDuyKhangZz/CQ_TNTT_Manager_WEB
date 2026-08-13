// Sinh + kiểm bảng màu ngành TNTT theo OKLCH, kiểm contrast WCAG 2.1.
// Mục tiêu: mọi cặp màu dùng làm CHỮ phải >= 4.5:1; viền/nền trang trí >= 3:1.

/* ---------- sRGB <-> OKLab/OKLCH ---------- */
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [r, g, bl];
}

function inGamut([r, g, b]) {
  return [r, g, b].every((v) => v >= -0.0005 && v <= 1.0005);
}

/** Giảm chroma cho tới khi màu nằm trong sRGB (gamut clip theo chroma, giữ hue + lightness). */
function oklchToHex(L, C, h) {
  let c = C;
  for (let i = 0; i < 200; i += 1) {
    const rgb = oklchToRgb(L, c, h);
    if (inGamut(rgb)) return rgbToHex(rgb);
    c -= C / 200;
    if (c < 0) c = 0;
  }
  return rgbToHex(oklchToRgb(L, 0, h));
}

function rgbToHex([r, g, b]) {
  const to255 = (v) => Math.max(0, Math.min(255, Math.round(linearToSrgb(Math.max(0, Math.min(1, v))) * 255)));
  return `#${[to255(r), to255(g), to255(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

/* ---------- WCAG contrast ---------- */
function hexToRgb255(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function relLum(hex) {
  const [r, g, b] = hexToRgb255(hex).map((v) => srgbToLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const l1 = relLum(a), l2 = relLum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
const r2 = (n) => Math.round(n * 100) / 100;

/* ---------- Solver ---------- */
/** L SÁNG NHẤT (quét từ sáng xuống tối, dừng ngay lần đầu đạt) sao cho contrast(hex, ref) >= target. */
function solveL(hue, chroma, ref, target, { lo = 0.12, hi = 0.98 } = {}) {
  for (let L = hi; L >= lo; L -= 0.002) {
    const hex = oklchToHex(L, chroma, hue);
    const c = contrast(hex, ref);
    if (c >= target) return { L: Math.round(L * 1000) / 1000, hex, contrast: r2(c) };
  }
  return null;
}

/** L TỐI NHẤT (quét từ tối lên sáng, dừng ngay lần đầu đạt) — dùng khi cần nền SÁNG mang chữ đậm. */
function solveLLight(hue, chroma, ref, target, { lo = 0.4, hi = 0.99 } = {}) {
  for (let L = lo; L <= hi; L += 0.002) {
    const hex = oklchToHex(L, chroma, hue);
    const c = contrast(hex, ref);
    if (c >= target) return { L: Math.round(L * 1000) / 1000, hex, contrast: r2(c) };
  }
  return null;
}

/* ---------- Định nghĩa ngành ---------- */
// hue/chroma suy ra từ màu khăn chính thức (Điều 63 Nội quy TNTT VN — chỉ có TÊN màu, không có HEX).
// A = "Truyền thống đậm" (bám sát màu khăn, chroma cao)
// B = "Ấm dịu" (giảm chroma ~30%, lệch hue về phía ấm để hòa với nền kem của app)
const SECTORS = [
  { key: "chien-con",  name: "Chiên Con",  scarf: "Hồng",         second: "Đỏ",   A: { h: 358, c: 0.16 }, B: { h: 5,   c: 0.115 } },
  { key: "au-nhi",     name: "Ấu Nhi",     scarf: "Xanh lá mạ",   second: "Vàng", A: { h: 142, c: 0.145 }, B: { h: 138, c: 0.105 } },
  { key: "thieu-nhi",  name: "Thiếu Nhi",  scarf: "Xanh dương",   second: "Vàng", A: { h: 250, c: 0.155 }, B: { h: 245, c: 0.11 } },
  { key: "nghia-si",   name: "Nghĩa Sĩ",   scarf: "Vàng nghệ",    second: "Đỏ",   A: { h: 75,  c: 0.155 }, B: { h: 70,  c: 0.12 } },
  { key: "hiep-si",    name: "Hiệp Sĩ",    scarf: "Nâu đất",      second: "Vàng", A: { h: 55,  c: 0.085 }, B: { h: 50,  c: 0.065 } },
  { key: "huynh-truong", name: "Huynh Trưởng / Dự Trưởng / Quản trị", scarf: "Đỏ", second: "Vàng", A: { h: 25, c: 0.17 }, B: { h: 28, c: 0.13 } },
];

const WHITE = "#FFFFFF";
const PAGE_BG = "#FFFBF7";      // nền trang trung tính ấm (đề xuất mới)
const INK = "#2E2A27";          // chữ chính

function buildRamp(hue, chroma, label) {
  // primary: sáng nhất mà chữ trắng vẫn >= 4.5:1
  const primary = solveL(hue, chroma, WHITE, 4.5);
  if (!primary) return null;
  const hover   = oklchToHex(primary.L - 0.045, chroma, hue);
  const active  = oklchToHex(primary.L - 0.085, chroma, hue);
  // subtle: nền nhạt cho badge / tab đang chọn / hàng được chọn
  const subtle  = oklchToHex(0.965, Math.min(chroma * 0.22, 0.035), hue);
  const subtleStrong = oklchToHex(0.93, Math.min(chroma * 0.3, 0.05), hue);
  // accentText: chữ màu ngành, phải >= 4.5:1 trên CẢ nền trắng lẫn nền subtle
  const t1 = solveL(hue, chroma, WHITE, 4.5);
  const t2 = solveL(hue, chroma, subtle, 4.5);
  const accentText = oklchToHex(Math.min(t1.L, t2.L), chroma, hue);
  // border: >= 3:1 với nền trang (viền/ranh giới không phải chữ)
  const border  = solveL(hue, Math.min(chroma * 0.5, 0.07), PAGE_BG, 3.0) ?? { hex: oklchToHex(0.8, 0.05, hue) };
  // focus ring: >= 3:1 với nền trang
  const ring    = solveL(hue, chroma, PAGE_BG, 3.0);
  // chart: >= 3:1 với nền trắng (đồ hoạ phi văn bản)
  const chart   = solveL(hue, chroma, WHITE, 3.0);

  // Biến thể "nền sáng + chữ đậm" — cần cho ngành có màu bản chất SÁNG (vàng nghệ),
  // vì nền vàng đủ đậm để mang chữ trắng thì đã hết là màu vàng.
  const primaryLight = solveLLight(hue, chroma, INK, 4.5);

  return {
    label,
    primaryLight: primaryLight ? primaryLight.hex : null,
    primaryLightContrast: primaryLight ? primaryLight.contrast : null,
    primary: primary.hex,
    primaryHover: hover,
    primaryActive: active,
    primarySubtle: subtle,
    primarySubtleStrong: subtleStrong,
    accentText,
    border: border.hex,
    ring: ring.hex,
    chart: chart.hex,
    checks: {
      "chữ trắng / primary": r2(contrast(WHITE, primary.hex)),
      "chữ trắng / hover": r2(contrast(WHITE, hover)),
      "chữ trắng / active": r2(contrast(WHITE, active)),
      "accentText / trắng": r2(contrast(accentText, WHITE)),
      "accentText / subtle": r2(contrast(accentText, subtle)),
      "INK / subtle": r2(contrast(INK, subtle)),
      "border / nền trang": r2(contrast(border.hex, PAGE_BG)),
      "ring / nền trang": r2(contrast(ring.hex, PAGE_BG)),
      "chart / trắng": r2(contrast(chart.hex, WHITE)),
    },
  };
}

console.log("=".repeat(100));
console.log("BẢNG MÀU NGÀNH — sinh bằng OKLCH, kiểm WCAG 2.1");
console.log(`Nền trang: ${PAGE_BG} · Chữ chính: ${INK} (contrast ${r2(contrast(INK, PAGE_BG))}:1)`);
console.log("=".repeat(100));

const out = {};
for (const s of SECTORS) {
  out[s.key] = {};
  for (const variant of ["A", "B"]) {
    const ramp = buildRamp(s[variant].h, s[variant].c, variant);
    out[s.key][variant] = ramp;
    console.log(`\n### ${s.name} — Phương án ${variant} (khăn: ${s.scarf}, phụ: ${s.second})`);
    console.log(`  primary        ${ramp.primary}   [nút đặc, chữ TRẮNG]`);
    console.log(`  primary-light  ${ramp.primaryLight}   [nút/nền SÁNG, chữ ĐẬM ${INK} — ${ramp.primaryLightContrast}:1]`);
    console.log(`  primary-hover  ${ramp.primaryHover}`);
    console.log(`  primary-active ${ramp.primaryActive}`);
    console.log(`  primary-subtle ${ramp.primarySubtle}   (đậm hơn: ${ramp.primarySubtleStrong})`);
    console.log(`  accent-text    ${ramp.accentText}`);
    console.log(`  border         ${ramp.border}`);
    console.log(`  focus-ring     ${ramp.ring}`);
    console.log(`  chart          ${ramp.chart}`);
    const bad = Object.entries(ramp.checks).filter(([k, v]) => (k.includes("border") || k.includes("ring") || k.includes("chart") ? v < 3 : v < 4.5));
    console.log(`  contrast: ${Object.entries(ramp.checks).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
    console.log(`  => ${bad.length === 0 ? "ĐẠT toàn bộ" : "TRƯỢT: " + bad.map(([k, v]) => `${k} (${v})`).join(", ")}`);
  }
}

/* ---------- Màu phụ (secondary) dùng chung ---------- */
console.log("\n" + "=".repeat(100));
console.log("MÀU PHỤ (thánh giá trên khăn) — dùng cho viền/điểm nhấn phụ, KHÔNG dùng làm nền nút chính");
const SECOND = {
  "Đỏ (phụ)":  { h: 25, c: 0.17 },
  "Vàng (phụ)": { h: 82, c: 0.16 },
};
for (const [name, v] of Object.entries(SECOND)) {
  const text = solveL(v.h, v.c, WHITE, 4.5);
  const solid = solveL(v.h, v.c, WHITE, 3.0);
  const tint = oklchToHex(0.955, Math.min(v.c * 0.25, 0.04), v.h);
  console.log(`  ${name}: chữ/viền đậm ${text.hex} (${text.contrast}:1 trên trắng) · khối đặc ${solid.hex} (${solid.contrast}:1) · nền nhạt ${tint}`);
}

/* ---------- Kiểm token hiện tại ---------- */
console.log("\n" + "=".repeat(100));
console.log("TOKEN HIỆN TẠI (globals.css) — kiểm lại 7 cặp mà audit nêu");
const CUR = [
  ["#FFFFFF", "#F28C5B", "chữ trắng / --primary (nút chính)", 4.5],
  ["#D99A2B", "#FFF7E3", "--warning / --warning-surface (badge, 'không có quyền')", 4.5],
  ["#4F9D76", "#EDF8F2", "--success / --success-surface", 4.5],
  ["#FFFFFF", "#D95C5C", "chữ trắng / --danger (nút nguy hiểm, badge chưa đọc)", 4.5],
  ["#D95C5C", "#FFF0F0", "--danger / --danger-surface (FormMessage lỗi)", 4.5],
  ["#756861", "#FFF9F4", "--text-muted / --background", 4.5],
  ["#3F342F", "#FFF9F4", "--text / --background", 4.5],
];
for (const [fg, bg, label, need] of CUR) {
  const c = r2(contrast(fg, bg));
  console.log(`  ${c >= need ? "ĐẠT " : "TRƯỢT"} ${String(c).padStart(5)}:1  ${label}`);
}

/* ---------- Đề xuất token trung tính + trạng thái mới ---------- */
console.log("\n" + "=".repeat(100));
console.log("TOKEN TRUNG TÍNH + TRẠNG THÁI ĐỀ XUẤT (nền/chữ/success/warning/danger/info)");
const NEUTRAL = [
  ["#2E2A27", PAGE_BG, "text chính / nền trang", 4.5],
  ["#2E2A27", "#FFFFFF", "text chính / thẻ trắng", 4.5],
  ["#5C534D", PAGE_BG, "text phụ / nền trang", 4.5],
  ["#5C534D", "#FFFFFF", "text phụ / thẻ trắng", 4.5],
  ["#6B625B", "#FFFFFF", "text phụ nhạt hơn / thẻ trắng", 4.5],
  ["#EDE4DC", PAGE_BG, "viền trang trí (divider) — KHÔNG cần 3:1", 1.0],
  ["#9A8D84", "#FFFFFF", "viền ô nhập (field border, cần >=3:1)", 3.0],
  ["#8C7F76", PAGE_BG, "viền ô nhập / nền trang (cần >=3:1)", 3.0],
  ["#1E7A50", "#FFFFFF", "success text / trắng", 4.5],
  ["#1E7A50", "#E8F6EF", "success text / success-subtle", 4.5],
  ["#FFFFFF", "#1E7A50", "chữ trắng / success đặc", 4.5],
  ["#8A5A00", "#FFFFFF", "warning text / trắng", 4.5],
  ["#8A5A00", "#FFF4DC", "warning text / warning-subtle", 4.5],
  ["#B3261E", "#FFFFFF", "danger text / trắng", 4.5],
  ["#B3261E", "#FDECEA", "danger text / danger-subtle", 4.5],
  ["#FFFFFF", "#B3261E", "chữ trắng / danger đặc", 4.5],
  ["#1F5E9E", "#FFFFFF", "info text / trắng", 4.5],
  ["#1F5E9E", "#E8F1FA", "info text / info-subtle", 4.5],
];
for (const [fg, bg, label, need] of NEUTRAL) {
  const c = r2(contrast(fg, bg));
  console.log(`  ${c >= need ? "ĐẠT " : "TRƯỢT"} ${String(c).padStart(5)}:1  ${label} (cần ${need})`);
}
