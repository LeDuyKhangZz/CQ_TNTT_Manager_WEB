import { readFileSync } from "node:fs";
const base = readFileSync("palette.mjs","utf8").split("/* ---------- Định nghĩa ngành ---------- */")[0];
const { contrast } = await import("data:text/javascript;base64," + Buffer.from(base+"\nexport {contrast};").toString("base64"));
const r2 = n=>Math.round(n*100)/100, W="#FFFFFF";
const T = [
  ["Chiên Con","#BA4375","#A52F63","#FFEEF3","#FFC8D9"],
  ["Ấu Nhi","#308029","#1D7016","#E8F9E6","#BCE7B7"],
  ["Thiếu Nhi","#0072C5","#0061A9","#EBF5FF","#BDDDFF"],
  ["Nghĩa Sĩ","#986500","#825600","#FFF1DF","#F8D2A1"],
  ["Hiệp Sĩ","#97633E","#85522E","#FCF1EA","#EED3C3"],
  ["Huynh Trưởng","#C5403E","#B02A2D","#FFEFEE","#FFCAC5"],
];
console.log("accent-text & accent-strong — kiểm trên trắng / tint / pastel");
console.log("=".repeat(92));
let fail=0;
for (const [n,at,as,tint,pastel] of T) {
  const a=r2(contrast(at,W)), b=r2(contrast(at,tint)), c=r2(contrast(as,pastel)), d=r2(contrast(as,W));
  const ok=a>=4.5&&b>=4.5&&c>=4.5&&d>=4.5; if(!ok) fail++;
  console.log(`${n.padEnd(13)} accent ${at}: trắng ${String(a).padStart(5)} · tint ${String(b).padStart(5)}` +
              ` | strong ${as}: trắng ${String(d).padStart(5)} · pastel ${String(c).padStart(5)}   ${ok?"ĐẠT":"** TRƯỢT **"}`);
}
console.log(`\n>>> ${fail===0?"TOÀN BỘ ĐẠT":fail+" TRƯỢT"}`);
