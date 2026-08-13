// Sinh TẦNG PASTEL cho từng ngành + kiểm chữ đậm trên nền pastel (WCAG AA).
import { readFileSync } from "node:fs";
const src = readFileSync("palette.mjs","utf8").split("/* ---------- Định nghĩa ngành ---------- */")[0];
const m = await import("data:text/javascript;base64," + Buffer.from(src + "\nexport {oklchToHex, contrast, solveL, solveLLight};").toString("base64"));
const { oklchToHex, contrast } = m;
const r2 = n => Math.round(n*100)/100;

const INK  = "#2E2A27";
const PAGE = "#FFFBF7";

// hue/chroma phương án A (đã chốt) + Nghĩa Sĩ N-3, Hiệp Sĩ đẩy sẫm
const S = [
  { n:"Chiên Con",    h:358, c:0.16,  primary:"#C34C7C", accent:"#BA4375" },
  { n:"Ấu Nhi",       h:142, c:0.145, primary:"#378630", accent:"#308029" },
  { n:"Thiếu Nhi",    h:250, c:0.155, primary:"#1079CD", accent:"#0072C5" },
  { n:"Nghĩa Sĩ",     h:75,  c:0.155, primary:"#C48401", accent:"#986500" },
  { n:"Hiệp Sĩ",      h:55,  c:0.085, primary:"#7A5136", accent:"#97633E" },
  { n:"Huynh Trưởng", h:25,  c:0.17,  primary:"#CE4846", accent:"#C5403E" },
];

console.log("=".repeat(104));
console.log("TẦNG PASTEL — nền mềm cho chip/thẻ/hàng chọn/minh hoạ. Chữ trên nền pastel phải >= 4,5:1");
console.log("=".repeat(104));
console.log("Ngành          | tint(0.965) | soft(0.925) | PASTEL(0.885) | pastel-deep(0.845) | INK/pastel | accent/pastel");
console.log("-".repeat(104));

let worstInk = 99, worstAccent = 99;
for (const s of S) {
  // chroma tăng dần khi càng sáng để pastel KHÔNG bị xám xịt
  const tint       = oklchToHex(0.965, Math.min(s.c*0.22, 0.035), s.h);
  const soft       = oklchToHex(0.925, Math.min(s.c*0.38, 0.058), s.h);
  const pastel     = oklchToHex(0.885, Math.min(s.c*0.55, 0.085), s.h);
  const pastelDeep = oklchToHex(0.845, Math.min(s.c*0.70, 0.105), s.h);

  const cInk       = r2(contrast(INK, pastel));
  const cInkDeep   = r2(contrast(INK, pastelDeep));
  const cAccent    = r2(contrast(s.accent, pastel));
  worstInk = Math.min(worstInk, cInk, cInkDeep);
  worstAccent = Math.min(worstAccent, cAccent);

  console.log(
    `${s.n.padEnd(14)} | ${tint}     | ${soft}     | ${pastel}       | ${pastelDeep}            | ` +
    `${String(cInk).padStart(5)} ${cInk>=4.5?"OK":"XX"}  | ${String(cAccent).padStart(5)} ${cAccent>=4.5?"OK":"XX"}`
  );
}
console.log("-".repeat(104));
console.log(`INK trên pastel: xấu nhất ${worstInk}:1  → ${worstInk>=4.5?"ĐẠT AA toàn bộ":"TRƯỢT"}`);
console.log(`accent-text trên pastel: xấu nhất ${worstAccent}:1  → ${worstAccent>=4.5?"ĐẠT AA toàn bộ":"TRƯỢT"}`);

console.log("\n" + "=".repeat(104));
console.log("VÌ SAO PASTEL KHÔNG THỂ LÀM NỀN NÚT CHÍNH — đo trực tiếp");
console.log("=".repeat(104));
for (const s of S) {
  const pastel = oklchToHex(0.885, Math.min(s.c*0.55, 0.085), s.h);
  console.log(`  ${s.n.padEnd(14)} chữ TRẮNG trên pastel ${pastel} = ${r2(contrast("#FFFFFF", pastel))}:1   (cần 4,5) -> TRƯỢT`);
}
console.log("\n=> Pastel dùng cho NỀN MỀM + chữ đậm. Nút chính vẫn dùng màu đặc phương án A.");

console.log("\n" + "=".repeat(104));
console.log("PHƯƠNG ÁN: muốn CHỮ MÀU NGÀNH trên nền pastel thì phải đậm tới đâu?");
console.log("=".repeat(104));
for (const s of S) {
  const pastel = oklchToHex(0.885, Math.min(s.c*0.55, 0.085), s.h);
  let found = null;
  for (let L = 0.70; L >= 0.15; L -= 0.002) {
    const hex = oklchToHex(L, s.c, s.h);
    if (contrast(hex, pastel) >= 4.5) { found = hex; break; }
  }
  console.log(`  ${s.n.padEnd(14)} nền ${pastel} -> chữ ngành đậm ${found} = ${r2(contrast(found, pastel))}:1 OK` +
              `   (so với INK ${INK} = ${r2(contrast(INK, pastel))}:1)`);
}
