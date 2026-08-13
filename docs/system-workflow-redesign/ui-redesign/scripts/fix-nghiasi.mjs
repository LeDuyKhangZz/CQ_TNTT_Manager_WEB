import { readFileSync } from "node:fs";
const base = readFileSync("palette.mjs","utf8").split("/* ---------- Định nghĩa ngành ---------- */")[0];
const { oklchToHex, contrast } = await import("data:text/javascript;base64," + Buffer.from(base+"\nexport {oklchToHex,contrast};").toString("base64"));
const r2=n=>Math.round(n*100)/100;
const PASTEL="#F8D2A1", W="#FFFFFF";
// hue/chroma của Nghĩa Sĩ: h=75, c=0.155
for (let L=0.60; L>=0.35; L-=0.002) {
  const hex = oklchToHex(L, 0.155, 75);
  const cp = contrast(hex, PASTEL), cw = contrast(hex, W);
  if (cp >= 4.5) {
    console.log(`Nghĩa Sĩ accent-strong = ${hex}`);
    console.log(`  trên pastel ${PASTEL} : ${r2(cp)}:1  ${cp>=4.5?"ĐẠT":"TRƯỢT"}`);
    console.log(`  trên trắng            : ${r2(cw)}:1  ${cw>=4.5?"ĐẠT":"TRƯỢT"}`);
    break;
  }
}
