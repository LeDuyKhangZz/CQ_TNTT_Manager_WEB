// Kiểm: 6 màu ngành có phân biệt được với nhau không, kể cả khi mù màu.
// Khoảng cách đo bằng OKLab ΔE (ngưỡng thực dụng: <0.10 = dễ nhầm, 0.10–0.15 = ranh giới, >0.15 = phân biệt tốt)

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const hexToLin = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => srgbToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
};
const linToHex = ([r, g, b]) => {
  const f = (c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, "0");
  };
  return `#${f(r)}${f(g)}${f(b)}`.toUpperCase();
};

function linToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const deltaE = (h1, h2) => {
  const a = linToOklab(hexToLin(h1)), b = linToOklab(hexToLin(h2));
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
};

// Brettel/Viénot-style CVD simulation (LMS, ma trận Machado 2009 mức nặng ~100%)
const CVD = {
  protanopia:   [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia:   [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};
function simulate(hex, kind) {
  const [r, g, b] = hexToLin(hex);
  const M = CVD[kind];
  return linToHex([
    Math.max(0, Math.min(1, M[0][0] * r + M[0][1] * g + M[0][2] * b)),
    Math.max(0, Math.min(1, M[1][0] * r + M[1][1] * g + M[1][2] * b)),
    Math.max(0, Math.min(1, M[2][0] * r + M[2][1] * g + M[2][2] * b)),
  ]);
}

const SETS = {
  "PHƯƠNG ÁN A — Truyền thống đậm (primary, nút đặc chữ trắng)": {
    "Chiên Con": "#C34C7C", "Ấu Nhi": "#378630", "Thiếu Nhi": "#1079CD",
    "Nghĩa Sĩ": "#A16C01", "Hiệp Sĩ": "#9F6B46", "Huynh Trưởng": "#CE4846",
  },
  "PHƯƠNG ÁN B — Ấm dịu (primary, nút đặc chữ trắng)": {
    "Chiên Con": "#B25B72", "Ấu Nhi": "#548243", "Thiếu Nhi": "#357BB2",
    "Nghĩa Sĩ": "#A4690D", "Hiệp Sĩ": "#986D56", "Huynh Trưởng": "#BB584D",
  },
  "PHƯƠNG ÁN A' — Nghĩa Sĩ dùng nền SÁNG + chữ đậm (giữ đúng 'vàng nghệ')": {
    "Chiên Con": "#C34C7C", "Ấu Nhi": "#378630", "Thiếu Nhi": "#1079CD",
    "Nghĩa Sĩ": "#C48401", "Hiệp Sĩ": "#9F6B46", "Huynh Trưởng": "#CE4846",
  },
  "PHƯƠNG ÁN A'' — A' + đẩy Hiệp Sĩ nâu sẫm hơn để tách khỏi Nghĩa Sĩ": {
    "Chiên Con": "#C34C7C", "Ấu Nhi": "#378630", "Thiếu Nhi": "#1079CD",
    "Nghĩa Sĩ": "#C48401", "Hiệp Sĩ": "#7A5136", "Huynh Trưởng": "#CE4846",
  },
};

for (const [title, set] of Object.entries(SETS)) {
  console.log("\n" + "=".repeat(96));
  console.log(title);
  console.log("=".repeat(96));
  const names = Object.keys(set);
  const modes = ["bình thường", "protanopia", "deuteranopia", "tritanopia"];
  const worst = [];
  for (const mode of modes) {
    const mapped = Object.fromEntries(names.map((n) => [n, mode === "bình thường" ? set[n] : simulate(set[n], mode)]));
    const pairs = [];
    for (let i = 0; i < names.length; i += 1)
      for (let j = i + 1; j < names.length; j += 1)
        pairs.push({ a: names[i], b: names[j], d: deltaE(mapped[names[i]], mapped[names[j]]) });
    pairs.sort((x, y) => x.d - y.d);
    const risky = pairs.filter((p) => p.d < 0.15);
    console.log(`\n  ${mode.toUpperCase()} — cặp gần nhau nhất:`);
    for (const p of pairs.slice(0, 3)) {
      const flag = p.d < 0.10 ? "DỄ NHẦM" : p.d < 0.15 ? "ranh giới" : "ổn";
      console.log(`    ${p.a.padEnd(14)} ↔ ${p.b.padEnd(14)} ΔE=${p.d.toFixed(3)}  ${flag}`);
    }
    if (risky.length) worst.push(`${mode}: ${risky.map((p) => `${p.a}/${p.b}`).join(", ")}`);
  }
  console.log(`\n  >> Cặp có nguy cơ nhầm (ΔE<0.15): ${worst.length ? worst.join(" | ") : "KHÔNG CÓ"}`);
}
