export const COMMITTEE_POSITIONS = ["supreme_advisor", "leader", "deputy", "member"] as const;
export type CommitteePosition = (typeof COMMITTEE_POSITIONS)[number];

export const COMMITTEE_POSITION_LABELS: Readonly<Record<CommitteePosition, string>> = {
  supreme_advisor: "Cố vấn tối cao",
  leader: "Trưởng ban",
  deputy: "Phó ban",
  member: "Thành viên",
};

/** D-48: chỉ hai chức vụ này được đăng nội dung Ban. */
export const COMMITTEE_CONTENT_POSITIONS: readonly CommitteePosition[] = ["leader", "deputy"];

/** D-47: mỗi nhân sự tối đa hai Ban đang hoạt động. */
export const MAX_ACTIVE_COMMITTEES_PER_STAFF = 2;
