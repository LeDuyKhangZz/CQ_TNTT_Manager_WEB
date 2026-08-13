// BẢNG MÀU CUỐI ĐÃ DUYỆT — tính hover/active TỪ HEX THẬT của primary, rồi kiểm AA.
// Nền tối (chữ trắng)  -> hover/active TỐI dần.
// Nền sáng (chữ đậm)   -> hover/active SÁNG dần (tối đi sẽ mất tương phản với chữ đậm).
import { readFileSync } from "node:fs";
const base = readFileSync("palette.mjs","utf8").split("/* ---------- Định nghĩa ngành ---------- */")[0];
const { oklchToHex, contrast } = await import("data:text/javascript;base64," +
  Buffer.from(base + "\nexport {oklchToHex, contrast};").toString("base64"));

const r2 = n => Math.round(n*100)/100;
const INK = "#2E2A27", W = "#FFFFFF", PAGE = "#FFFBF7";

/* hex -> OKLCH (để dịch chuyển L mà giữ nguyên hue/chroma) */
const s2l = c => (c<=0.04045 ? c/12.92 : ((c+0.055)/1.055)**2.4);
function hexToOklch(hex){
  const [r,g,b] = [0,2,4].map(i=>s2l(parseInt(hex.slice(1+i,3+i),16)/255));
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
  const m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
  const s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  const L=0.2104542553*l+0.7936177850*m-0.0040720468*s;
  const A=1.9779984951*l-2.4285922050*m+0.4505937099*s;
  const B=0.0259040371*l+0.7827717662*m-0.8086757660*s;
  return { L, C: Math.hypot(A,B), h: (Math.atan2(B,A)*180/Math.PI+360)%360 };
}

const SECTORS = [
  { k:"CHIEN_CON",    n:"Chiên Con",    primary:"#C34C7C", dark:false },
  { k:"AU_NHI",       n:"Ấu Nhi",       primary:"#378630", dark:false },
  { k:"THIEU_NHI",    n:"Thiếu Nhi",    primary:"#1079CD", dark:false },
  { k:"NGHIA_SI",     n:"Nghĩa Sĩ",     primary:"#C48401", dark:true  },
  { k:"HIEP_SI",      n:"Hiệp Sĩ",      primary:"#7A5136", dark:false },
  { k:"HUYNH_TRUONG", n:"Huynh Trưởng", primary:"#CE4846", dark:false },
];

console.log("=".repeat(98));
console.log("BẢNG MÀU CUỐI — primary / hover / active, kiểm WCAG AA (>= 4,5:1)");
console.log("=".repeat(98));
let fail = 0;
const out = {};
for (const s of SECTORS) {
  const { L, C, h } = hexToOklch(s.primary);
  const fg  = s.dark ? INK : W;
  const dir = s.dark ? +1 : -1;                 // <-- điểm mấu chốt
  const hover  = oklchToHex(L + dir*0.045, C, h);
  const active = oklchToHex(L + dir*0.085, C, h);
  const cP=r2(contrast(fg,s.primary)), cH=r2(contrast(fg,hover)), cA=r2(contrast(fg,active));
  const ok = cP>=4.5 && cH>=4.5 && cA>=4.5; if(!ok) fail++;
  out[s.k] = { primary:s.primary, hover, active, onPrimary: fg };
  console.log(`${s.n.padEnd(13)} chữ ${s.dark?"ĐẬM ":"TRẮNG"} | ${s.primary} ${String(cP).padStart(5)}` +
              ` -> hover ${hover} ${String(cH).padStart(5)} -> active ${active} ${String(cA).padStart(5)}  ${ok?"ĐẠT":"** TRƯỢT **"}`);
}

console.log("\n" + "=".repeat(98));
console.log("border / focus-ring tính lại từ hex primary thật (ngưỡng >= 3:1 với nền trang)");
console.log("=".repeat(98));
for (const s of SECTORS) {
  const { C, h } = hexToOklch(s.primary);
  const find = (chroma) => { for(let L=0.98;L>=0.15;L-=0.002){ const x=oklchToHex(L,chroma,h); if(contrast(x,PAGE)>=3) return x; } };
  const border = find(Math.min(C*0.5, 0.07));
  const ring   = find(C);
  out[s.k].border = border; out[s.k].ring = ring;
  const cB=r2(contrast(border,PAGE)), cR=r2(contrast(ring,PAGE));
  if(cB<3||cR<3) fail++;
  console.log(`  ${s.n.padEnd(13)} border ${border} (${cB}:1)  ·  ring ${ring} (${cR}:1)`);
}

console.log("\n" + "=".repeat(98));
console.log("Bốn bậc nền pastel tính lại từ hex primary thật + kiểm chữ đậm");
console.log("=".repeat(98));
for (const s of SECTORS) {
  const { C, h } = hexToOklch(s.primary);
  const tint       = oklchToHex(0.965, Math.min(C*0.22,0.035), h);
  const soft       = oklchToHex(0.925, Math.min(C*0.38,0.058), h);
  const pastel     = oklchToHex(0.885, Math.min(C*0.55,0.085), h);
  const pastelDeep = oklchToHex(0.845, Math.min(C*0.70,0.105), h);
  Object.assign(out[s.k], { tint, soft, pastel, pastelDeep });
  const c1=r2(contrast(INK,pastel)), c2=r2(contrast(INK,pastelDeep));
  if(c1<4.5||c2<4.5) fail++;
  console.log(`  ${s.n.padEnd(13)} tint ${tint} · soft ${soft} · pastel ${pastel} · deep ${pastelDeep}` +
              `   INK/pastel ${c1} · INK/deep ${c2}  ${c1>=4.5&&c2>=4.5?"ĐẠT":"TRƯỢT"}`);
}

console.log(`\n>>> KẾT LUẬN: ${fail===0 ? "TOÀN BỘ ĐẠT WCAG AA" : fail+" mục TRƯỢT"}`);
console.log("\n--- Dán vào src/lib/theme/sector-palette.ts ---");
console.log(JSON.stringify(out, null, 2));
