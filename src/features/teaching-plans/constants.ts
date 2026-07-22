export const TEACHING_ITEM_TYPES = ["lesson", "assessment"] as const;

export type TeachingItemType = (typeof TEACHING_ITEM_TYPES)[number];

export const TEACHING_ITEM_TYPE_LABELS: Readonly<Record<TeachingItemType, string>> = {
  lesson: "Bài học",
  assessment: "Kiểm tra",
};

export const TEACHING_MATERIAL_BUCKET = "teaching-materials";
export const TEACHING_MATERIAL_MAX_BYTES = 5 * 1024 * 1024;
export const TEACHING_MATERIAL_ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;
