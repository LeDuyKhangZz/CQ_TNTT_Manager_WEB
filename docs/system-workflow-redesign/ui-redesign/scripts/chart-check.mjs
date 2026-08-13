// Q-09 = dùng THẲNG màu ngành cho biểu đồ. Kiểm: 5 ngành giáo lý có phân biệt được
// ở THỊ LỰC BÌNH THƯỜNG không (bỏ qua mù màu theo quyết định của chủ dự án).
import { readFileSync } from "node:fs";
const src = readFileSync("cvd.mjs","utf8").split("const SETS")[0];
const { deltaE, simulate } = await import("data:text/javascript;base64," +
  Buffer.from(src + "\nexport {deltaE, simulate};").toString("base64"));

// Bảng màu ĐÃ DUYỆT: phương án A + N-3 (Nghĩa Sĩ sáng giữ 'vàng nghệ', Hiệp Sĩ đẩy sẫm)
const APPROVED = {
  "Chiên Con":"#C34C7C", "Ấu Nhi":"#378630", "Thiếu Nhi":"#1079CD",
  "Nghĩa Sĩ":"#C48401", "Hiệp Sĩ":"#7A5136", "Huynh Trưởng":"#CE4846",
};
const PASTEL = {
  "Chiên Con":"#FFC7D9", "Ấu Nhi":"#BCE7B6", "Thiếu Nhi":"#BDDDFF",
  "Nghĩa Sĩ":"#FBD29A", "Hiệp Sĩ":"#F3D2BC", "Huynh Trưởng":"#FFCAC5",
};

function report(title, set) {
  const names = Object.keys(set);
  const pairs = [];
  for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++)
    pairs.push({a:names[i], b:names[j], d:deltaE(set[names[i]], set[names[j]])});
  pairs.sort((x,y)=>x.d-y.d);
  const bad = pairs.filter(p=>p.d<0.15);
  console.log(`\n${title}  (${names.length} màu, ${pairs.length} cặp)`);
  pairs.slice(0,4).forEach(p=>{
    const flag = p.d<0.10 ? "DỄ NHẦM" : p.d<0.15 ? "ranh giới" : "ổn";
    console.log(`   ${p.a.padEnd(13)} ↔ ${p.b.padEnd(13)} ΔE=${p.d.toFixed(3)}  ${flag}`);
  });
  console.log(`   => số cặp ΔE<0,15: ${bad.length}/${pairs.length}`);
  return bad;
}

console.log("=".repeat(78));
console.log("Q-09 — DÙNG THẲNG MÀU NGÀNH CHO BIỂU ĐỒ · thị lực bình thường");
console.log("=".repeat(78));

const only5 = {...APPROVED}; delete only5["Huynh Trưởng"];
report("A) Biểu đồ so sánh 5 NGÀNH GIÁO LÝ (trường hợp thực tế)", only5);
report("B) Nếu có thêm Huynh Trưởng (6 màu)", APPROVED);
report("C) Nếu vẽ biểu đồ bằng nền PASTEL 5 ngành", (()=>{const p={...PASTEL};delete p["Huynh Trưởng"];return p;})());
