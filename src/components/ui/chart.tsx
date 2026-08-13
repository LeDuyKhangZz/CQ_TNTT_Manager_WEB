import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Biểu đồ — 05 §3.3 #21, 09 §7. Dự án **không có thư viện biểu đồ nào** và
 * quyết định Q-09/Q-10 là **tự vẽ SVG**, không thêm phụ thuộc: chỉ cần 2–3 loại
 * đơn giản, còn thư viện biểu đồ thường 40–100KB mã chạy trên trình duyệt —
 * đi ngược quyết định kiến trúc cho máy yếu, mạng phòng học kém.
 *
 * Ba luật bắt buộc của 09 §7:
 *   • Màu chuỗi dùng thẳng `--theme-chart` (= `--theme-primary` của ngành).
 *   • 🔴 B-1 **Không dùng bậc `pastel` làm màu chuỗi** — đo được 10/10 cặp dễ nhầm.
 *   • 🔴 B-2 **Nhãn trực tiếp trên đường/cột**, áp cho mọi biểu đồ kể cả một màu.
 *
 * Mù màu **không xử lý** — quyết định có ý thức của chủ dự án (Q-09). Bù lại,
 * mọi biểu đồ đều kèm **bảng số liệu cho trình đọc màn hình**: người không nhìn
 * được hình vẫn lấy được đúng từng con số, và đó cũng là cách thoả điều cấm thứ
 * 5 (màu không phải tín hiệu duy nhất).
 *
 * Không có `"use client"`: biểu đồ là SVG tĩnh dựng ở máy chủ, không tương tác.
 */

export type ChartPoint = {
  /** Nhãn trục hoành. Giữ ngắn — 360px không có chỗ cho chữ dài. */
  label: string;
  value: number;
};

type ChartFrameProps = {
  title: string;
  /** Ẩn tiêu đề khỏi màn hình khi thẻ bao ngoài đã có tiêu đề y hệt. */
  hideTitle?: boolean;
  data: readonly ChartPoint[];
  /** Tên cột giá trị trong bảng số liệu, ví dụ "Số buổi có mặt". */
  valueLabel: string;
  formatValue: (value: number) => string;
  children: React.ReactNode;
  className?: string;
};

/** Khung chung: `<figure>` + tiêu đề + SVG + bảng số liệu ẩn. */
function ChartFrame({
  title,
  hideTitle,
  data,
  valueLabel,
  formatValue,
  children,
  className,
}: ChartFrameProps) {
  return (
    <figure className={cn("m-0 w-full", className)}>
      <figcaption
        className={cn("mb-2 text-sm font-semibold text-ink", hideTitle && "sr-only")}
      >
        {title}
      </figcaption>

      {children}

      {/* Bảng số liệu tương đương. `sr-only` chứ không `aria-hidden`: đây là
          đường duy nhất để người dùng trình đọc màn hình lấy được số. */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Mục</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

const DEFAULT_FORMAT = (value: number) => String(value);

export type SeriesChartProps = {
  title: string;
  hideTitle?: boolean;
  data: readonly ChartPoint[];
  valueLabel?: string;
  formatValue?: (value: number) => string;
  /** Ép trần trục tung. Bỏ trống thì lấy giá trị lớn nhất trong dữ liệu. */
  max?: number;
  className?: string;
};

/* -------------------------------------------------------------------------
   Toạ độ: vẽ trong hệ toạ độ cố định rồi để `viewBox` co giãn theo bề rộng
   thật. Nhờ vậy một biểu đồ vừa 360px vừa 1366px mà không phải đo DOM —
   tức là không cần JS trên trình duyệt.
   ------------------------------------------------------------------------- */
const PAD_X = 8;
const PAD_TOP = 22; // chỗ cho nhãn giá trị nằm TRÊN cột/điểm (B-2)
const PAD_BOTTOM = 22; // chỗ cho nhãn trục hoành
const PLOT_HEIGHT = 120;
const SLOT_WIDTH = 56;

function plotMax(data: readonly ChartPoint[], max?: number): number {
  const highest = data.reduce((acc, point) => Math.max(acc, point.value), 0);
  return Math.max(1, max ?? highest);
}

/** Biểu đồ cột — dùng cho "sĩ số theo ngành", "số buổi vắng theo tuần". */
export function BarChart({
  title,
  hideTitle,
  data,
  valueLabel = "Giá trị",
  formatValue = DEFAULT_FORMAT,
  max,
  className,
}: SeriesChartProps) {
  const top = plotMax(data, max);
  const width = Math.max(1, data.length) * SLOT_WIDTH + PAD_X * 2;
  const height = PAD_TOP + PLOT_HEIGHT + PAD_BOTTOM;
  const barWidth = 28;

  return (
    <ChartFrame
      title={title}
      hideTitle={hideTitle}
      data={data}
      valueLabel={valueLabel}
      formatValue={formatValue}
      className={className}
    >
      <svg
        role="img"
        aria-label={`Biểu đồ cột: ${title}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
      >
        {/* Đường đáy. Không vẽ lưới ngang: 09 §6 chọn "viền ngang nhẹ", thêm
            lưới vào biểu đồ nhỏ chỉ làm nhiễu. */}
        <line
          x1={PAD_X}
          y1={PAD_TOP + PLOT_HEIGHT}
          x2={width - PAD_X}
          y2={PAD_TOP + PLOT_HEIGHT}
          className="stroke-line"
          strokeWidth={1}
        />

        {data.map((point, index) => {
          const centre = PAD_X + index * SLOT_WIDTH + SLOT_WIDTH / 2;
          const barHeight = Math.max(0, (point.value / top) * PLOT_HEIGHT);
          const y = PAD_TOP + PLOT_HEIGHT - barHeight;

          return (
            <g key={point.label}>
              <rect
                x={centre - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                className="fill-theme-chart"
              />
              {/* B-2: nhãn giá trị nằm ngay trên cột, không nằm ở chú giải. */}
              <text
                x={centre}
                y={y - 6}
                textAnchor="middle"
                className="fill-ink text-2xs font-semibold"
              >
                {formatValue(point.value)}
              </text>
              <text
                x={centre}
                y={height - 6}
                textAnchor="middle"
                className="fill-ink-muted text-2xs"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartFrame>
  );
}

/** Biểu đồ đường — dùng cho "tỉ lệ chuyên cần theo tuần". */
export function LineChart({
  title,
  hideTitle,
  data,
  valueLabel = "Giá trị",
  formatValue = DEFAULT_FORMAT,
  max,
  className,
}: SeriesChartProps) {
  const top = plotMax(data, max);
  const width = Math.max(1, data.length) * SLOT_WIDTH + PAD_X * 2;
  const height = PAD_TOP + PLOT_HEIGHT + PAD_BOTTOM;

  const points = data.map((point, index) => ({
    ...point,
    x: PAD_X + index * SLOT_WIDTH + SLOT_WIDTH / 2,
    y: PAD_TOP + PLOT_HEIGHT - Math.max(0, (point.value / top) * PLOT_HEIGHT),
  }));

  return (
    <ChartFrame
      title={title}
      hideTitle={hideTitle}
      data={data}
      valueLabel={valueLabel}
      formatValue={formatValue}
      className={className}
    >
      <svg
        role="img"
        aria-label={`Biểu đồ đường: ${title}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
      >
        <line
          x1={PAD_X}
          y1={PAD_TOP + PLOT_HEIGHT}
          x2={width - PAD_X}
          y2={PAD_TOP + PLOT_HEIGHT}
          className="stroke-line"
          strokeWidth={1}
        />

        {points.length > 1 ? (
          <polyline
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-theme-chart"
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          />
        ) : null}

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r={3.5} className="fill-theme-chart" />
            {/* B-2 áp cho MỌI biểu đồ, kể cả một chuỗi một màu. */}
            <text
              x={point.x}
              y={point.y - 8}
              textAnchor="middle"
              className="fill-ink text-2xs font-semibold"
            >
              {formatValue(point.value)}
            </text>
            <text
              x={point.x}
              y={height - 6}
              textAnchor="middle"
              className="fill-ink-muted text-2xs"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </ChartFrame>
  );
}

export type ProgressRingProps = {
  title: string;
  hideTitle?: boolean;
  value: number;
  max?: number;
  /** Chữ lớn giữa vòng. Mặc định là phần trăm. */
  centreLabel?: string;
  /** Câu mô tả dưới vòng, ví dụ "18/19 lớp đã chốt". */
  description?: string;
  className?: string;
};

/** Vòng tiến độ — dùng cho "số lớp đã chốt bảng điểm". */
export function ProgressRing({
  title,
  hideTitle,
  value,
  max = 100,
  centreLabel,
  description,
  className,
}: ProgressRingProps) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const ratio = clamped / safeMax;
  const percent = Math.round(ratio * 100);

  const size = 120;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <ChartFrame
      title={title}
      hideTitle={hideTitle}
      data={[{ label: title, value: clamped }]}
      valueLabel={`Trên tổng ${safeMax}`}
      formatValue={(v) => `${v}/${safeMax} (${percent}%)`}
      className={className}
    >
      <div className="flex items-center gap-4">
        <svg
          role="img"
          aria-label={`${title}: ${clamped} trên ${safeMax}, ${percent} phần trăm`}
          viewBox={`0 0 ${size} ${size}`}
          className="h-28 w-28 shrink-0"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-line"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * ratio} ${circumference}`}
            // Bắt đầu từ 12 giờ thay vì 3 giờ.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="stroke-theme-chart"
          />
          {/* Con số nằm giữa vòng — B-2 cho vòng tiến độ. */}
          <text
            x={size / 2}
            y={size / 2 + 6}
            textAnchor="middle"
            className="fill-ink text-xl font-semibold"
          >
            {centreLabel ?? `${percent}%`}
          </text>
        </svg>

        {description ? (
          <p className="text-sm text-ink-muted" data-numeric>
            {description}
          </p>
        ) : null}
      </div>
    </ChartFrame>
  );
}
